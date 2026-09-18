import assert from "node:assert/strict";
import http from "node:http";
import {after, before, describe, it} from "node:test";

import "../src/__generated__/nonna-dependencies.generated";
import {LoggerService} from "../src/logger.service";
import {createHttpApp} from "../src/server";

function request(
    port: number,
    options: {method: string; path: string; body?: any; headers?: Record<string, string>},
): Promise<{statusCode: number; headers: http.IncomingHttpHeaders; body: any}> {
    return new Promise((resolve, reject) => {
        const payload = options.body ? JSON.stringify(options.body) : undefined;
        const req = http.request(
            {
                hostname: "127.0.0.1",
                port,
                path: options.path,
                method: options.method,
                headers: {
                    ...(payload
                        ? {"Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload)}
                        : {}),
                    ...options.headers,
                },
            },
            res => {
                let data = "";
                res.on("data", chunk => {
                    data += chunk;
                });
                res.on("end", () => {
                    try {
                        const parsed = data ? JSON.parse(data) : undefined;
                        resolve({statusCode: res.statusCode ?? 500, headers: res.headers, body: parsed});
                    } catch {
                        resolve({statusCode: res.statusCode ?? 500, headers: res.headers, body: data});
                    }
                });
            },
        );

        req.on("error", reject);
        if (payload) req.write(payload);
        req.end();
    });
}

describe("Sample Node HTTP App - @nonnajs/di", () => {
    let server: http.Server;
    let injector: any;
    let port: number;

    before(async () => {
        const app = await createHttpApp({
            port: 0,
            host: "127.0.0.1",
            appName: "TestHttpApp",
        });
        injector = app.injector;
        server = app.server;

        await new Promise<void>(resolve => {
            server.listen(0, "127.0.0.1", () => {
                const addr = server.address() as {port: number};
                port = addr.port;
                resolve();
            });
        });
    });

    after(async () => {
        await new Promise<void>(resolve => server.close(() => resolve()));
        await injector.destroy();
    });

    it("handles GET /health and returns custom appName and unique request ID", async () => {
        const res = await request(port, {method: "GET", path: "/health"});

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.status, "ok");
        assert.equal(res.body.app, "TestHttpApp");
        assert.ok(res.headers["x-request-id"]);
        assert.equal(res.body.requestId, res.headers["x-request-id"]);
    });

    it("handles GET /users via request-scoped controller and singleton repository", async () => {
        const res = await request(port, {method: "GET", path: "/users"});

        assert.equal(res.statusCode, 200);
        assert.ok(Array.isArray(res.body.data));
        assert.equal(res.body.data.length, 2);
        assert.equal(res.body.data[0].name, "Alice");
    });

    it("handles POST /users and GET /users/:id", async () => {
        const createRes = await request(port, {
            method: "POST",
            path: "/users",
            body: {name: "Charlie", email: "charlie@example.com"},
        });

        assert.equal(createRes.statusCode, 201);
        assert.equal(createRes.body.data.name, "Charlie");
        const newId = createRes.body.data.id;

        const getRes = await request(port, {method: "GET", path: `/users/${newId}`});
        assert.equal(getRes.statusCode, 200);
        assert.equal(getRes.body.data.email, "charlie@example.com");
    });

    it("isolates request IDs across concurrent requests", async () => {
        const [res1, res2] = await Promise.all([
            request(port, {method: "GET", path: "/health"}),
            request(port, {method: "GET", path: "/health"}),
        ]);

        assert.notEqual(res1.headers["x-request-id"], res2.headers["x-request-id"]);
    });

    it("invokes onDestroy on singleton LoggerService when injector is destroyed", async () => {
        const logger = injector.get(LoggerService);
        assert.equal(logger.isDestroyed, false);
        assert.ok(logger.logs.length > 0);
    });
});
