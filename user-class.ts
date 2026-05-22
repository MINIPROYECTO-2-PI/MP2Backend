import db from './firebase.js'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import type { DocumentData, QuerySnapshot } from 'firebase/firestore'

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth'
import type { UserCredential } from 'firebase/auth'

const ref = collection(db, 'users')
const auth = getAuth()
const provider = new GoogleAuthProvider()

interface CreateUserData {
  username: string
  password: string
  email: string
  name: string
  surname: string
  avatar: string
}

interface LoginData {
  username: string
  password: string
}

interface GoogleLoginResult {
  user: import('firebase/auth').User
  token: string | null
}

export class User {
  static async create({ username, password, email, name, surname, avatar }: CreateUserData) {
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new Error('Username and password must be strings')
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    const qEmail = query(ref, where('email', '==', email))
    const snapEmail: QuerySnapshot<DocumentData> = await getDocs(qEmail)
    if (!snapEmail.empty) {
      throw new Error('El correo electrónico ya está en uso')
    }

    const q = query(ref, where('username', '==', username))
    const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

    if (!snapshot.empty) {
      throw new Error('El nombre de usuario ya está en uso')
    }

    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    const firebaseUser = userCredential.user

    await addDoc(ref, {
      username,
      uid: firebaseUser.uid,
      email,
      name,
      surname,
      avatar,
      createdAt: new Date()
    })

    return firebaseUser
  }

  static async login({ username, password }: LoginData) {
    let emailAddress = ''
    const isEmail = username.includes('@')

    if (isEmail) {
      const q = query(ref, where('email', '==', username))
      const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

      if (snapshot.empty) {
        throw new Error('Usuario no encontrado con este correo')
      }
      emailAddress = username
    } else {
      const q = query(ref, where('username', '==', username))
      const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

      if (snapshot.empty) {
        throw new Error('Usuario no encontrado con este nombre de usuario')
      }

      emailAddress = snapshot.docs[0].data().email
    }

    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      emailAddress,
      password
    )

    return userCredential.user
  }

  static async googleLogin(): Promise<GoogleLoginResult> {
    const userCredential = await signInWithPopup(auth, provider)
    const credential = GoogleAuthProvider.credentialFromResult(userCredential)
    const token = credential?.accessToken ?? null
    const user = userCredential.user

    return { user, token }
  }
}
