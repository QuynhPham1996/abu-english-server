import { EQuestionGroupStatus } from 'src/common/enums';
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

@Entity({ name: 'question_group' })
export class QuestionGroupEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'longtext' })
  name: string;

  @Column({ nullable: true, type: 'longtext' })
  description: string;

  @Column({
    nullable: false,
    type: 'enum',
    enum: EQuestionGroupStatus,
    default: EQuestionGroupStatus.PUBLIC,
  })
  status: EQuestionGroupStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @OneToMany(() => QuestionEntity, (question) => question.group, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  questions: QuestionEntity[];
}
