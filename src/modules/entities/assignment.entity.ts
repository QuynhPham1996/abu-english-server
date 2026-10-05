import {
  EAssignmentStatus,
  ELessonArrange,
  ELessonType,
} from 'src/common/enums';
import { QuestionEntity } from 'src/modules/entities/question.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'assignment' })
export class AssignmentEntity extends BaseEntity {
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
    enum: EAssignmentStatus,
    default: EAssignmentStatus.PUBLIC,
  })
  status: EAssignmentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @OneToMany(() => QuestionEntity, (question) => question.assignment, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  questions: QuestionEntity[];
}
