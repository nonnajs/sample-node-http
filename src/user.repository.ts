import {Injectable} from "@nonnajs/di";

export interface User {
    id: string;
    name: string;
    email: string;
}

@Injectable()
export class UserRepository {
    private readonly users = new Map<string, User>([
        ["1", {id: "1", name: "Alice", email: "alice@example.com"}],
        ["2", {id: "2", name: "Bob", email: "bob@example.com"}],
    ]);

    findAll(): User[] {
        return [...this.users.values()];
    }

    findById(id: string): User | undefined {
        return this.users.get(id);
    }

    create(name: string, email: string): User {
        const id = String(this.users.size + 1);
        const user: User = {id, name, email};
        this.users.set(id, user);
        return user;
    }
}
