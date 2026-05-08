import { EExerciseStatus } from 'src/common/enums';
import { CourseEntity } from 'src/modules/entities/course.entity';
import { LessonEntity } from 'src/modules/entities/lesson.entity';
import { UserExerciseEntity } from 'src/modules/entities/userExercise.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'exercise' })
export class ExerciseEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'longtext' })
  name: string;

  @Column({ nullable: true, type: 'longtext' })
  description: string;

  @Column({
    nullable: false,
    type: 'enum',
    enum: EExerciseStatus,
    default: EExerciseStatus.PUBLIC,
  })
  status: EExerciseStatus;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true, default: 0 })
  videoDuration: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => CourseEntity, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course' })
  course: string;

  @OneToMany(() => LessonEntity, (lesson) => lesson.exercise, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  lessons: LessonEntity[];

  @OneToMany(
    () => UserExerciseEntity,
    (userExercise) => userExercise.exercise,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinTable()
  userExercises: UserExerciseEntity[];
}
