import { EUserRole, EUserStatus } from 'src/common/enums';
import { CourseEntity } from 'src/modules/entities/course.entity';
import { NotificationEntity } from 'src/modules/entities/notification.entity';
import { UserExerciseEntity } from 'src/modules/entities/userExercise.entity';
import { UserLessonEntity } from 'src/modules/entities/userLesson.entity';

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user' })
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: false, unique: true })
  username: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  phoneNumber: string;

  @Column({ nullable: false })
  password: string;

  @Column({
    type: 'enum',
    nullable: false,
    enum: EUserStatus,
    default: EUserStatus.ACTIVE,
  })
  status: EUserStatus;

  @Column({
    type: 'enum',
    nullable: false,
    enum: EUserRole,
    default: EUserRole.STUDENT,
  })
  role: EUserRole;

  @Column({ nullable: true, type: 'json' })
  token: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @OneToMany(
    () => NotificationEntity,
    (notification) => notification.fromUser,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinTable()
  notificationsFromUser: NotificationEntity[];

  @OneToMany(() => NotificationEntity, (notification) => notification.toUser, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  notificationsToUser: NotificationEntity[];

  @OneToMany(() => CourseEntity, (course) => course.manager, {
    onDelete: 'SET NULL',
  })
  @JoinTable()
  coursesManager: CourseEntity[];

  @ManyToMany(() => CourseEntity, (course) => course.users)
  @JoinTable()
  courses: CourseEntity[];

  @OneToMany(() => UserExerciseEntity, (userExercise) => userExercise.user, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  userExercises: UserExerciseEntity[];

  @OneToMany(() => UserLessonEntity, (userLesson) => userLesson.user, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  userLessons: UserLessonEntity[];
}
