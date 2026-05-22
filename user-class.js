import db from './firebase.js'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth'
const ref = collection(db, 'users')
const auth = getAuth()
const provider = new GoogleAuthProvider()
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

    // 1. Verificar si el correo ya existe
    const qEmail = query(ref, where('email', '==', email))
    const snapEmail = await getDocs(qEmail)
    if (!snapEmail.empty) {
      throw new Error('El correo electrónico ya está en uso')
    }

    // 2. Verificar si el nombre de usuario ya está ocupado
    const q = query(ref, where('username', '==', username))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      throw new Error('El nombre de usuario ya está en uso')
    }

    const userCredential = await createUserWithEmailAndPassword(
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

  static async login({ username, password }) {
    let emailAddress = ''
    const isEmail = username.includes('@')

    if (isEmail) {
      // Buscar por email en Firestore
      const q = query(ref, where('email', '==', username))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        throw new Error('Usuario no encontrado con este correo')
      }
      emailAddress = username
    } else {
      // Buscar el email por username en Firestore
      const q = query(ref, where('username', '==', username))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        throw new Error('Usuario no encontrado con este nombre de usuario')
      }

      emailAddress = snapshot.docs[0].data().email
    }

    // Iniciar sesión en Firebase Auth con el email encontrado/ingresado
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailAddress,
      password
    )

    return userCredential.user
  }

  static async googleLogin() {
    const userCredential = await signInWithPopup(auth, provider)
    const credential = GoogleAuthProvider.credentialFromResult(userCredential)
    const token = credential.accessToken
    const user = userCredential.user

    return { user, token }
  }
}
