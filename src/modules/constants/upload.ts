import * as fsx from 'fs-extra';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';

import { _getLinkPathStorage } from 'src/common/functions';
import { appConfig } from 'src/configs/constants';

export const multerUploadImageOptions = {
  limits: {
    fileSize: 5000000,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError);
    } else if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `Vui lòng tải ảnh lên có định dạng .png, .jpg hoặc .jpeg`,
        ),
        false,
      );
    }
  },
  storage: diskStorage({
    destination: appConfig.pathStorage,
    filename: (req, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname.replaceAll(
        /\s/g,
        '',
      )}`;
      fsx.mkdirSync(`${_getLinkPathStorage()}`, { recursive: true });
      cb(null, `${fileName}`);
    },
  }),
};

export const multerUploadVideoOptions = {
  limits: {
    fileSize: 50000 * 1000 * 1000,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError);
    } else if (file.mimetype.match(/\/(mov|mp4)$/)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `Vui lòng tải video lên có định dạng .mov .mp4`,
        ),
        false,
      );
    }
  },
  storage: diskStorage({
    destination: appConfig.pathStorage,
    filename: (req, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname.replaceAll(
        /\s/g,
        '',
      )}`;
      fsx.mkdirSync(`${_getLinkPathStorage()}`, { recursive: true });
      cb(null, `${fileName}`);
    },
  }),
};
