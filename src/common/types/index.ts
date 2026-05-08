import { DtoUserToken } from 'src/auth/dto/token-decode.dto';

export type THeaderRequest = {
  user?: DtoUserToken;
};

export type TAnswerEntity = {
  id: string;
  title: string;
  isCorrect: boolean;
};

export type TUserAnswer = {
  question: string;
  answer?: string;
  isCorrect?: boolean;
  note?: string;
};
