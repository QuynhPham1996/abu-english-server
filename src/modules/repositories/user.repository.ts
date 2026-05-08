import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, Repository } from 'typeorm';

import { UserEntity } from 'src/modules/entities/user.entity';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  constructor(private dataSource: DataSource) {
    super(UserEntity, dataSource.createEntityManager());
  }

  updateUserTokenById = async (
    id: string,
    body: { token: string[] | null },
  ) => {
    const bodyParse = {
      token: body?.token,
    };
    await this.updateUserById(id, bodyParse);
  };

  updateUserById = async (id: string, body: any) => {
    await this.update({ id }, body);
  };

  getExistedUserExceptId = async (
    id?: string,
    data?: { username: string; email: string; phoneNumber: string },
  ) => {
    const qb = await this.createQueryBuilder('user');

    if (id) qb.where('user.id != :id', { id });

    qb.andWhere(
      new Brackets((subQ) => {
        subQ
          .orWhere('user.username = :username', { username: data?.username })
          .orWhere('user.email = :email', { email: data?.email })
          .orWhere('user.phoneNumber = :phoneNumber', {
            phoneNumber: data?.phoneNumber,
          });
      }),
    );

    return qb.getOne();
  };

  getUserById = async (id: string) => {
    return await this.createQueryBuilder('user')
      .where('user.id = :id', { id })
      .getOne();
  };

  getUserByUserName = async (username: string, id?: string) => {
    return await this.createQueryBuilder('user')
      .where('user.username = :username', { username })
      .andWhere('user.id != :id', { id: id || '' })
      .getOne();
  };

  getUserByEmail = async (email: string, id?: string) => {
    return await this.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .andWhere('user.id != :id', { id: id || '' })
      .getOne();
  };

  getUserByPhoneNumber = async (phoneNumber: string, id?: string) => {
    return await this.createQueryBuilder('user')
      .where('user.phoneNumber = :phoneNumber', { phoneNumber })
      .andWhere('user.id != :id', { id: id || '' })
      .getOne();
  };
}
