import { LessonEntity } from 'src/modules/entities/lesson.entity';
import { UserEntity } from 'src/modules/entities/user.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'userLesson' })
export class UserLessonEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user' })
  user: string;

  @Column('uuid', { nullable: true })
  @ManyToOne(() => LessonEntity, (lesson) => lesson.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson' })
  lesson: string;

  @Column({ nullable: true, default: false })
  isPass: boolean;
}
