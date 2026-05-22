interface CreateUserData {
    username: string;
    password: string;
    email: string;
    name: string;
    surname: string;
    avatar: string;
}
interface LoginData {
    username: string;
    password: string;
}
interface GoogleLoginResult {
    user: import('firebase/auth').User;
    token: string | null;
}
export declare class User {
    static create({ username, password, email, name, surname, avatar }: CreateUserData): Promise<import("@firebase/auth").User>;
    static login({ username, password }: LoginData): Promise<import("@firebase/auth").User>;
    static googleLogin(): Promise<GoogleLoginResult>;
}
export {};
//# sourceMappingURL=user-class.d.ts.map