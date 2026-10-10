import {
  BadRequestException,
  Controller,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { v2 as cloudinary } from 'cloudinary';
import { Auth } from '../common/auth.decorator.js';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly config: ConfigService) {}

  @Auth('SELLER', 'ADMIN')
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  upload(@UploadedFile() file?: { mimetype: string; buffer: Buffer }) {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
    if (!cloudName) throw new ServiceUnavailableException('Image upload is not configured');
    if (!file?.mimetype.startsWith('image/')) throw new BadRequestException('An image file is required');

    cloudinary.config({
      cloud_name: cloudName,
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
    return new Promise<{ url: string }>((resolve, reject) =>
      cloudinary.uploader
        .upload_stream({ folder: 'bazaar' }, (err, result) =>
          err || !result ? reject(err) : resolve({ url: result.secure_url }),
        )
        .end(file.buffer),
    );
  }
}
