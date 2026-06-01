"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const firebase_js_1 = __importDefault(require("./firebase.js"));
const firestore_1 = require("firebase/firestore");
const roomsRef = (0, firestore_1.collection)(firebase_js_1.default, 'rooms');
function generateRoomId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const segments = [3, 4, 3];
    return segments
        .map((len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
        .join('-');
}
class Room {
    static async create({ name, hostUid, hostUsername }) {
        if (!name || name.trim().length === 0) {
            throw new Error('El nombre de la sala es requerido');
        }
        if (name.trim().length < 3) {
            throw new Error('El nombre de la sala debe tener al menos 3 caracteres');
        }
        if (name.trim().length > 50) {
            throw new Error('El nombre de la sala no debe exceder 50 caracteres');
        }
        const roomId = generateRoomId();
        const docRef = await (0, firestore_1.addDoc)(roomsRef, {
            roomId,
            name: name.trim(),
            hostUid,
            hostUsername,
            createdAt: firestore_1.Timestamp.now()
        });
        return {
            id: docRef.id,
            roomId,
            name: name.trim(),
            hostUid,
            hostUsername,
            createdAt: new Date()
        };
    }
    static async getByHost(hostUid) {
        const q = (0, firestore_1.query)(roomsRef, (0, firestore_1.where)('hostUid', '==', hostUid));
        const snapshot = await (0, firestore_1.getDocs)(q);
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                roomId: data.roomId,
                name: data.name,
                hostUid: data.hostUid,
                hostUsername: data.hostUsername,
                createdAt: data.createdAt?.toDate?.() || new Date()
            };
        });
    }
}
exports.Room = Room;
//# sourceMappingURL=room-class.js.map