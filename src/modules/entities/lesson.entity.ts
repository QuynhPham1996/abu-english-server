import { ELessonType, ELessonArrange, ELessonStatus } from 'src/common/enums';
import { AssignmentEntity } from 'src/modules/entities/assignment.entity';
import { CourseEntity } from 'src/modules/entities/course.entity';
import { ExerciseEntity } from 'src/modules/entities/exercise.entity';
import { QuestionEntity } from 'src/modules/entities/question.entity';
import { UserLessonEntity } from 'src/modules/entities/userLesson.entity';
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

@Entity({ name: 'lesson' })
export class LessonEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'longtext' })
  name: string;

  @Column({
    nullable: false,
    type: 'enum',
    enum: ELessonType,
    default: ELessonType.MULTIPLE_CHOICE,
  })
  type: ELessonType;

  @Column({
    nullable: true,
    type: 'enum',
    enum: ELessonArrange,
  })
  arrange: ELessonArrange;

  @Column({
    nullable: false,
    type: 'enum',
    enum: ELessonStatus,
    default: ELessonStatus.PUBLIC,
  })
  status: ELessonStatus;

  @Column({ nullable: true, default: 0 })
  index: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => ExerciseEntity, (exercise) => exercise.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exercise' })
  exercise: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => CourseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course' })
  course: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => AssignmentEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sourceAssignment' })
  sourceAssignment: string;

  @OneToMany(() => QuestionEntity, (question) => question.lesson, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  questions: QuestionEntity[];

  @OneToMany(() => UserLessonEntity, (userLesson) => userLesson.lesson, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  userLessons: UserLessonEntity[];
}
