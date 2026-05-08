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
import { TAnswerEntity } from 'src/common/types';

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
}
