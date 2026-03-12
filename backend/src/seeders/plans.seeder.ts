import { Repository } from 'typeorm';
import { CreatePlanDto } from '../modules/plans/dto/create-plan.dto';
import { Plan } from '../modules/plans/entities/plan.entity';

export async function PlansSeeder(PlanRepository: Repository<Plan>) {
  const plans: CreatePlanDto[] = [
    {
      name: 'Free',
      max_users: 1,
      max_branches: 1,
      advanced_reports_enabled: false,
      email_alerts_enabled: false,
      priority_support: false,
      price: 0,
    },
    {
      name: 'Basic',
      max_users: 5,
      max_branches: 3,
      advanced_reports_enabled: true,
      email_alerts_enabled: true,
      priority_support: false,
      price: 10000,
    },
    {
      name: 'Premium',
      max_users: 9999,
      max_branches: 9999,
      advanced_reports_enabled: true,
      email_alerts_enabled: true,
      priority_support: true,
      price: 50000,
    },
  ];

  if ((await PlanRepository.count()) === 0) {
    await PlanRepository.insert(plans);
  }

  console.log('Plans seeded');
}
