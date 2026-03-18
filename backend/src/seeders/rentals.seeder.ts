// ─── fakeRentals.seeder.ts ────────────────────────────────────────────────────

import { Repository } from 'typeorm';
import { Rental } from '../modules/rentals/entities/rental.entity';
import { Customer } from '../modules/customers/entities/customer.entity';
import { Employee } from '../modules/employees/entities/employee.entity';
import { RentalStatusEnum } from '../modules/rentals/enums/rental-status.enum';
import {
  CreateRentalFeedbackDto,
  Score,
} from '../modules/rental-feedbacks/dto/create-rental-feedback.dto';
import { RentalFeedback } from '../modules/rental-feedbacks/entities/rental-feedback.entity';
import { CustomerStatusEnum } from '../modules/customers/enums/customer-status.enum';

export async function fakeRentalsSeeder(
  RentalRepository: Repository<Rental>,
  CustomerRepository: Repository<Customer>,
  EmployeeRepository: Repository<Employee>,
  RentalFeedbackRepository: Repository<RentalFeedback>,
) {
  const rentalsCount = await RentalRepository.count();
  if (rentalsCount > 0) return;

  const customers = await CustomerRepository.find();
  const employees = await EmployeeRepository.find({
    relations: ['branch', 'branch.renter'],
  });

  if (customers.length === 0 || employees.length === 0) {
    console.log('Faltan clientes o empleados para sembrar rentas');
    return;
  }

  for (const customer of customers) {
    // 4 rentas por cliente:
    // i=0,1,2 → RETURNED con feedback (historial)
    // i=3     → ACTIVE (renta en curso)
    for (let i = 0; i < 4; i++) {
      const randomEmployee =
        employees[Math.floor(Math.random() * employees.length)];

      const isActive = i === 3;
      const status = isActive
        ? RentalStatusEnum.ACTIVE
        : RentalStatusEnum.RETURNED;

      const startDate = new Date(2025, i, 1);
      const expectedReturnDate = new Date(2025, i, 7);
      const actualReturnDate = isActive ? null : new Date(2025, i, 7);

      const rental = RentalRepository.create({
        customerId: customer.id,
        employeeId: randomEmployee.id,
        branchId: randomEmployee.branch.id,
        renterId: randomEmployee.branch.renter.id,
        startDate,
        expectedReturnDate,
        actualReturnDate,
        rentalStatus: status,
      });

      const savedRental = await RentalRepository.save(rental);

      if (status === RentalStatusEnum.RETURNED) {
        const score: Score = {
          damageToCar: Math.floor(Math.random() * 6),
          unpaidFines: Math.floor(Math.random() * 6),
          arrears: Math.floor(Math.random() * 6),
          carAbuse: Math.floor(Math.random() * 6),
          badAttitude: Math.floor(Math.random() * 6),
        };

        const promedio =
          (score.damageToCar +
            score.unpaidFines +
            score.arrears +
            score.carAbuse +
            score.badAttitude) /
          5;

        const feedback: CreateRentalFeedbackDto = {
          rentalId: savedRental.id,
          score,
          criticalFlags: {
            impersonation: Math.random() < 0.1,
            vehicleTheft: Math.random() < 0.05,
          },
          comments:
            promedio >= 3
              ? 'Cliente puntual, entregó el vehículo en buenas condiciones.'
              : 'Cliente con comportamiento irregular.',
        };

        const savedFeedback = RentalFeedbackRepository.create(feedback);
        await RentalFeedbackRepository.save(savedFeedback);

        await recalculateCustomerScore(
          customer.id,
          RentalFeedbackRepository,
          CustomerRepository,
        );
      }
    }
  }

  console.log('✅ Rentas y Feedbacks creados exitosamente');
}

async function recalculateCustomerScore(
  customerId: string,
  RentalFeedbackRepository: Repository<RentalFeedback>,
  CustomerRepository: Repository<Customer>,
): Promise<number> {
  const feedbacks = await RentalFeedbackRepository.createQueryBuilder(
    'feedback',
  )
    .innerJoin('feedback.rental', 'rental')
    .where('rental.customerId = :customerId', { customerId })
    .getMany();

  if (feedbacks.length === 0) {
    await CustomerRepository.update(customerId, {
      generalScore: 5,
      status: CustomerStatusEnum.NORMAL,
    });
    return 5;
  }

  const hasCriticalFlags = feedbacks.some(
    (f) => f.criticalFlags.impersonation || f.criticalFlags.vehicleTheft,
  );

  // Score directo: 5 = excelente cliente, 0 = pésimo (sin inversión)
  const totalScore = feedbacks.reduce((sum, f) => {
    const avg =
      (f.score.damageToCar +
        f.score.unpaidFines +
        f.score.arrears +
        f.score.carAbuse +
        f.score.badAttitude) /
      5;
    return sum + avg;
  }, 0);

  const averageScore = totalScore / feedbacks.length;
  const roundedScore = Math.round(averageScore * 100) / 100;

  const status = hasCriticalFlags
    ? CustomerStatusEnum.RED_ALERT
    : roundedScore < 3
      ? CustomerStatusEnum.YELLOW_ALERT
      : CustomerStatusEnum.NORMAL;

  await CustomerRepository.update(customerId, {
    generalScore: roundedScore,
    status,
  });

  return roundedScore;
}
