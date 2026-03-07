import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Renter } from '../../renters/entities/renter.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  price: number;

  // Cantidad total de Usuarios a nombre de una rentadora (Owner, Manager & Employees)
  @Column()
  max_users: number;

  // Cantidad total de Sucursales a nombre de una rentadora (Owner)
  @Column()
  max_branches: number;

  // Habilitar reportes avanzados
  @Column()
  advanced_reports_enabled: boolean;

  @Column()
  email_alerts_enabled: boolean;

  @Column()
  priority_support: boolean;

  @OneToMany(() => Renter, (renter) => renter.plan)
  renters: Renter[];
}
