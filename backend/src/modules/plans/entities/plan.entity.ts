import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Renter } from '../../renters/entities/renter.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({
    default: 0,
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  price: number;

  // Cantidad total de Usuarios a nombre de una rentadora (Owner, Manager & Employees)
  @Column({ default: 1 })
  max_users: number;

  // Cantidad total de Sucursales a nombre de una rentadora (Owner)
  @Column({ default: 1 })
  max_branches: number;

  // Habilitar reportes avanzados
  @Column({ default: false })
  advanced_reports_enabled: boolean;

  @Column({ default: false })
  email_alerts_enabled: boolean;

  @Column({ default: false })
  priority_support: boolean;

  @Column({ default: 5 })
  max_vehicles: number;

  @OneToMany(() => Renter, (renter) => renter.plan)
  renters: Renter[];
}
