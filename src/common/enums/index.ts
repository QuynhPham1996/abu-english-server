export enum EUserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum EUserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  STUDENT = 'STUDENT',
}

export enum ENotificationType {
  MESSAGE = 'MESSAGE',
  SUBMIT_EXERCISE = 'SUBMIT_EXERCISE',
  RETURN_EXERCISE = 'RETURN_EXERCISE',
  REGISTER_COURSE = 'REGISTER_COURSE',
}

export enum ECourseStatus {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  COMING_SOON = 'COMING_SOON',
}

export enum ECourseLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum EExerciseStatus {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum ELessonType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ESSAY = 'ESSAY',
}

export enum ELessonArrange {
  RANDOM = 'RANDOM',
  ORDER = 'ORDER',
}

export enum ELessonStatus {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum ETestStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
}
