import db from './firebase.js'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import bcrypt from 'bcrypt'
const ref = collection(db, 'users')

export class User {
  static async create({ username, password, email, name, surname, avatar }) {
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new Error('Username and password must be strings')
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    const q = query(ref, where('username', '==', username))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      throw new Error('Elige otro nombre de usuario, ya está en uso')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await addDoc(ref, {
      username,
      password: hashedPassword,
      email,
      name,
      surname,
      avatar,
      createdAt: new Date(),
    })
  }

  static async login({ username, password }) {}
}
