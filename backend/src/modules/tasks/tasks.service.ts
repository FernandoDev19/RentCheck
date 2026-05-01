import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { Rental } from '../rentals/entities/rental.entity';
import { RentalStatusEnum } from '../rentals/enums/rental-status.enum';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum';
import { BiometryRequest } from '../biometry-requests/entities/biometry-request.entity';
import { Renter } from '../renters/entities/renter.entity';
import { RenterStatus } from '../renters/enums/renter-status.enum';
import { StatusBiometryRequest } from '../biometry-requests/enums/status-biometry-request.enum';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { RentalFeedback } from '../rental-feedbacks/entities/rental-feedback.entity';
import { Plan } from '../plans/entities/plan.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(BiometryRequest)
    private readonly biometryRepository: Repository<BiometryRequest>,
    @InjectRepository(Renter)
    private readonly renterRepository: Repository<Renter>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(RentalFeedback)
    private readonly feedbackRepository: Repository<RentalFeedback>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Fecha de hoy a medianoche (00:00:00.000) en hora local */
  private today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Guarda una notificación de forma centralizada */
  private notify(data: {
    renterId: string;
    branchId?: string | null;
    employeeId?: string | null;
    type: NotificationType;
    payload: Record<string, unknown>;
  }) {
    return this.notificationRepository.save({
      renterId: data.renterId,
      branchId: data.branchId ?? null,
      employeeId: data.employeeId ?? null,
      type: data.type,
      payload: data.payload,
      read: false,
    });
  }

  // ─── 1. Activar rentas pendientes ──────────────────────────────────────────
  // Cada hora. Revisa rentas PENDING cuya startDate ya llegó y las activa.
  // Bloquea si el vehículo tiene renta tardía en curso o está en mal estado.
  @Cron(CronExpression.EVERY_HOUR)
  async activatePendingRentals() {
    const now = this.today();
    this.logger.log('⏰ [CRON] Activando rentas pendientes...');

    const pendingRentals = await this.rentalRepository.find({
      where: {
        rentalStatus: RentalStatusEnum.PENDING,
        startDate: LessThanOrEqual(now),
      },
      select: ['id', 'vehicleId', 'renterId', 'branchId', 'employeeId'],
    });

    if (pendingRentals.length === 0) {
      this.logger.log('✅ Sin rentas pendientes para activar');
      return;
    }

    let activated = 0;
    let blocked = 0;
    let errors = 0;

    for (const rental of pendingRentals) {
      try {
        if (rental.vehicleId) {
          // ── Conflicto: vehículo con renta tardía en curso ──
          const lateConflict = await this.rentalRepository.findOne({
            where: {
              vehicleId: rental.vehicleId,
              rentalStatus: RentalStatusEnum.LATE,
            },
            select: ['id', 'customerId', 'expectedReturnDate'],
          });

          if (lateConflict) {
            this.logger.warn(
              `⚠️ Renta ${rental.id} bloqueada — vehículo ${rental.vehicleId} tiene renta tardía ${lateConflict.id}`,
            );
            await this.notify({
              renterId: rental.renterId,
              branchId: rental.branchId,
              employeeId: rental.employeeId,
              type: NotificationType.VEHICLE_CONFLICT,
              payload: {
                pendingRentalId: rental.id,
                lateRentalId: lateConflict.id,
                vehicleId: rental.vehicleId,
                lateExpectedReturn: lateConflict.expectedReturnDate,
                message: `El vehículo tiene una renta tardía sin devolver. La renta pendiente no pudo activarse automáticamente.`,
              },
            });
            blocked++;
            continue;
          }

          // ── Conflicto: vehículo robado o en mantenimiento ──
          const vehicle = await this.vehicleRepository.findOne({
            where: { id: rental.vehicleId },
            select: ['id', 'status', 'plate'],
          });

          if (
            vehicle?.status === VehicleStatus.STOLEN ||
            vehicle?.status === VehicleStatus.MAINTENANCE
          ) {
            this.logger.warn(
              `⚠️ Renta ${rental.id} bloqueada — vehículo ${vehicle.plate} en estado: ${vehicle.status}`,
            );
            await this.notify({
              renterId: rental.renterId,
              branchId: rental.branchId,
              employeeId: rental.employeeId,
              type: NotificationType.VEHICLE_UNAVAILABLE,
              payload: {
                pendingRentalId: rental.id,
                vehicleId: rental.vehicleId,
                vehiclePlate: vehicle.plate,
                vehicleStatus: vehicle.status,
                message: `El vehículo ${vehicle.plate} está en estado "${vehicle.status}" y no puede activarse.`,
              },
            });
            blocked++;
            continue;
          }

          // ── Todo ok: marcar vehículo como RENTED ──
          await this.vehicleRepository.update(rental.vehicleId, {
            status: VehicleStatus.RENTED,
          });
        }

        await this.rentalRepository.update(rental.id, {
          rentalStatus: RentalStatusEnum.ACTIVE,
        });

        activated++;
      } catch (error) {
        const msg =
          error instanceof Error
            ? ((error as { response?: string }).response ?? error.message)
            : String(error);
        this.logger.error(`❌ Error activando renta ${rental.id}: ${msg}`);
        errors++;
      }
    }

    this.logger.log(
      `✅ [CRON] Activadas: ${activated} | Bloqueadas: ${blocked} | Errores: ${errors}`,
    );
  }

  // ─── 2. Marcar rentas tardías ──────────────────────────────────────────────
  // Cada hora. Rentas ACTIVE cuya expectedReturnDate ya pasó → LATE.
  // También libera el vehículo de rentas LATE cuyo vehículo ya fue devuelto
  // manualmente (actualReturnDate presente).
  @Cron(CronExpression.EVERY_HOUR)
  async markLateRentals() {
    const now = this.today();
    this.logger.log('⏰ [CRON] Marcando rentas tardías...');

    const activeRentals = await this.rentalRepository.find({
      where: {
        rentalStatus: RentalStatusEnum.ACTIVE,
        expectedReturnDate: LessThan(now),
      },
      select: [
        'id',
        'renterId',
        'branchId',
        'employeeId',
        'vehicleId',
        'expectedReturnDate',
      ],
    });

    if (activeRentals.length === 0) {
      this.logger.log('✅ Sin rentas tardías');
      return;
    }

    const ids = activeRentals.map((r) => r.id);

    await this.rentalRepository
      .createQueryBuilder()
      .update(Rental)
      .set({ rentalStatus: RentalStatusEnum.LATE })
      .whereInIds(ids)
      .execute();

    for (const rental of activeRentals) {
      await this.notify({
        renterId: rental.renterId,
        branchId: rental.branchId,
        employeeId: rental.employeeId,
        type: NotificationType.LATE_RENTAL,
        payload: {
          rentalId: rental.id,
          vehicleId: rental.vehicleId,
          expectedReturnDate: rental.expectedReturnDate,
          message: `Una renta venció sin ser devuelta.`,
        },
      });
    }

    this.logger.log(`✅ [CRON] Rentas marcadas como tardías: ${ids.length}`);
  }

  // ─── 3. Feedback pendiente ─────────────────────────────────────────────────
  // Cada día a las 9am. Rentas RETURNED desde hace más de 24h sin feedback
  // generan una notificación de recordatorio.
  @Cron('0 9 * * *')
  async alertPendingFeedback() {
    this.logger.log('⏰ [CRON] Revisando feedbacks pendientes...');

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    // Rentas devueltas antes del cutoff sin feedback asociado
    const rentalsWithoutFeedback = await this.rentalRepository
      .createQueryBuilder('rental')
      .leftJoin(RentalFeedback, 'feedback', 'feedback.rental_id = rental.id')
      .where('rental.rentalStatus = :status', {
        status: RentalStatusEnum.RETURNED,
      })
      .andWhere('rental.actualReturnDate IS NOT NULL')
      .andWhere('rental.actualReturnDate < :cutoff', { cutoff })
      .andWhere('feedback.id IS NULL')
      .select([
        'rental.id',
        'rental.renterId',
        'rental.branchId',
        'rental.employeeId',
        'rental.vehicleId',
        'rental.actualReturnDate',
      ])
      .getRawMany<{
        rental_id: string;
        rental_renterId: string;
        rental_branchId: string | null;
        rental_employeeId: string | null;
        rental_vehicleId: string | null;
        rental_actualReturnDate: Date;
      }>();

    if (rentalsWithoutFeedback.length === 0) {
      this.logger.log('✅ Sin feedbacks pendientes');
      return;
    }

    // Evitar duplicar notificaciones: verificar las ya enviadas hoy
    const today = this.today();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rentalIds = rentalsWithoutFeedback.map((r) => r.rental_id);

    const alreadyNotified = await this.notificationRepository
      .createQueryBuilder('n')
      .where('n.type = :type', { type: NotificationType.FEEDBACK_PENDING })
      .andWhere("n.payload->>'rentalId' IN (:...ids)", { ids: rentalIds })
      .andWhere('n.createdAt >= :today', { today })
      .select("n.payload->>'rentalId'", 'rentalId')
      .getRawMany<{ rentalId: string }>();

    const alreadyNotifiedSet = new Set(alreadyNotified.map((n) => n.rentalId));

    let sent = 0;
    for (const row of rentalsWithoutFeedback) {
      if (alreadyNotifiedSet.has(row.rental_id)) continue;

      await this.notify({
        renterId: row.rental_renterId,
        branchId: row.rental_branchId,
        employeeId: row.rental_employeeId,
        type: NotificationType.FEEDBACK_PENDING,
        payload: {
          rentalId: row.rental_id,
          vehicleId: row.rental_vehicleId,
          returnedAt: row.rental_actualReturnDate,
          message: `La renta fue devuelta hace más de 24 horas y aún no tiene feedback registrado.`,
        },
      });
      sent++;
    }

    this.logger.log(`✅ [CRON] Recordatorios de feedback enviados: ${sent}`);
  }

  // ─── 4. Expirar biometrías pendientes ─────────────────────────────────────
  // Cada día a las 2am. Biometrías PENDING con más de 48h → EXPIRED.
  @Cron('0 2 * * *')
  async expirePendingBiometries() {
    this.logger.log('⏰ [CRON] Expirando biometrías pendientes...');

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);

    const result = await this.biometryRepository
      .createQueryBuilder()
      .update(BiometryRequest)
      .set({ status: StatusBiometryRequest.EXPIRED })
      .where('status = :status', { status: StatusBiometryRequest.PENDING })
      .andWhere('created_at < :cutoff', { cutoff })
      .execute();

    this.logger.log(`✅ [CRON] Biometrías expiradas: ${result.affected ?? 0}`);
  }

  // ─── 5. Alerta de saldo bajo ───────────────────────────────────────────────
  // Cada día a las 8am. Rentadoras con saldo <= umbral y alerta habilitada.
  // Crea notificación interna (no duplicada si ya existe una no leída hoy).
  @Cron('0 8 * * *')
  async checkLowBalance() {
    this.logger.log('⏰ [CRON] Revisando saldos bajos...');

    const renters = await this.renterRepository
      .createQueryBuilder('renter')
      .where('renter.lowBalanceAlertEnabled = true')
      .andWhere('renter.balance <= renter.lowBalanceThreshold')
      .andWhere('renter.status = :status', { status: RenterStatus.ACTIVE })
      .select([
        'renter.id',
        'renter.name',
        'renter.balance',
        'renter.lowBalanceThreshold',
      ])
      .getMany();

    if (renters.length === 0) {
      this.logger.log('✅ Sin rentadoras con saldo bajo');
      return;
    }

    const today = this.today();
    let sent = 0;

    for (const renter of renters) {
      this.logger.warn(
        `⚠️ Saldo bajo — ${renter.name}: $${renter.balance} (umbral: $${renter.lowBalanceThreshold})`,
      );

      // Evitar duplicar notificaciones del mismo día
      const alreadySent = await this.notificationRepository.findOne({
        where: {
          renterId: renter.id,
          type: NotificationType.LOW_BALANCE,
        },
        order: { createdAt: 'DESC' },
        select: ['id', 'createdAt'],
      });

      if (alreadySent && alreadySent.createdAt >= today) {
        continue; // Ya fue notificado hoy
      }

      await this.notify({
        renterId: renter.id,
        type: NotificationType.LOW_BALANCE,
        payload: {
          balance: renter.balance,
          threshold: renter.lowBalanceThreshold,
          message: `Saldo bajo: $${renter.balance} (umbral configurado: $${renter.lowBalanceThreshold}).`,
        },
      });
      sent++;
    }

    this.logger.log(
      `✅ [CRON] Alertas de saldo bajo enviadas: ${sent} / ${renters.length}`,
    );
  }

  // ─── 6. Alertar planes por vencer ─────────────────────────────────────────
  // Cada día a las 7am. Rentadoras cuyo planExpiresAt es en exactamente 7 días.
  // Envía notificación de aviso anticipado.
  @Cron('0 7 * * *')
  async alertExpiringPlans() {
    this.logger.log('⏰ [CRON] Revisando planes por vencer...');

    const in7days = new Date();
    in7days.setDate(in7days.getDate() + 7);
    in7days.setHours(0, 0, 0, 0);

    const in8days = new Date(in7days);
    in8days.setDate(in8days.getDate() + 1);

    const renters = await this.renterRepository
      .createQueryBuilder('renter')
      .innerJoinAndSelect('renter.plan', 'plan')
      .where('renter.planExpiresAt >= :start', { start: in7days })
      .andWhere('renter.planExpiresAt < :end', { end: in8days })
      .andWhere('renter.status = :status', { status: RenterStatus.ACTIVE })
      .select([
        'renter.id',
        'renter.name',
        'renter.planExpiresAt',
        'plan.name',
        'plan.id',
      ])
      .getMany();

    if (renters.length === 0) {
      this.logger.log('✅ Sin planes por vencer en 7 días');
      return;
    }

    for (const renter of renters) {
      this.logger.warn(
        `⚠️ Plan por vencer — ${renter.name}: vence el ${renter.planExpiresAt?.toISOString()}`,
      );

      await this.notify({
        renterId: renter.id,
        type: NotificationType.PLAN_EXPIRING_SOON,
        payload: {
          planName: renter.plan?.name,
          expiresAt: renter.planExpiresAt,
          daysRemaining: 7,
          message: `Tu plan "${renter.plan?.name}" vence en 7 días. Renuévalo para evitar la suspensión del servicio.`,
        },
      });
    }

    this.logger.log(
      `✅ [CRON] Avisos de plan por vencer enviados: ${renters.length}`,
    );
  }

  // ─── 7. Expirar planes vencidos → suspender rentadora ─────────────────────
  // Cada día a las 0am (medianoche). Rentadoras cuyo planExpiresAt ya pasó
  // y siguen en estado ACTIVE → se suspenden y se les notifica.
  @Cron('0 0 * * *')
  async expireOverduePlans() {
    const now = new Date();
    this.logger.log('⏰ [CRON] Revisando planes vencidos...');

    const expiredRenters = await this.renterRepository
      .createQueryBuilder('renter')
      .innerJoinAndSelect('renter.plan', 'plan')
      .where('renter.planExpiresAt IS NOT NULL')
      .andWhere('renter.planExpiresAt < :now', { now })
      .andWhere('renter.status = :status', { status: RenterStatus.ACTIVE })
      .select([
        'renter.id',
        'renter.name',
        'renter.planExpiresAt',
        'plan.name',
        'plan.id',
      ])
      .getMany();

    if (expiredRenters.length === 0) {
      this.logger.log('✅ Sin planes vencidos');
      return;
    }

    const expiredIds = expiredRenters.map((r) => r.id);

    // Suspender todas en un solo UPDATE
    await this.renterRepository
      .createQueryBuilder()
      .update(Renter)
      .set({ status: RenterStatus.SUSPENDED })
      .where('id IN (:...ids)', { ids: expiredIds })
      .execute();

    for (const renter of expiredRenters) {
      this.logger.warn(
        `🔴 Rentadora suspendida — ${renter.name} (plan expiró: ${renter.planExpiresAt?.toISOString()})`,
      );

      await this.notify({
        renterId: renter.id,
        type: NotificationType.PLAN_EXPIRED,
        payload: {
          planName: renter.plan?.name,
          expiredAt: renter.planExpiresAt,
          message: `Tu plan "${renter.plan?.name}" venció y tu cuenta ha sido suspendida. Contacta a soporte para renovar.`,
        },
      });
    }

    this.logger.log(
      `✅ [CRON] Rentadoras suspendidas por plan vencido: ${expiredRenters.length}`,
    );
  }
}
