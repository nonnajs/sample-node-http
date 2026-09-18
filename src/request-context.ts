import {Injectable} from "@nonnajs/di";
import type {IncomingMessage, ServerResponse} from "node:http";

@Injectable({scope: "request"})
export class HttpRequestContext {
    public requestId: string = `req-${Math.random().toString(36).substring(2, 9)}`;
    public startTime: number = Date.now();
    public req!: IncomingMessage;
    public res!: ServerResponse;
}
