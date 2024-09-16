import StorageRepository from "./repo";

class StorageService {
    private readonly _storageRepository: StorageRepository;

    constructor(storageRepository: StorageRepository) {
        this._storageRepository = storageRepository;
    }

    async uploadFile(file: Express.Multer.File, fileName: string) {
        const uploadedFileUrl = await this._storageRepository.uploadFile(file, fileName);
        return uploadedFileUrl;
    }
}

export default StorageService;
