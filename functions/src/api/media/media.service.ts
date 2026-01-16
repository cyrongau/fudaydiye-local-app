import { Injectable, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as Busboy from 'busboy';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
    private bucket = admin.storage().bucket();

    // Helper to upload from buffer/stream if simpler, but for stream parsing we use busboy in Controller or Interceptor.
    // However, NestJS+Firebase Functions raw req handling is tricky.
    // Best pattern for Firebase Functions is to use Busboy to pipe to a temp file, then upload.

    async uploadFile(req: any): Promise<string> {
        return new Promise((resolve, reject) => {
            if (req.method !== 'POST') {
                return reject(new BadRequestException('Method not allowed'));
            }

            const busboy = Busboy({ headers: req.headers });
            const uploads: Promise<string>[] = [];
            const tempFilePaths: string[] = [];

            busboy.on('file', (fieldname, file, info) => {
                const { filename, mimeType } = info;
                const ext = path.extname(filename);
                const newFileName = `${uuidv4()}${ext}`;
                const filepath = path.join(os.tmpdir(), newFileName);

                tempFilePaths.push(filepath);
                const writeStream = fs.createWriteStream(filepath);
                file.pipe(writeStream);

                const uploadPromise = new Promise<string>((res, rej) => {
                    file.on('end', () => writeStream.end());
                    writeStream.on('finish', async () => {
                        try {
                            const destination = `uploads/${new Date().getFullYear()}/${newFileName}`;
                            await this.bucket.upload(filepath, {
                                destination,
                                metadata: { contentType: mimeType },
                                public: true // Make public for CMS usage
                            });
                            // Public URL
                            // Note: 'public: true' makes it accessible.
                            // The URL format for default bucket:
                            const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${destination}`;
                            res(publicUrl);
                        } catch (err) {
                            rej(err);
                        }
                    });
                    writeStream.on('error', rej);
                });
                uploads.push(uploadPromise);
            });

            busboy.on('finish', async () => {
                try {
                    const results = await Promise.all(uploads);
                    // Cleanup temp files
                    tempFilePaths.forEach(p => {
                        try { fs.unlinkSync(p); } catch { }
                    });
                    // Return the first file url for now (singular upload)
                    if (results.length > 0) resolve(results[0]);
                    else reject(new BadRequestException('No file uploaded'));
                } catch (e) {
                    reject(e);
                }
            });

            busboy.on('error', (err: any) => reject(new BadRequestException(err?.message || 'Upload failed')));

            // Pipe request to busboy
            // In NestJS w/ Express adapter, req is a readable stream.
            if (req.rawBody) {
                busboy.end(req.rawBody);
            } else {
                req.pipe(busboy);
            }
        });
    }
}
