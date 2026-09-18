export const SERVER_CONFIG = Symbol("SERVER_CONFIG");

export interface ServerConfig {
    port: number;
    host: string;
    appName: string;
}
