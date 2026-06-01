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
    static async getProfile(uid) {
        const q = (0, firestore_1.query)(ref, (0, firestore_1.where)('uid', '==', uid));
        const snapshot = await (0, firestore_1.getDocs)(q);
        if (snapshot.empty) {
            throw new Error('Usuario no encontrado');
        }
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
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
        };
    }
    static async updateProfile(uid, updates) {
        // Find the user document
        const q = (0, firestore_1.query)(ref, (0, firestore_1.where)('uid', '==', uid));
        const snapshot = await (0, firestore_1.getDocs)(q);
        if (snapshot.empty) {
            throw new Error('Usuario no encontrado');
        }
        const userDoc = snapshot.docs[0];
        const currentData = userDoc.data();
        // Check for username collision if username is being changed
        if (updates.username && updates.username !== currentData.username) {
            if (updates.username.length < 3) {
                throw new Error('El nombre de usuario debe tener al menos 3 caracteres');
            }
            const qUsername = (0, firestore_1.query)(ref, (0, firestore_1.where)('username', '==', updates.username));
            const usernameSnap = await (0, firestore_1.getDocs)(qUsername);
            if (!usernameSnap.empty) {
                throw new Error('El nombre de usuario ya está en uso por otro estudiante');
            }
        }
        // Check for email collision if email is being changed
        if (updates.email && updates.email !== currentData.email) {
            const qEmail = (0, firestore_1.query)(ref, (0, firestore_1.where)('email', '==', updates.email));
            const emailSnap = await (0, firestore_1.getDocs)(qEmail);
            if (!emailSnap.empty) {
                throw new Error('El correo electrónico ya está en uso por otro estudiante');
            }
        }
        // Build the update object (only include provided fields)
        const updateData = {};
        if (updates.name !== undefined)
            updateData.name = updates.name;
        if (updates.surname !== undefined)
            updateData.surname = updates.surname;
        if (updates.username !== undefined)
            updateData.username = updates.username;
        if (updates.email !== undefined)
            updateData.email = updates.email;
        if (updates.avatar !== undefined)
            updateData.avatar = updates.avatar;
        // Update the document
        const docRef = (0, firestore_1.doc)(firebase_js_1.default, 'users', userDoc.id);
        await (0, firestore_1.updateDoc)(docRef, updateData);
        // Fetch and return updated profile
        const updatedDoc = await (0, firestore_1.getDoc)(docRef);
        const updatedData = updatedDoc.data();
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
        };
    }
    static async deleteAccount(uid) {
        // Find and delete the Firestore user document
        const q = (0, firestore_1.query)(ref, (0, firestore_1.where)('uid', '==', uid));
        const snapshot = await (0, firestore_1.getDocs)(q);
        if (snapshot.empty) {
            throw new Error('Usuario no encontrado');
        }
        const userDoc = snapshot.docs[0];
        const docRef = (0, firestore_1.doc)(firebase_js_1.default, 'users', userDoc.id);
        await (0, firestore_1.deleteDoc)(docRef);
        // Delete the Firebase Auth user (client-side)
        // Note: The current authenticated user must be the one being deleted
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === uid) {
            await (0, auth_1.deleteUser)(currentUser);
        }
    }
}
exports.User = User;
//# sourceMappingURL=user-class.js.map