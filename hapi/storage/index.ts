import type { Server } from "@hapi/hapi";
import routes from "./routes";
import Handler from "./handler";
import Service from "./service";
import Repository from "./repo";

const storageRepository = new Repository({
    projectId: process.env.PROJECT_ID as string,
    keyFilename: process.env.KEY_FILENAME as string,
    bucketName: process.env.BUCKET_NAME as string,
});

const storageService = new Service(storageRepository);
const storageHandler = new Handler(storageService);
const storageRoutes = routes(storageHandler);

export default {
    name: "storage",
    version: "1.0.0",
    register: (server: Server) => {
        server.route(storageRoutes);
    },
};
