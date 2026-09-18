import {Injectable, OnDestroy} from "@nonnajs/di";

@Injectable()
export class LoggerService implements OnDestroy {
    public logs: string[] = [];
    public isDestroyed = false;

    log(message: string): void {
        this.logs.push(`[LOG] ${message}`);
    }

    onDestroy(): void {
        this.isDestroyed = true;
        this.log("LoggerService destroyed");
    }
}
