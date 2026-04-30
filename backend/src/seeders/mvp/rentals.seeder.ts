// ─── fakeRentals.seeder.ts ────────────────────────────────────────────────────

import { Repository } from 'typeorm';
import { Rental } from '../../modules/rentals/entities/rental.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { RentalStatusEnum } from '../../modules/rentals/enums/rental-status.enum';
import { RentalFeedback } from '../../modules/rental-feedbacks/entities/rental-feedback.entity';
import { CustomerStatusEnum } from '../../modules/customers/enums/customer-status.enum';
import { Score } from '../../modules/rental-feedbacks/dto/create-rental-feedback.dto';

export async function fakeRentalsSeeder(
  RentalRepository: Repository<Rental>,
  CustomerRepository: Repository<Customer>,
  EmployeeRepository: Repository<Employee>,
  RentalFeedbackRepository: Repository<RentalFeedback>,
) {
  const rentalsCount = await RentalRepository.count();
  if (rentalsCount > 0) return;

  const customers = await CustomerRepository.find();
  const employees = await EmployeeRepository.createQueryBuilder('employee')
    .innerJoinAndSelect('employee.branch', 'branch')
    .innerJoinAndSelect('branch.renter', 'renter')
    .getMany();

  if (customers.length === 0 || employees.length === 0) {
    console.log('Faltan clientes o empleados para sembrar rentas');
    return;
  }

  console.time('Rentals Seeder');

  const rentalsData: Partial<Rental>[] = [];
  const feedbacksData: Partial<RentalFeedback>[] = [];
  const customerScores = new Map<string, number[]>();

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

      const startDate = new Date(2026, i, 1);
      const expectedReturnDate = new Date(2026, i, 7);
      const actualReturnDate = isActive ? null : new Date(2026, i, 7);
      const now = new Date();

      const initialStatus =
        startDate <= now ? status : RentalStatusEnum.PENDING;

      const rentalData = {
        customerId: customer.id,
        employeeId: randomEmployee.id,
        branchId: randomEmployee.branch.id,
        renterId: randomEmployee.branch.renter.id,
        startDate,
        expectedReturnDate,
        actualReturnDate,
        rentalStatus: initialStatus,
        totalPrice: Math.floor(Math.random() * 999999),
      };

      rentalsData.push(rentalData);

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

        // Guardar score para calcular después
        if (!customerScores.has(customer.id)) {
          customerScores.set(customer.id, []);
        }
        customerScores.get(customer.id).push(promedio);

        feedbacksData.push({
          rentalId: null, // Se actualizará después de guardar rentas
          score,
          criticalFlags: {
            impersonation: Math.random() < 0.1,
            vehicleTheft: Math.random() < 0.05,
          },
          comments:
            promedio >= 3
              ? 'Cliente puntual, entregó el vehículo en buenas condiciones.'
              : 'Cliente con comportamiento irregular.',
        });
      }
    }
  }

  // Insertar rentas en lotes para evitar límite de PostgreSQL
  const BATCH_SIZE = 1000;
  const savedRentals: Rental[] = [];

  for (let i = 0; i < rentalsData.length; i += BATCH_SIZE) {
    const batch = rentalsData.slice(i, i + BATCH_SIZE);
    const savedBatch = await RentalRepository.save(batch);
    savedRentals.push(...savedBatch);
  }

  // Actualizar rentalIds en feedbacks
  let feedbackIndex = 0;
  for (const rental of savedRentals) {
    if (rental.rentalStatus === RentalStatusEnum.RETURNED) {
      feedbacksData[feedbackIndex].rentalId = rental.id;
      feedbackIndex++;
    }
  }

  // Insertar feedbacks en lotes para evitar límite de PostgreSQL
  if (feedbacksData.length > 0) {
    const BATCH_SIZE = 1000;
    for (let i = 0; i < feedbacksData.length; i += BATCH_SIZE) {
      const batch = feedbacksData.slice(i, i + BATCH_SIZE);
      await RentalFeedbackRepository.insert(batch);
    }
  }

  // Calcular y actualizar scores de clientes en batch
  const customerUpdates = [];
  for (const [customerId, scores] of customerScores) {
    const averageScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const hasCriticalFlags = Math.random() < 0.15; // Simulación de flags críticos

    const status = hasCriticalFlags
      ? CustomerStatusEnum.RED_ALERT
      : averageScore < 3
        ? CustomerStatusEnum.YELLOW_ALERT
        : CustomerStatusEnum.NORMAL;

    customerUpdates.push({
      id: customerId,
      generalScore: Math.round(averageScore * 100) / 100,
      status,
    });
  }

  // Actualizar scores de clientes en batch
  if (customerUpdates.length > 0) {
    await CustomerRepository.save(customerUpdates);
  }

  console.timeEnd('Rentals Seeder');
  console.log(
    `Rentas y Feedbacks creados: ${savedRentals.length} rentals, ${feedbacksData.length} feedbacks`,
  );
}

// async function recalculateCustomerScore(
//   customerId: string,
//   RentalFeedbackRepository: Repository<RentalFeedback>,
//   CustomerRepository: Repository<Customer>,
// ): Promise<number> {
//   const feedbacks = await RentalFeedbackRepository.createQueryBuilder(
//     'feedback',
//   )
//     .innerJoin('feedback.rental', 'rental')
//     .where('rental.customerId = :customerId', { customerId })
//     .getMany();

//   if (feedbacks.length === 0) {
//     await CustomerRepository.update(customerId, {
//       generalScore: 5,
//       status: CustomerStatusEnum.NORMAL,
//     });
//     return 5;
//   }

//   const hasCriticalFlags = feedbacks.some(
//     (f) => f.criticalFlags.impersonation || f.criticalFlags.vehicleTheft,
//   );

//   // Score directo: 5 = excelente cliente, 0 = pésimo (sin inversión)
//   const totalScore = feedbacks.reduce((sum, f) => {
//     const avg =
//       (f.score.damageToCar +
//         f.score.unpaidFines +
//         f.score.arrears +
//         f.score.carAbuse +
//         f.score.badAttitude) /
//       5;
//     return sum + avg;
//   }, 0);

//   const averageScore = totalScore / feedbacks.length;
//   const roundedScore = Math.round(averageScore * 100) / 100;

//   const status = hasCriticalFlags
//     ? CustomerStatusEnum.RED_ALERT
//     : roundedScore < 3
//       ? CustomerStatusEnum.YELLOW_ALERT
//       : CustomerStatusEnum.NORMAL;

//   await CustomerRepository.update(customerId, {
//     generalScore: roundedScore,
//     status,
//   });

//   return roundedScore;
// }
