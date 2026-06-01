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
interface UpdateProfileData {
    name?: string;
    surname?: string;
    username?: string;
    email?: string;
    avatar?: string;
}
interface UserProfile {
    docId: string;
    uid: string;
    username: string;
    email: string;
    name: string;
    surname: string;
    avatar: string;
    provider?: string;
    createdAt?: Date;
}
export declare class User {
    static create({ username, password, email, name, surname, avatar }: CreateUserData): Promise<import("@firebase/auth").User>;
    static login({ username, password }: LoginData): Promise<import("@firebase/auth").User>;
    static googleLogin(): Promise<GoogleLoginResult>;
    static getProfile(uid: string): Promise<UserProfile>;
    static updateProfile(uid: string, updates: UpdateProfileData): Promise<UserProfile>;
    static deleteAccount(uid: string): Promise<void>;
}
export {};
//# sourceMappingURL=user-class.d.ts.map