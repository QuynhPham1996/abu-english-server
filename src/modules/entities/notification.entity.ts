import { ENotificationType } from 'src/common/enums';
import { UserEntity } from 'src/modules/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'notification' })
export class NotificationEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'longtext' })
  message: string;

  @Column({ nullable: true, default: false })
  isRead: boolean;

  @Column({ nullable: true, type: 'json' })
  data: any;

  @Column({
    nullable: false,
    type: 'enum',
    enum: ENotificationType,
    default: ENotificationType.MESSAGE,
  })
  type: ENotificationType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fromUser' })
  fromUser: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'toUser' })
  toUser: string;
}
