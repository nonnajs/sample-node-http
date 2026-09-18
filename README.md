# `@nonnajs/sample-node-http`

Sample pure Node.js HTTP application demonstrating `@nonnajs/di` with native `node:http`.

## Dependency Injection At A Glance

`UserController` (`src/user.controller.ts`) is `scope: "request"` - a fresh instance per HTTP
request, injected with the per-request `HttpRequestContext` alongside the shared singletons:

```ts
@Injectable({scope: "request"})
export class UserController {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly logger: LoggerService,
        private readonly ctx: HttpRequestContext,
    ) {}

    createUser(name: string, email: string): User {
        this.logger.log(`[${this.ctx.requestId}] Creating user ${name} (${email})`);
        return this.userRepo.create(name, email);
    }
}
```

`src/server.ts` wraps every incoming request in `injector.runInScope()` so each one gets its own
`HttpRequestContext`/`UserController` instances, then resolves the controller from the scope:

```ts
const server = http.createServer((req, res) => {
    void injector.runInScope(async () => {
        const ctx = injector.get(HttpRequestContext);
        ctx.req = req;
        ctx.res = res;
        const router = injector.get(HttpRouter); // resolves UserController internally
        await router.handle();
    });
});
```

## Features Demonstrated

-   **Native `node:http` Server**: Zero framework dependencies beyond `@nonnajs/di`.
-   **Request Scope per HTTP Request**: Each incoming request is wrapped with `injector.runInScope()`, giving each request an isolated `HttpRequestContext`, `UserController`, and `HttpRouter`.
-   **AOT Dependency Compilation**: `@nonnajs/compiler` infers constructor dependencies automatically at build time.
-   **Singletons**: `UserRepository` and `LoggerService` shared across requests with `OnDestroy` lifecycle teardown.

## Running the Sample

```sh
# Compile dependencies and build
pnpm build

# Start HTTP server
pnpm start

# Run test suite
pnpm test
```
