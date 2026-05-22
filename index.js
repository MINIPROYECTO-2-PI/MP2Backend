import express from 'express'
import cors from 'cors'
import { PORT } from './config.js'
import { User } from './user-class.js'
import db from './firebase.js'
import { getAvatar } from './initials.js'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Servidor funcionando')
})

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

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
    res.status(401).json({ error: error.message })
  }
})

app.post('/register', async (req, res) => {
  try {
    const { username, password, email, name, surname } = req.body

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
    res.status(400).json({ error: error.message })
  }
})

app.post('/google-login', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body

    if (!uid || !email) {
      return res.status(400).json({ error: 'Datos de Google incompletos' })
    }

    // Verificar si el usuario ya existe en Firestore con este uid
    const ref = collection(db, 'users')
    const q = query(ref, where('uid', '==', uid))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      // Es un usuario nuevo, necesita elegir username obligatoriamente
      return res.json({
        isNewUser: true,
        message: 'Por favor, elige tu nombre de usuario único para completar tu perfil',
        user: { uid, email, displayName, photoURL }
      })
    }

    // Ya existe en Firestore, login recurrente exitoso
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
    res.status(500).json({ error: error.message })
  }
})

app.post('/google-register-complete', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL, username } = req.body

    if (!uid || !email || !username) {
      return res.status(400).json({ error: 'Datos incompletos para completar el perfil' })
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' })
    }

    // Validar que el username no esté en uso
    const ref = collection(db, 'users')
    const q = query(ref, where('username', '==', username))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso' })
    }

    // Crear el documento de usuario en Firestore
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
    res.status(500).json({ error: error.message })
  }
})

app.post('/logout', (req, res) => {
  res.json({ message: 'Sesión cerrada exitosamente' })
})

app.get('/protected', (req, res) => {
  res.json({ message: 'Ruta protegida' })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
