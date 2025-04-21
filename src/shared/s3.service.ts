// import {
//   DeleteObjectCommand,
//   GetObjectCommand,
//   PutObjectCommand,
//   S3Client,
// } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { BadRequestException, Injectable } from '@nestjs/common';
// import { randomUUID } from 'crypto';
// // import heicConvert from 'heic-convert';
// import sharp from 'sharp';
// import { ConfigService } from 'src/config/config.service';
// import { Readable, Stream } from 'stream';
// import { ErrorLogService } from './error-log.service';
// import { generateOtpCode, generateSlug } from 'src/common/utils/helper.util';

// @Injectable()
// export class S3Service {
//   private s3: S3Client;

//   constructor(
//     private readonly configService: ConfigService,
//     private readonly logger: ErrorLogService,
//   ) {
//     this.s3 = new S3Client({
//       region: this.configService.get('AWS_REGION'),
//       credentials: {
//         accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
//         secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
//       },
//     });
//   }

//   async convertImage(
//     file: Express.Multer.File,
//   ): Promise<{ buffer: Buffer; mimeType: string }> {
//     const allowedFormats = ['jpeg', 'png', 'gif'];
//     let buffer: Buffer;
//     let mimeType: string;

//     try {
//       const image = sharp(file.buffer);
//       const metadata = await image.metadata();

//       if (['heif', 'heic'].includes(metadata.format)) {
//         throw new BadRequestException(
//           'Unsupported image format. Please upload another image.',
//         );
//         // const converted = await heicConvert({
//         //   buffer: file.buffer,
//         //   format: 'PNG',
//         //   quality: 0.6,
//         // });
//         // buffer = Buffer.from(converted);
//         // mimeType = 'image/png';
//       } else if (!allowedFormats.includes(metadata.format)) {
//         buffer = await image.toFormat('png').toBuffer();
//         mimeType = 'image/png';
//       } else {
//         buffer = await image.toBuffer();
//         mimeType = `image/${metadata.format}`;
//       }

//       return { buffer, mimeType };
//     } catch (error) {
//       throw new BadRequestException(
//         'Unsupported image format or other error during processing.',
//       );
//     }
//   }

//   async uploadImages(
//     files: Express.Multer.File[],
//   ): Promise<{ key: string; size: number; mimeType: string }[]> {
//     const results = await Promise.all(
//       files.map(async (file) => {
//         const { buffer, mimeType } = await this.convertImage(file);

//         const key = `${randomUUID()}.${mimeType.split('/')[1]}`;
//         const command = new PutObjectCommand({
//           Bucket: this.configService.get('AWS_BUCKET_NAME'),
//           Key: key,
//           Body: buffer,
//           ContentType: mimeType,
//         });

//         await this.s3.send(command);

//         return { key, size: buffer.length, mimeType };
//       }),
//     );

//     return results;
//   }

//   async uploadVideos(
//     files: Express.Multer.File[],
//   ): Promise<{ key: string; size: number; mimeType: string }[]> {
//     const allowedFormats = [
//       'video/mp4',
//       'video/mov',
//       'video/avi',
//       'video/mkv',
//       'video/wmv',
//     ];

//     const results = await Promise.all(
//       files.map(async (file) => {
//         if (!allowedFormats.includes(file.mimetype)) {
//           throw new BadRequestException(`Invalid video format. `);
//         }

//         const buffer = file.buffer;
//         const mimeType = file.mimetype;
//         const key = `${randomUUID()}.${file.originalname.substring(file.originalname.lastIndexOf('.') + 1)}`;

//         const command = new PutObjectCommand({
//           Bucket: this.configService.get('AWS_BUCKET_NAME'),
//           Key: key,
//           Body: buffer,
//           ContentType: mimeType,
//         });

//         await this.s3.send(command);

//         return { key, size: buffer.length, mimeType };
//       }),
//     );

//     return results;
//   }

//   async uploadDocuments(
//     files: Express.Multer.File[],
//   ): Promise<{ key: string; size: number; mimeType: string }[]> {
//     const results = await Promise.all(
//       files.map(async (file) => {
//         const buffer = file.buffer;
//         const mimeType = file.mimetype;
//         const key = `${randomUUID()}.${file.originalname.substring(file.originalname.lastIndexOf('.') + 1)}`;

//         const command = new PutObjectCommand({
//           Bucket: this.configService.get('AWS_BUCKET_NAME'),
//           Key: key,
//           Body: buffer,
//           ContentType: mimeType,
//         });

//         await this.s3.send(command);

//         return { key, size: buffer.length, mimeType };
//       }),
//     );

//     return results;
//   }

//   async getFile(key: string): Promise<Stream> {
//     const command = new GetObjectCommand({
//       Bucket: this.configService.get('AWS_BUCKET_NAME'),
//       Key: key,
//     });

//     const { Body } = await this.s3.send(command);

//     // Return the stream for the file
//     if (!(Body instanceof Readable)) {
//       throw new BadRequestException(
//         'File not found or could not be retrieved.',
//       );
//     }

//     return Body;
//   }

//   async deleteFile(key: string): Promise<void> {
//     const command = new DeleteObjectCommand({
//       Bucket: this.configService.get('AWS_BUCKET_NAME'),
//       Key: key,
//     });

//     try {
//       await this.s3.send(command);
//     } catch (error) {
//       this.logger.logError(error.message, 'Delete File', error.stack);
//     }
//   }

//   async generateSignedUrl(
//     files: { mimeType: string; name: string }[],
//   ): Promise<{ urls: string[]; keys: string[] }> {
//     const urls = [];
//     const keys = [];

//     for (let i = 0; i < files.length; i++) {
//       const element = files[i];

//       keys[i] = `${generateOtpCode(4)}/${element.name}`;

//       const command = new PutObjectCommand({
//         Bucket: this.configService.get('AWS_BUCKET_NAME'),
//         Key: keys[i],
//         ContentType: element.mimeType,
//       });

//       const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
//       urls.push(url);
//     }

//     return { urls, keys };
//   }
// }
