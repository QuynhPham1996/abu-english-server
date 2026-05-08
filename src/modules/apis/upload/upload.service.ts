import { Injectable } from '@nestjs/common';
import { DtoUploadFilesResponse } from 'src/modules/apis/upload/dto/upload-files.dto';
import * as fsx from 'fs-extra';

import { _getLinkPathStorage } from 'src/common/functions';

@Injectable()
export class UploadService {
  async uploadImages(files: Express.Multer.File[]) {
    const dataCb: DtoUploadFilesResponse[] = [];

    if (files.length) {
      for await (const item of files) {
        const tempSplitTypeFile = item.originalname.split('.');
        const type = tempSplitTypeFile[tempSplitTypeFile.length - 1];
        const storageName = 'images';

        fsx.moveSync(
          item.path,
          `${_getLinkPathStorage()}/${storageName}/${item.filename}`,
        );

        dataCb.push({
          type,
          mimetype: item.mimetype,
          originalname: item.originalname,
          filename: item.filename,
          url: `/${storageName}/${item.filename}`,
        });
      }
    }

    return { data: dataCb };
  }

  async deleteFiles(filesPath: string[]) {
    if (filesPath.length) {
      for await (const item of filesPath) {
        fsx.removeSync(`${_getLinkPathStorage()}/${item}`);
      }
    }
  }

  async uploadVideo(file: Express.Multer.File) {
    if (file) {
      const tempSplitTypeFile = file.originalname.split('.');
      const type = tempSplitTypeFile[tempSplitTypeFile.length - 1];
      const storageName = 'videos';

      fsx.moveSync(
        file.path,
        `${_getLinkPathStorage()}/${storageName}/${file.filename}`,
      );

      return {
        type,
        mimetype: file.mimetype,
        originalname: file.originalname,
        filename: file.filename,
        url: `/${storageName}/${file.filename}`,
      };
    }
  }
}
