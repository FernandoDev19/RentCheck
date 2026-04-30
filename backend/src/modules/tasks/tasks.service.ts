import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { Rental } from '../rentals/entities/rental.entity';
import { RentalStatusEnum } from '../rentals/enums/rental-status.enum';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum';
import { BiometryRequest } from '../biometry-requests/entities/biometry-request.entity';
import { Renter } from '../renters/entities/renter.entity';
import { StatusBiometryRequest } from '../biometry-requests/enums/status-biometry-request.enum';
import { Notification } from '../notifications/entities/notification.entity';

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
  ) {}

  // ─── 1. Activar rentas pendientes ──────────────────────────────────────────
  // Cada hora en punto
  @Cron(CronExpression.EVERY_HOUR)
  async activatePendingRentals() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

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
        // ── Verificar conflicto de vehículo ──
        if (rental.vehicleId) {
          // ¿Hay una renta LATE con este vehículo?
          const lateConflict = await this.rentalRepository.findOne({
            where: {
              vehicleId: rental.vehicleId,
              rentalStatus: RentalStatusEnum.LATE,
            },
            select: ['id', 'customerId', 'expectedReturnDate'],
            relations: ['customer'],
          });

          if (lateConflict) {
            this.logger.warn(
              `⚠️ Renta ${rental.id} bloqueada — vehículo ${rental.vehicleId} tiene renta tardía ${lateConflict.id}`,
            );

            // Crear notificación de conflicto
            await this.notificationRepository.save({
              renterId: rental.renterId,
              branchId: rental.branchId,
              employeeId: rental.employeeId,
              type: 'vehicle_conflict',
              payload: {
                pendingRentalId: rental.id,
                lateRentalId: lateConflict.id,
                vehicleId: rental.vehicleId,
                lateExpectedReturn: lateConflict.expectedReturnDate,
                message: `El vehículo tiene una renta tardía sin devolver. La renta pendiente no pudo activarse automáticamente.`,
              },
              read: false,
            });

            blocked++;
            continue; // No activar esta renta
          }

          // ¿El vehículo está robado o en mantenimiento?
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

            await this.notificationRepository.save({
              renterId: rental.renterId,
              branchId: rental.branchId,
              employeeId: rental.employeeId,
              type: 'vehicle_unavailable',
              payload: {
                pendingRentalId: rental.id,
                vehicleId: rental.vehicleId,
                vehiclePlate: vehicle.plate,
                vehicleStatus: vehicle.status,
                message: `El vehículo ${vehicle.plate} está en estado "${vehicle.status}" y no puede activarse.`,
              },
              read: false,
            });

            blocked++;
            continue;
          }

          // Todo bien — marcar vehículo como rentado
          await this.vehicleRepository.update(rental.vehicleId, {
            status: VehicleStatus.RENTED,
          });
        }

        // Activar la renta
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
  // Cada hora en punto
  @Cron(CronExpression.EVERY_HOUR)
  async markLateRentals() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    this.logger.log('⏰ [CRON] Marcando rentas tardías...');

    const activeRentals = await this.rentalRepository.find({
      where: {
        rentalStatus: RentalStatusEnum.ACTIVE,
        expectedReturnDate: LessThan(now),
      },
      select: ['id'],
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

    const lateRentals = await this.rentalRepository.find({
      where: { id: In(ids) },
      select: [
        'id',
        'renterId',
        'branchId',
        'employeeId',
        'vehicleId',
        'expectedReturnDate',
      ],
    });

    for (const rental of lateRentals) {
      await this.notificationRepository.save({
        renterId: rental.renterId,
        branchId: rental.branchId,
        employeeId: rental.employeeId,
        type: 'late_rental',
        payload: {
          rentalId: rental.id,
          vehicleId: rental.vehicleId,
          expectedReturnDate: rental.expectedReturnDate,
          message: `Una renta venció sin ser devuelta.`,
        },
        read: false,
      });
    }

    this.logger.log(`✅ [CRON] Rentas marcadas como tardías: ${ids.length}`);
  }

  // ─── 3. Expirar biometrías pendientes ─────────────────────────────────────
  // Cada día a las 2am
  @Cron('0 2 * * *')
  async expirePendingBiometries() {
    this.logger.log('⏰ [CRON] Expirando biometrías pendientes...');

    // Biometrías pendientes con más de 48 horas sin respuesta
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

  // ─── 4. Alerta de saldo bajo ───────────────────────────────────────────────
  // Cada día a las 8am
  @Cron('0 8 * * *')
  async checkLowBalance() {
    this.logger.log('⏰ [CRON] Revisando saldos bajos...');

    const renters = await this.renterRepository
      .createQueryBuilder('renter')
      .where('renter.lowBalanceAlertEnabled = true')
      .andWhere('renter.balance <= renter.lowBalanceThreshold')
      .andWhere('renter.status = :status', { status: 'active' })
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

    for (const renter of renters) {
      // TODO: reemplazar con envío de email cuando se integre SendGrid/Nodemailer
      this.logger.warn(
        `⚠️ Saldo bajo — ${renter.name}: $${renter.balance} (umbral: $${renter.lowBalanceThreshold})`,
      );
    }

    this.logger.log(`✅ [CRON] Rentadoras con saldo bajo: ${renters.length}`);
  }
}
