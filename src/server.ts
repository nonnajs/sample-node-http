import http from "node:http";
import {Injector} from "@nonnajs/di";
import {SERVER_CONFIG, ServerConfig} from "./config";
import {HttpRouter} from "./http-router";
import {HttpRequestContext} from "./request-context";

export async function createHttpApp(config: ServerConfig): Promise<{injector: Injector; server: http.Server}> {
    const injector = Injector.create();

    // Register configuration
    injector.registerValue(SERVER_CONFIG, config);

    // Refresh decorated singletons/services
    injector.refresh();

    // Initialize graph
    await injector.initialize();

    const server = http.createServer((req, res) => {
        void injector.runInScope(async () => {
            const ctx = injector.get(HttpRequestContext);
            ctx.req = req;
            ctx.res = res;

            try {
                const router = injector.get(HttpRouter);
                await router.handle();
            } catch {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({error: "Internal Server Error"}));
            }
        });
    });

    return {injector, server};
}
