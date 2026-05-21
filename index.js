import express from 'express'
import { PORT } from './config.js'
import { User } from './user-class.js'
import db from './firebase.js'

const app = express()
app.get('/', (req, res) => {
  res.send('Servidor funcionando')
})

app.post('/login', async (req, res) => {
  // Lógica para el inicio de sesión
})
app.post('/register', async (req, res) => {
  try {
    const docRef = await User.create({
      username: 'pirrijhoan',
      password: 'password123',
      email: 'jhoan@example.com',
      name: 'Jhoan',
      surname: 'Munoz',
      avatar: 'https://example.com/avatar.jpg'
    })
    res.json({ message: 'Usuario registrado exitosamente' })
    console.log(docRef)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
app.post('/logout', (req, res) => {
  // Lógica para el inicio de sesión
})
app.get('/protected', (req, res) => {
  // Lógica para el inicio de sesión
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
