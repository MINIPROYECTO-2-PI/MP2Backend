interface CreateRoomData {
    name: string;
    hostUid: string;
    hostUsername: string;
}
interface RoomData {
    id: string;
    roomId: string;
    name: string;
    hostUid: string;
    hostUsername: string;
    createdAt: Date;
}
export declare class Room {
    static create({ name, hostUid, hostUsername }: CreateRoomData): Promise<RoomData>;
    static getByHost(hostUid: string): Promise<RoomData[]>;
}
export {};
//# sourceMappingURL=room-class.d.ts.map