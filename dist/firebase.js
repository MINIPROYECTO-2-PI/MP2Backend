"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const firebaseConfig = {
    apiKey: 'AIzaSyA1j3mybOpG9gcINcts2Pk8veE_m3VCGJI',
    authDomain: 'mproyecto2-e6d4e.firebaseapp.com',
    projectId: 'mproyecto2-e6d4e',
    storageBucket: 'mproyecto2-e6d4e.firebasestorage.app',
    messagingSenderId: '881475675016',
    appId: '1:881475675016:web:aa61a99fca124074a4903d'
};
const firebase = (0, app_1.initializeApp)(firebaseConfig);
const db = (0, firestore_1.getFirestore)(firebase);
exports.default = db;
//# sourceMappingURL=firebase.js.map