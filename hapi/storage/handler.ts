import type { Request } from "@hapi/hapi";
import StorageService from "./service";
import autoBind from "auto-bind";

class StorageHandler {
    private readonly _storageService: StorageService;

    constructor(storageService: StorageService) {
        this._storageService = storageService;
        autoBind(this);
    }

    async uploadFile(request: Request) {
        const { file } = request.payload as { file: Express.Multer.File };
        const { fileName } = request.params;
        const uploadedFileUrl = await this._storageService.uploadFile(file, fileName);
        return {
            status: "success",
            message: "File uploaded successfully",
            data: {
                fileUrl: uploadedFileUrl,
            },
        };
    }
}

export default StorageHandler;
