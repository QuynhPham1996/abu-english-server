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
import { LessonEntity } from 'src/modules/entities/lesson.entity';
import { AssignmentEntity } from 'src/modules/entities/assignment.entity';
import { QuestionGroupEntity } from 'src/modules/entities/questionGroup.entity';
import { TAnswerEntity } from 'src/common/types';
import { ELessonType } from 'src/common/enums';

@Entity({ name: 'question' })
export class QuestionEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'longtext' })
  question: string;

  @Column({ nullable: false })
  index: number;

  @Column({ nullable: true, type: 'json' })
  answers: TAnswerEntity[];

  @Column({ nullable: true })
  note: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: ELessonType,
    default: ELessonType.MULTIPLE_CHOICE,
  })
  type: ELessonType;

  @Column({ nullable: true, type: 'uuid' })
  sourceQuestionId: string;

  @Column({ nullable: true, type: 'uuid' })
  parentId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => LessonEntity, (lesson) => lesson.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson' })
  lesson: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => AssignmentEntity, (assignment) => assignment.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assignment' })
  assignment: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => QuestionGroupEntity, (group) => group.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'questionGroup' })
  group: string;
}
