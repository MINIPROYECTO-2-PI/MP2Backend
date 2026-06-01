import db from './firebase.js'
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore'
import type { DocumentData, QuerySnapshot } from 'firebase/firestore'

const roomsRef = collection(db, 'rooms')

interface CreateRoomData {
  name: string
  hostUid: string
  hostUsername: string
}

interface RoomData {
  id: string
  roomId: string
  name: string
  hostUid: string
  hostUsername: string
  createdAt: Date
}

function generateRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const segments = [3, 4, 3]
  return segments
    .map((len) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    )
    .join('-')
}

export class Room {
  static async create({ name, hostUid, hostUsername }: CreateRoomData): Promise<RoomData> {
    if (!name || name.trim().length === 0) {
      throw new Error('El nombre de la sala es requerido')
    }

    if (name.trim().length < 3) {
      throw new Error('El nombre de la sala debe tener al menos 3 caracteres')
    }

    if (name.trim().length > 50) {
      throw new Error('El nombre de la sala no debe exceder 50 caracteres')
    }

    const roomId = generateRoomId()

    const docRef = await addDoc(roomsRef, {
      roomId,
      name: name.trim(),
      hostUid,
      hostUsername,
      createdAt: Timestamp.now()
    })

    return {
      id: docRef.id,
      roomId,
      name: name.trim(),
      hostUid,
      hostUsername,
      createdAt: new Date()
    }
  }

  static async getByHost(hostUid: string): Promise<RoomData[]> {
    const q = query(roomsRef, where('hostUid', '==', hostUid))
    const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        roomId: data.roomId,
        name: data.name,
        hostUid: data.hostUid,
        hostUsername: data.hostUsername,
        createdAt: data.createdAt?.toDate?.() || new Date()
      }
    })
  }
}
