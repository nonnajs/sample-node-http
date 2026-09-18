import {Injectable} from "@nonnajs/di";
import {LoggerService} from "./logger.service";
import {HttpRequestContext} from "./request-context";
import {User, UserRepository} from "./user.repository";

@Injectable({scope: "request"})
export class UserController {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly logger: LoggerService,
        private readonly ctx: HttpRequestContext,
    ) {}

    getUsers(): User[] {
        this.logger.log(`[${this.ctx.requestId}] Fetching all users`);
        return this.userRepo.findAll();
    }

    getUser(id: string): User | undefined {
        this.logger.log(`[${this.ctx.requestId}] Fetching user id=${id}`);
        return this.userRepo.findById(id);
    }

    createUser(name: string, email: string): User {
        this.logger.log(`[${this.ctx.requestId}] Creating user ${name} (${email})`);
        return this.userRepo.create(name, email);
    }
}
