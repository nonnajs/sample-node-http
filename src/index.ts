import "./__generated__/nonna-dependencies.generated";
import {createHttpApp} from "./server";

async function main() {
    const port = Number(process.env["PORT"] ?? 3000);
    const {injector, server} = await createHttpApp({
        port,
        host: "0.0.0.0",
        appName: "NodeBoot-NativeHttp-Sample",
    });

    server.listen(port, () => {
        console.info(`Server listening on http://localhost:${port}`);
    });

    const shutdown = async () => {
        console.info("Shutting down HTTP server...");
        server.close(async () => {
            await injector.destroy();
            console.info("Injector and server destroyed.");
            process.exit(0);
        });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

if (require.main === module) {
    main().catch(console.error);
}
