import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity()
@Index(['name'])
@Index(['email'])
@Index(['status'])
@Index(['createdAt'])
export class Customer {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column()
    contact!: string;

    @Column()
    address!: string;

    @Column({
        type: 'varchar',
        default: 'Lead'
    })
    status!: 'Active' | 'Lead' | 'Inactive';

    @Column({ type: 'datetime', nullable: true })
    lastTransaction!: Date;

    @Column({ type: 'float', default: 0 })
    totalSpent!: number;

    @Column({ nullable: true })
    email!: string;

    @Column({ nullable: true })
    phone!: string;

    @Column({ nullable: true })
    company!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
