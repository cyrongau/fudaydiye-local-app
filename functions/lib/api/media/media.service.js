"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const Busboy = require("busboy");
const os = require("os");
const path = require("path");
const fs = require("fs");
const uuid_1 = require("uuid");
let MediaService = class MediaService {
    constructor() {
        this.bucket = admin.storage().bucket();
    }
    // Helper to upload from buffer/stream if simpler, but for stream parsing we use busboy in Controller or Interceptor.
    // However, NestJS+Firebase Functions raw req handling is tricky.
    // Best pattern for Firebase Functions is to use Busboy to pipe to a temp file, then upload.
    async uploadFile(req) {
        return new Promise((resolve, reject) => {
            if (req.method !== 'POST') {
                return reject(new common_1.BadRequestException('Method not allowed'));
            }
            const busboy = Busboy({ headers: req.headers });
            const uploads = [];
            const tempFilePaths = [];
            busboy.on('file', (fieldname, file, info) => {
                const { filename, mimeType } = info;
                const ext = path.extname(filename);
                const newFileName = `${(0, uuid_1.v4)()}${ext}`;
                const filepath = path.join(os.tmpdir(), newFileName);
                tempFilePaths.push(filepath);
                const writeStream = fs.createWriteStream(filepath);
                file.pipe(writeStream);
                const uploadPromise = new Promise((res, rej) => {
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
                        }
                        catch (err) {
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
                        try {
                            fs.unlinkSync(p);
                        }
                        catch (_a) { }
                    });
                    // Return the first file url for now (singular upload)
                    if (results.length > 0)
                        resolve(results[0]);
                    else
                        reject(new common_1.BadRequestException('No file uploaded'));
                }
                catch (e) {
                    reject(e);
                }
            });
            busboy.on('error', (err) => reject(new common_1.BadRequestException((err === null || err === void 0 ? void 0 : err.message) || 'Upload failed')));
            // Pipe request to busboy
            // In NestJS w/ Express adapter, req is a readable stream.
            if (req.rawBody) {
                busboy.end(req.rawBody);
            }
            else {
                req.pipe(busboy);
            }
        });
    }
};
MediaService = __decorate([
    (0, common_1.Injectable)()
], MediaService);
exports.MediaService = MediaService;
//# sourceMappingURL=media.service.js.map