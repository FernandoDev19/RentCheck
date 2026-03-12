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
    // Vamos a crear 2 rentas por cada cliente para tener historial
    for (let i = 0; i < 4; i++) {
      const randomEmployee =
        employees[Math.floor(Math.random() * employees.length)];
      const isFirstRenta = i === 0;

      // La primera renta será antigua y ya finalizada (con feedback)
      // La segunda renta será reciente y todavía "active"
      const status = isFirstRenta
        ? RentalStatusEnum.RETURNED
        : RentalStatusEnum.ACTIVE;

      const rental: Rental = RentalRepository.create({
        customerId: customer.id,
        employeeId: randomEmployee.id,
        branchId: randomEmployee.branch.id,
        renterId: randomEmployee.branch.renter.id,
        startDate: new Date(2025, 0, 1 + i), // Fechas escalonadas
        expectedReturnDate: new Date(2025, 0, 5 + i),
        actualReturnDate: isFirstRenta ? new Date(2025, 0, 5 + i) : null,
        rentalStatus: status,
      });

      const savedRental = await RentalRepository.save(rental);

      // Si la renta está "returned", le creamos un feedback
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
          score: score,
          criticalFlags: {
            impersonation: Boolean(Math.floor(Math.random() * 2)),
            vehicleTheft: Boolean(Math.floor(Math.random() * 2)),
          },
          comments: [
            'Cliente muy puntual, entregó el vehículo en perfectas condiciones.',
            'Mal cliente',
          ][promedio > 3 ? 0 : 1],
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
  // Obtener todos los feedbacks del cliente
  const feedbacks = await RentalFeedbackRepository.createQueryBuilder(
    'feedback',
  )
    .innerJoin('feedback.rental', 'rental')
    .where('rental.customerId = :customerId', { customerId })
    .getMany();

  if (feedbacks.length === 0) {
    // Sin feedbacks, score es 0 y status normal
    await CustomerRepository.update(customerId, {
      generalScore: 5,
      status: CustomerStatusEnum.NORMAL,
    });
    return 5;
  }

  // Verificar si tiene critical flags
  const hasCriticalFlags = feedbacks.some(
    (feedback) =>
      feedback.criticalFlags.impersonation ||
      feedback.criticalFlags.vehicleTheft,
  );

  // Calcular promedio de los scores de cada feedback
  const totalScore = feedbacks.reduce((sum, feedback) => {
    const feedbackScore = (
      (5 - feedback.score.damageToCar) +
      (5 - feedback.score.unpaidFines) +
      (5 - feedback.score.arrears) +
      (5 - feedback.score.carAbuse) +
      (5 - feedback.score.badAttitude)
      ) / 5;

    return sum + feedbackScore;
  }, 0);

  const averageScore = totalScore / feedbacks.length;
  const roundedScore = Math.round(averageScore * 100) / 100; // 2 decimales

  // Determinar el status basado en las reglas
  let status: CustomerStatusEnum;

  if (hasCriticalFlags) {
    // Prioridad 1: Critical flags = red_alert
    status = CustomerStatusEnum.RED_ALERT;
  } else if (roundedScore < 3) {
    // Prioridad 2: Score bajo = yellow_alert
    status = CustomerStatusEnum.YELLOW_ALERT;
  } else {
    // Todo bien = normal
    status = CustomerStatusEnum.NORMAL;
  }

  // Actualizar el cliente con score y status
  await CustomerRepository.update(customerId, {
    generalScore: roundedScore,
    status: status,
  });

  return roundedScore;
}
