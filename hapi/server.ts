import Hapi from "@hapi/hapi";
import storage from "./storage";

const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: "0.0.0.0",
});

const init = async () => {
    await server.register(storage);
    await server.start();
    console.log("Server running on %s", server.info.uri);
};

init();
