import { ETestStatus } from 'src/common/enums';
import { TUserAnswer } from 'src/common/types';
import { LessonEntity } from 'src/modules/entities/lesson.entity';
import { UserEntity } from 'src/modules/entities/user.entity';
import { UserExerciseEntity } from 'src/modules/entities/userExercise.entity';
import { UserLessonEntity } from 'src/modules/entities/userLesson.entity';
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

@Entity({ name: 'test' })
export class TestEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, default: 0 })
  result: number;

  @Column({ nullable: true, default: 0 })
  duration: number;

  @Column({
    nullable: false,
    type: 'enum',
    enum: ETestStatus,
    default: ETestStatus.PENDING,
  })
  status: ETestStatus;

  @Column({ nullable: true, type: 'json' })
  userAnswers: TUserAnswer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @ManyToOne(() => LessonEntity, (lesson) => lesson.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson' })
  lesson: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user' })
  user: string;

  @ManyToOne(() => UserLessonEntity, (userLesson) => userLesson.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userLesson' })
  userLesson: string;

  @ManyToOne(() => UserExerciseEntity, (userExercise) => userExercise.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userExercise' })
  userExercise: string;
}
