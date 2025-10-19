// services/CloudStorage.ts
import { Storage } from '@google-cloud/storage';
import { StoredFile } from '../models/StoredFile';
import { Readable } from 'stream';
import {env} from '../config/env';

const storage = new Storage({}); // uses GOOGLE_APPLICATION_CREDENTIALS env var
const bucketName = env.GOOGLE_CLOUD_BUCKET_NAME!;
const GOOGLE_BASE_URL = 'https://storage.googleapis.com';


export class CloudStorage {

    static async saveFile(path: string, buffer: Buffer, contentType: string): Promise<StoredFile> {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(path);

        await file.save(buffer, {
            metadata: {contentType: contentType},
            resumable: false
        });

        return {
            id: path,
            url: `${GOOGLE_BASE_URL}/${bucketName}/${path}`,
            filename: file.name,
            metadata: {size: buffer.length, contentType: contentType || 'application/octet-stream'},
        };
    }

    static async saveStream(path: string, stream: Readable, contentType?: string): Promise<StoredFile> {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(path);
        const writeStream = file.createWriteStream({
            metadata: { contentType },
            resumable: false
        });

        return new Promise((resolve, reject) => {
            stream.pipe(writeStream)
                .on('error', reject)
                .on('finish', async () => {
                    resolve({
                        id: path,
                        url: `${GOOGLE_BASE_URL}/${bucketName}/${path}`,
                        filename: file.name,
                        metadata: {
                            size: -1, // can't know from stream
                            contentType: contentType || 'application/octet-stream'
                        }

                    });
                });
        });
    }

    static async deleteFile(path: string): Promise<void> {
        const bucket = storage.bucket(bucketName);
        await bucket.file(path).delete({ ignoreNotFound: true });
    }

    static async delete(storedFile: StoredFile): Promise<void> {
        if (!storedFile) {
            return;
        }
        const fileId = storedFile.id;
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileId);

        try {
            await file.delete();
            console.log(`Deleted file from GCS: ${fileId}`);
        } catch (error: any) {
            if (error.code === 404) {
                console.warn(`File not found in GCS: ${fileId}`);
            } else {
                console.error(`Failed to delete file from GCS:`, error);
                throw error;
            }
        }
    }
}
