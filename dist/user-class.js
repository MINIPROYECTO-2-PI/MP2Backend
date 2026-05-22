"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const firebase_js_1 = __importDefault(require("./firebase.js"));
const firestore_1 = require("firebase/firestore");
const auth_1 = require("firebase/auth");
const ref = (0, firestore_1.collection)(firebase_js_1.default, 'users');
const auth = (0, auth_1.getAuth)();
const provider = new auth_1.GoogleAuthProvider();
class User {
    static async create({ username, password, email, name, surname, avatar }) {
        if (typeof username !== 'string' || typeof password !== 'string') {
            throw new Error('Username and password must be strings');
        }
        if (username.length < 3) {
            throw new Error('Username must be at least 3 characters long');
        }
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        const qEmail = (0, firestore_1.query)(ref, (0, firestore_1.where)('email', '==', email));
        const snapEmail = await (0, firestore_1.getDocs)(qEmail);
        if (!snapEmail.empty) {
            throw new Error('El correo electrónico ya está en uso');
        }
        const q = (0, firestore_1.query)(ref, (0, firestore_1.where)('username', '==', username));
        const snapshot = await (0, firestore_1.getDocs)(q);
        if (!snapshot.empty) {
            throw new Error('El nombre de usuario ya está en uso');
        }
        const userCredential = await (0, auth_1.createUserWithEmailAndPassword)(auth, email, password);
        const firebaseUser = userCredential.user;
        await (0, firestore_1.addDoc)(ref, {
            username,
            uid: firebaseUser.uid,
            email,
            name,
            surname,
            avatar,
            createdAt: new Date()
        });
        return firebaseUser;
    }
    static async login({ username, password }) {
        let emailAddress = '';
        const isEmail = username.includes('@');
        if (isEmail) {
            const q = (0, firestore_1.query)(ref, (0, firestore_1.where)('email', '==', username));
            const snapshot = await (0, firestore_1.getDocs)(q);
            if (snapshot.empty) {
                throw new Error('Usuario no encontrado con este correo');
            }
            emailAddress = username;
        }
        else {
            const q = (0, firestore_1.query)(ref, (0, firestore_1.where)('username', '==', username));
            const snapshot = await (0, firestore_1.getDocs)(q);
            if (snapshot.empty) {
                throw new Error('Usuario no encontrado con este nombre de usuario');
            }
            emailAddress = snapshot.docs[0].data().email;
        }
        const userCredential = await (0, auth_1.signInWithEmailAndPassword)(auth, emailAddress, password);
        return userCredential.user;
    }
    static async googleLogin() {
        const userCredential = await (0, auth_1.signInWithPopup)(auth, provider);
        const credential = auth_1.GoogleAuthProvider.credentialFromResult(userCredential);
        const token = credential?.accessToken ?? null;
        const user = userCredential.user;
        return { user, token };
    }
}
exports.User = User;
//# sourceMappingURL=user-class.js.map