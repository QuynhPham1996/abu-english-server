import { ECourseLevel, ECourseStatus } from 'src/common/enums';
import { ExerciseEntity } from 'src/modules/entities/exercise.entity';
import { UserEntity } from 'src/modules/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'course' })
export class CourseEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true, type: 'longtext' })
  description: string;

  @Column({ nullable: true })
  retailPrice: number;

  @Column({ nullable: true })
  sellingPrice: number;

  @Column({
    nullable: false,
    type: 'enum',
    enum: ECourseStatus,
    default: ECourseStatus.PUBLIC,
  })
  status: ECourseStatus;

  @Column({
    nullable: false,
    type: 'enum',
    enum: ECourseLevel,
    default: ECourseLevel.MEDIUM,
  })
  level: ECourseLevel;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager' })
  manager: string;

  @OneToMany(() => ExerciseEntity, (exercise) => exercise.course, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  exercises: ExerciseEntity[];

  @ManyToMany(() => UserEntity, (user) => user.courses)
  @JoinTable()
  users: UserEntity[];
}
