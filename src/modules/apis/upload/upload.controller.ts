import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as fsx from 'fs-extra';
import { Request, Response } from 'express';

import { UploadService } from 'src/modules/apis/upload/upload.service';
import { multerUploadImageOptions } from 'src/modules/constants/upload';
import { _getLinkPathStorage } from 'src/common/functions';
import { AllowPermission } from 'src/common/decorator/permission.decorator';
import { EUserRole } from 'src/common/enums';
import { DtoDeleteFilesQuery } from 'src/modules/apis/upload/dto/delete-files.dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('/images/*')
  async getStaticImages(@Req() req: Request, @Res() res: Response) {
    const pathFile = decodeURI(req.originalUrl.substring(8));
    const filepath = `${_getLinkPathStorage()}/${pathFile}`;

    if (!fsx.existsSync(filepath)) {
      throw new NotFoundException('Không tìm thấy ảnh trong hệ thống.');
    }

    res.sendFile(filepath);
  }

  @Get('/videos/*')
  // @UseGuards(AuthGuard('jwt'))
  async getStaticVideo(@Req() req: Request, @Res() res: Response) {
    const pathFile = decodeURI(req.originalUrl.substring(8));
    const filepath = `${_getLinkPathStorage()}/${pathFile}`;

    if (!fsx.existsSync(filepath)) {
      throw new NotFoundException('Không tìm thấy video trong hệ thống.');
    }

    res.sendFile(filepath);
  }

  @Post('images')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('files', 10, multerUploadImageOptions))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return await this.uploadService.uploadImages(files || []);
  }

  @Delete('images')
  @UseGuards(AuthGuard('jwt'))
  @AllowPermission([EUserRole.STUDENT])
  async deleteFiles(@Query() params: DtoDeleteFilesQuery) {
    const idsArray = params.paths?.split(',') || [];
    return await this.uploadService.deleteFiles(idsArray);
  }
}
