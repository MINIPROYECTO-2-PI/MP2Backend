import express from 'express'
import type { Request, Response } from 'express'
import cors from 'cors'
import { PORT } from './config.js'
import { User } from './user-class.js'
import { Room } from './room-class.js'
import db from './firebase.js'
import { getAvatar } from './initials.js'
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc
} from 'firebase/firestore'
import type { DocumentData, QuerySnapshot } from 'firebase/firestore'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (_req: Request, res: Response) => {
  res.send('Servidor funcionando')
})

app.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as {
      username?: string
      password?: string
    }

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Usuario/correo y contraseña son requeridos' })
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

app.post('/change-room-name', async (req: Request, res: Response) => {
  try {
    const { name, newName, hostUid, roomId } = req.body as {
      name?: string
      newName?: string
      hostUid?: string
      roomId?: string
    }
    if (!name || !newName || !hostUid || !roomId) {
      return res.status(400).json({
        error: 'Por favor escribe un nombre de sala y un nuevo nombre'
      })
    }

    const q = query(
      collection(db, 'rooms'),
      where('name', '==', name),
      where('hostUid', '==', hostUid),
      where('roomId', '==', roomId)
    )

    const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

    if (!snapshot.empty) {
      const room = snapshot.docs[0]

      await updateDoc(room.ref, { name: newName })

      res.json({
        message: 'Nombre de sala actualizado exitosamente'
      })
    } else {
      return res.status(404).json({ error: 'Sala no encontrada' })
    }
  } catch (error) {
    console.log(error)
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
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
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
        message:
          'Por favor, elige tu nombre de usuario único para completar tu perfil',
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

app.get('/test', (_req, res) => {
  console.log('ENTRO A TEST')
  res.json({ ok: true })
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
      return res
        .status(400)
        .json({ error: 'Datos incompletos para completar el perfil' })
    }

    if (username.length < 3) {
      return res.status(400).json({
        error: 'El nombre de usuario debe tener al menos 3 caracteres'
      })
    }

    const ref = collection(db, 'users')
    const q = query(ref, where('username', '==', username))
    const snapshot: QuerySnapshot<DocumentData> = await getDocs(q)

    if (!snapshot.empty) {
      return res
        .status(400)
        .json({ error: 'El nombre de usuario ya está en uso' })
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

// ═══════════════════════════════════════════════
//  US-04 — Perfil de Usuario: Ver y Editar
// ═══════════════════════════════════════════════

app.get('/profile/:uid', async (req: Request, res: Response) => {
  try {
    const uid = req.params.uid as string
    const profile = await User.getProfile(uid)

    res.json({
      message: 'Perfil obtenido exitosamente',
      profile: {
        uid: profile.uid,
        username: profile.username,
        email: profile.email,
        name: profile.name,
        surname: profile.surname,
        avatar: profile.avatar,
        provider: profile.provider,
        createdAt: profile.createdAt
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    res.status(404).json({ error: message })
  }
})

app.put('/profile/:uid', async (req: Request, res: Response) => {
  try {
    const uid = req.params.uid as string
    const { name, surname, username, email, avatar } = req.body as {
      name?: string
      surname?: string
      username?: string
      email?: string
      avatar?: string
    }

    const updatedProfile = await User.updateProfile(uid, {
      name,
      surname,
      username,
      email,
      avatar
    })

    res.json({
      message: 'Perfil actualizado exitosamente',
      profile: {
        uid: updatedProfile.uid,
        username: updatedProfile.username,
        email: updatedProfile.email,
        name: updatedProfile.name,
        surname: updatedProfile.surname,
        avatar: updatedProfile.avatar
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status =
      message.includes('ya está en uso') || message.includes('al menos')
        ? 409
        : 400
    res.status(status).json({ error: message })
  }
})

// ═══════════════════════════════════════════════
//  US-05 — Eliminar Cuenta de Usuario
// ═══════════════════════════════════════════════

app.delete('/profile/:uid', async (req: Request, res: Response) => {
  try {
    const uid = req.params.uid as string

    await User.deleteAccount(uid)

    res.json({
      message: 'Cuenta eliminada exitosamente'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    res.status(400).json({ error: message })
  }
})

// ═══════════════════════════════════════════════
//  US-06 — Crear y Visualizar Salas
// ═══════════════════════════════════════════════

app.post('/rooms', async (req: Request, res: Response) => {
  try {
    const { name, hostUid, hostUsername } = req.body as {
      name?: string
      hostUid?: string
      hostUsername?: string
    }

    if (!name || !hostUid || !hostUsername) {
      return res.status(400).json({
        error: 'Nombre de sala, UID y username del anfitrión son requeridos'
      })
    }

    const room = await Room.create({ name, hostUid, hostUsername })

    res.json({
      message: 'Sala creada exitosamente',
      room
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    res.status(400).json({ error: message })
  }
})



app.get('/rooms/:uid', async (req: Request, res: Response) => {
  try {
    const uid = req.params.uid as string
    const rooms = await Room.getByHost(uid)

    res.json({
      message: 'Salas obtenidas exitosamente',
      rooms
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    res.status(500).json({ error: message })
  }
})
app.get('/health', (_req, res) => {
  res.sendStatus(200)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
