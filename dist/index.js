"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_js_1 = require("./config.js");
const user_class_js_1 = require("./user-class.js");
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
app.listen(config_js_1.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${config_js_1.PORT}`);
});
//# sourceMappingURL=index.js.map