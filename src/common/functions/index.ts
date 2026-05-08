import * as bcrypt from 'bcryptjs';
import { join } from 'path';

import { appConfig, bcryptConfig, env } from 'src/configs/constants';

export const generateHashPassword = async (password: string) => {
  return await bcrypt.hash(password, bcryptConfig.saltRound);
};

export const comparePasswordAndHashPassword = async (
  password: string,
  hashPassword: string,
) => {
  return await bcrypt.compare(password, hashPassword);
};

export const convertToSlug = (text: string) => {
  if (!text) return undefined;

  return text
    .toLowerCase()
    .replace(/[^\w -]+/g, '')
    .replace(/ +/g, '-');
};

export function _getLinkPathStorage() {
  const filepath = join(__dirname);
  const listPath = filepath.split('/').slice(0, -3).join('/');
  const linkPath = `${listPath}/${appConfig.pathStorage}`;
  return linkPath;
}

export const getFullPath = (path: string): string => {
  return `${env.baseUrl}/upload${path}`;
};
