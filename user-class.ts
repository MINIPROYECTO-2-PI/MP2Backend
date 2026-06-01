import db from './firebase.js'
import { collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, doc } from 'firebase/firestore'
import type { DocumentData, QuerySnapshot } from 'firebase/firestore'

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  deleteUser as deleteFirebaseUser
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

interface UpdateProfileData {
  name?: string
  surname?: string
  username?: string
  email?: string
  avatar?: string
}

interface UserProfile {
  docId: string
  uid: string
  username: string
  email: string
  name: string
  surname: string
  avatar: string
  provider?: string
  createdAt?: Date
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

  static async getProfile(uid: string): Promise<UserProfile> {
    const q = query(ref, where('uid', '==', uid))
    const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

    if (snapshot.empty) {
      throw new Error('Usuario no encontrado')
    }

    const docSnap = snapshot.docs[0]
    const data = docSnap.data()

    return {
      docId: docSnap.id,
      uid: data.uid,
      username: data.username,
      email: data.email,
      name: data.name,
      surname: data.surname,
      avatar: data.avatar,
      provider: data.provider,
      createdAt: data.createdAt?.toDate?.() || data.createdAt
    }
  }

  static async updateProfile(uid: string, updates: UpdateProfileData): Promise<UserProfile> {
    // Find the user document
    const q = query(ref, where('uid', '==', uid))
    const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

    if (snapshot.empty) {
      throw new Error('Usuario no encontrado')
    }

    const userDoc = snapshot.docs[0]
    const currentData = userDoc.data()

    // Check for username collision if username is being changed
    if (updates.username && updates.username !== currentData.username) {
      if (updates.username.length < 3) {
        throw new Error('El nombre de usuario debe tener al menos 3 caracteres')
      }

      const qUsername = query(ref, where('username', '==', updates.username))
      const usernameSnap: QuerySnapshot<DocumentData> = await getDocs(qUsername)

      if (!usernameSnap.empty) {
        throw new Error('El nombre de usuario ya está en uso por otro estudiante')
      }
    }

    // Check for email collision if email is being changed
    if (updates.email && updates.email !== currentData.email) {
      const qEmail = query(ref, where('email', '==', updates.email))
      const emailSnap: QuerySnapshot<DocumentData> = await getDocs(qEmail)

      if (!emailSnap.empty) {
        throw new Error('El correo electrónico ya está en uso por otro estudiante')
      }
    }

    // Build the update object (only include provided fields)
    const updateData: Record<string, string> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.surname !== undefined) updateData.surname = updates.surname
    if (updates.username !== undefined) updateData.username = updates.username
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar

    // Update the document
    const docRef = doc(db, 'users', userDoc.id)
    await updateDoc(docRef, updateData)

    // Fetch and return updated profile
    const updatedDoc = await getDoc(docRef)
    const updatedData = updatedDoc.data()!

    return {
      docId: userDoc.id,
      uid: updatedData.uid,
      username: updatedData.username,
      email: updatedData.email,
      name: updatedData.name,
      surname: updatedData.surname,
      avatar: updatedData.avatar,
      provider: updatedData.provider,
      createdAt: updatedData.createdAt?.toDate?.() || updatedData.createdAt
    }
  }

  static async deleteAccount(uid: string): Promise<void> {
    // Find and delete the Firestore user document
    const q = query(ref, where('uid', '==', uid))
    const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

    if (snapshot.empty) {
      throw new Error('Usuario no encontrado')
    }

    const userDoc = snapshot.docs[0]
    const docRef = doc(db, 'users', userDoc.id)
    await deleteDoc(docRef)

    // Delete the Firebase Auth user (client-side)
    // Note: The current authenticated user must be the one being deleted
    const currentUser = auth.currentUser
    if (currentUser && currentUser.uid === uid) {
      await deleteFirebaseUser(currentUser)
    }
  }
}
