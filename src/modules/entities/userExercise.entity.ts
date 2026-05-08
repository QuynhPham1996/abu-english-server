import { ExerciseEntity } from 'src/modules/entities/exercise.entity';
import { UserEntity } from 'src/modules/entities/user.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'userExercise' })
export class UserExerciseEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user' })
  user: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => ExerciseEntity, (exercise) => exercise.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exercise' })
  exercise: string;

  @Column({ nullable: true, default: false })
  isPass: boolean;
}
