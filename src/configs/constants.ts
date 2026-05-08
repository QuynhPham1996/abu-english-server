import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
config();

export const env = {
  rootUrl: process.env.ROOT_URL,
  baseUrl: process.env.SERVICE_BASE_URL,
};

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DATABASE,

  autoLoadEntities: true,
  synchronize: process.env.MYSQL_SYNC === 'true',
  charset: 'utf8mb4',
  logging: false,
};

export const appConfig = {
  port: process.env.PORT,
  pathStorage: process.env.STORAGE,
};

export const mailConfig = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_POST,
  user: process.env.EMAIL_ID,
  pass: process.env.EMAIL_PASS,
  clientId: process.env.EMAIL_CLIENT_ID,
  clientSecret: process.env.EMAIL_CLIENT_SECRET,
  refreshToken: process.env.EMAIL_REFRESH_TOKEN,
};

export const bcryptConfig = {
  saltRound: Number(process.env.BCRYPT_SALT_ROUNDS),
};

export const jwtConfig = {
  secret: process.env.API_JWT_SECRET,
  expiresIn: process.env.API_JWT_EXPIRES_IN,
};

export const superAdminConfig = {
  username: process.env.SUPER_ADMIN_USER_NAME,
  email: process.env.SUPER_ADMIN_EMAIL,
  password: process.env.SUPER_ADMIN_PASSWORD,
};
