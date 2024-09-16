import { Storage } from "@google-cloud/storage";
import multer from "multer";

class StorageRepository {
    private readonly _storage: Storage;
    private readonly _multer: multer.Multer;
    private readonly bucketName: string;
    constructor({
        projectId,
        bucketName,
        keyFilename,
    }: {
        projectId: string;
        bucketName: string;
        keyFilename: string;
    }) {
        this._storage = new Storage({ projectId, keyFilename });
        this._multer = multer({ storage: multer.memoryStorage() });
        this.bucketName = bucketName;
    }

    async uploadFile(file: Express.Multer.File, fileName: string) {
        const bucket = this._storage.bucket(this.bucketName);
        const fileUpload = bucket.file(`users-photo/${fileName}`);
        const [exists] = await fileUpload.exists();
        if (exists) {
            await fileUpload.delete();
        }

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on("error", (error) => {
            throw error;
        });

        blobStream.on("finish", () => {
            console.log("File uploaded/updated successfully");
        });

        const fileBuffer = Buffer.from(file.buffer);
        blobStream.write(fileBuffer);
        blobStream.end();

        return `https://storage.googleapis.com/${this.bucketName}/users-photo/${fileName}`;
    }
}

export default StorageRepository;
