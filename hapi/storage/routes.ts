import type { ServerRoute } from "@hapi/hapi";
import StorageHandler from "./handler";

const routes: (handler: StorageHandler) => ServerRoute[] = (handler) => [
    {
        method: "POST",
        path: "/storage/{fileName}",
        config: {
            payload: {
                multipart: true,
            },
        },
        handler: handler.uploadFile,
    },
];

export default routes;
