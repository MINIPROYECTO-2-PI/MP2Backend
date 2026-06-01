"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_js_1 = require("./config.js");
const user_class_js_1 = require("./user-class.js");
const room_class_js_1 = require("./room-class.js");
const firebase_js_1 = __importDefault(require("./firebase.js"));
const initials_js_1 = require("./initials.js");
const firestore_1 = require("firebase/firestore");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.send('Servidor funcionando');
});
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario/correo y contraseña son requeridos' });
        }
        const user = await user_class_js_1.User.login({ username, password });
        res.json({
            message: 'Usuario logueado exitosamente',
            user: {
                uid: user.uid,
                email: user.email
            }
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        res.status(401).json({ error: message });
    }
});
app.post('/register', async (req, res) => {
    try {
        const { username, password, email, name, surname } = req.body;
        if (!username || !password || !email || !name || !surname) {
            return res
                .status(400)
                .json({ error: 'Todos los campos son requeridos' });
        }
        const firebaseUser = await user_class_js_1.User.create({
            username,
            password,
            email,
            name,
            surname,
            avatar: (0, initials_js_1.getAvatar)(name)
        });
        res.json({
            message: 'Usuario registrado exitosamente',
            user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email
            }
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        res.status(400).json({ error: message });
    }
});
app.post('/google-login', async (req, res) => {
    try {
        const { uid, email, displayName, photoURL } = req.body;
        if (!uid || !email) {
            return res.status(400).json({ error: 'Datos de Google incompletos' });
        }
        const ref = (0, firestore_1.collection)(firebase_js_1.default, 'users');
        const q = (0, firestore_1.query)(ref, (0, firestore_1.where)('uid', '==', uid));
        const snapshot = await (0, firestore_1.getDocs)(q);
        if (snapshot.empty) {
            return res.json({
                isNewUser: true,
                message: 'Por favor, elige tu nombre de usuario único para completar tu perfil',
                user: { uid, email, displayName, photoURL }
            });
        }
        const existingUserData = snapshot.docs[0].data();
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
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({ error: message });
    }
});
app.post('/google-register-complete', async (req, res) => {
    try {
        const { uid, email, displayName, photoURL, username } = req.body;
        if (!uid || !email || !username) {
            return res.status(400).json({ error: 'Datos incompletos para completar el perfil' });
        }
        if (username.length < 3) {
            return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
        }
        const ref = (0, firestore_1.collection)(firebase_js_1.default, 'users');
        const q = (0, firestore_1.query)(ref, (0, firestore_1.where)('username', '==', username));
        const snapshot = await (0, firestore_1.getDocs)(q);
        if (!snapshot.empty) {
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
        }
        const nameParts = (displayName || '').split(' ');
        const name = nameParts[0] || 'Usuario';
        const surname = nameParts.slice(1).join(' ') || '';
        await (0, firestore_1.addDoc)(ref, {
            username,
            uid,
            email,
            name,
            surname,
            avatar: photoURL || (0, initials_js_1.getAvatar)(name),
            createdAt: new Date(),
            provider: 'google'
        });
        res.json({
            message: 'Perfil completado y registrado exitosamente',
            user: { uid, email, displayName, photoURL, username }
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({ error: message });
    }
});
app.post('/logout', (_req, res) => {
    res.json({ message: 'Sesión cerrada exitosamente' });
});
app.get('/protected', (_req, res) => {
    res.json({ message: 'Ruta protegida' });
});
// ═══════════════════════════════════════════════
//  US-04 — Perfil de Usuario: Ver y Editar
// ═══════════════════════════════════════════════
app.get('/profile/:uid', async (req, res) => {
    try {
        const uid = req.params.uid;
        const profile = await user_class_js_1.User.getProfile(uid);
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
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        res.status(404).json({ error: message });
    }
});
app.put('/profile/:uid', async (req, res) => {
    try {
        const uid = req.params.uid;
        const { name, surname, username, email, avatar } = req.body;
        const updatedProfile = await user_class_js_1.User.updateProfile(uid, {
            name,
            surname,
            username,
            email,
            avatar
        });
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
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        const status = (message.includes('ya está en uso') || message.includes('al menos')) ? 409 : 400;
        res.status(status).json({ error: message });
    }
});
// ═══════════════════════════════════════════════
//  US-05 — Eliminar Cuenta de Usuario
// ═══════════════════════════════════════════════
app.delete('/profile/:uid', async (req, res) => {
    try {
        const uid = req.params.uid;
        await user_class_js_1.User.deleteAccount(uid);
        res.json({
            message: 'Cuenta eliminada exitosamente'
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        res.status(400).json({ error: message });
    }
});
// ═══════════════════════════════════════════════
//  US-06 — Crear y Visualizar Salas
// ═══════════════════════════════════════════════
app.post('/rooms', async (req, res) => {
    try {
        const { name, hostUid, hostUsername } = req.body;
        if (!name || !hostUid || !hostUsername) {
            return res.status(400).json({ error: 'Nombre de sala, UID y username del anfitrión son requeridos' });
        }
        const room = await room_class_js_1.Room.create({ name, hostUid, hostUsername });
        res.json({
            message: 'Sala creada exitosamente',
            room
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        res.status(400).json({ error: message });
    }
});
app.get('/rooms/:uid', async (req, res) => {
    try {
        const uid = req.params.uid;
        const rooms = await room_class_js_1.Room.getByHost(uid);
        res.json({
            message: 'Salas obtenidas exitosamente',
            rooms
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({ error: message });
    }
});
app.listen(config_js_1.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${config_js_1.PORT}`);
});
//# sourceMappingURL=index.js.map