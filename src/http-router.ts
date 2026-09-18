import {Inject, Injectable} from "@nonnajs/di";
import {SERVER_CONFIG, ServerConfig} from "./config";
import {HttpRequestContext} from "./request-context";
import {UserController} from "./user.controller";

@Injectable({scope: "request"})
export class HttpRouter {
    constructor(
        private readonly ctx: HttpRequestContext,
        private readonly userController: UserController,
        @Inject(SERVER_CONFIG) private readonly config: ServerConfig,
    ) {}

    async handle(): Promise<void> {
        const {req, res} = this.ctx;
        const method = req.method ?? "GET";
        const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
        const pathname = url.pathname;

        res.setHeader("X-Request-Id", this.ctx.requestId);
        res.setHeader("Content-Type", "application/json");

        if (method === "GET" && pathname === "/health") {
            res.statusCode = 200;
            res.end(JSON.stringify({status: "ok", app: this.config.appName, requestId: this.ctx.requestId}));
            return;
        }

        if (method === "GET" && pathname === "/users") {
            const users = this.userController.getUsers();
            res.statusCode = 200;
            res.end(JSON.stringify({data: users, requestId: this.ctx.requestId}));
            return;
        }

        if (method === "GET" && pathname.startsWith("/users/")) {
            const id = pathname.substring("/users/".length);
            const user = this.userController.getUser(id);
            if (!user) {
                res.statusCode = 404;
                res.end(JSON.stringify({error: "User not found", requestId: this.ctx.requestId}));
                return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify({data: user, requestId: this.ctx.requestId}));
            return;
        }

        if (method === "POST" && pathname === "/users") {
            const body = await this.readBody(req);
            const user = this.userController.createUser(body.name, body.email);
            res.statusCode = 201;
            res.end(JSON.stringify({data: user, requestId: this.ctx.requestId}));
            return;
        }

        res.statusCode = 404;
        res.end(JSON.stringify({error: "Not Found", requestId: this.ctx.requestId}));
    }

    private readBody(req: HttpRequestContext["req"]): Promise<any> {
        return new Promise((resolve, reject) => {
            let data = "";
            req.on("data", (chunk: Buffer) => {
                data += chunk.toString();
            });
            req.on("end", () => {
                try {
                    resolve(data ? JSON.parse(data) : {});
                } catch (err) {
                    reject(err);
                }
            });
            req.on("error", reject);
        });
    }
}
