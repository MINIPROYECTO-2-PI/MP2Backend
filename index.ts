import express from 'express'
import type { Request, Response } from 'express'
import cors from 'cors'
import { PORT } from './config.js'
import { User } from './user-class.js'
import db from './firebase.js'
import { getAvatar } from './initials.js'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import type { DocumentData, QuerySnapshot } from 'firebase/firestore'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (_req: Request, res: Response) => {
  res.send('Servidor funcionando')
})

app.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string }

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario/correo y contraseña son requeridos' })
    }

    const user = await User.login({ username, password })

    res.json({
      message: 'Usuario logueado exitosamente',
      user: {
        uid: user.uid,
        email: user.email
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    res.status(401).json({ error: message })
  }
})

app.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, email, name, surname } = req.body as {
      username?: string
      password?: string
      email?: string
      name?: string
      surname?: string
    }

    if (!username || !password || !email || !name || !surname) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son requeridos' })
    }

    const firebaseUser = await User.create({
      username,
      password,
      email,
      name,
      surname,
      avatar: getAvatar(name)
    })

    res.json({
      message: 'Usuario registrado exitosamente',
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    res.status(400).json({ error: message })
  }
})

app.post('/google-login', async (req: Request, res: Response) => {
  try {
    const { uid, email, displayName, photoURL } = req.body as {
      uid?: string
      email?: string
      displayName?: string
      photoURL?: string
    }

    if (!uid || !email) {
      return res.status(400).json({ error: 'Datos de Google incompletos' })
    }

    const ref = collection(db, 'users')
    const q = query(ref, where('uid', '==', uid))
    const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

    if (snapshot.empty) {
      return res.json({
        isNewUser: true,
        message: 'Por favor, elige tu nombre de usuario único para completar tu perfil',
        user: { uid, email, displayName, photoURL }
      })
    }

    const existingUserData = snapshot.docs[0].data()
    res.json({
      isNewUser: false,
      message: 'Inicio de sesión con Google exitoso',
      user: {
        uid,
        email,
        displayName: existingUserData.name + ' ' + existingUserData.surname,
        photoURL: existingUserData.avatar,
        username: existingUserData.username
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    res.status(500).json({ error: message })
  }
})

app.post('/google-register-complete', async (req: Request, res: Response) => {
  try {
    const { uid, email, displayName, photoURL, username } = req.body as {
      uid?: string
      email?: string
      displayName?: string
      photoURL?: string
      username?: string
    }

    if (!uid || !email || !username) {
      return res.status(400).json({ error: 'Datos incompletos para completar el perfil' })
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' })
    }

    const ref = collection(db, 'users')
    const q = query(ref, where('username', '==', username))
    const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

    if (!snapshot.empty) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso' })
    }

    const nameParts = (displayName || '').split(' ')
    const name = nameParts[0] || 'Usuario'
    const surname = nameParts.slice(1).join(' ') || ''

    await addDoc(ref, {
      username,
      uid,
      email,
      name,
      surname,
      avatar: photoURL || getAvatar(name),
      createdAt: new Date(),
      provider: 'google'
    })

    res.json({
      message: 'Perfil completado y registrado exitosamente',
      user: { uid, email, displayName, photoURL, username }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    res.status(500).json({ error: message })
  }
})

app.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Sesión cerrada exitosamente' })
})

app.get('/protected', (_req: Request, res: Response) => {
  res.json({ message: 'Ruta protegida' })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
