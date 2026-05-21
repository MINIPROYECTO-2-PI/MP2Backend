// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from 'firebase/firestore'
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyA1j3mybOpG9gcINcts2Pk8veE_m3VCGJI',
  authDomain: 'mproyecto2-e6d4e.firebaseapp.com',
  projectId: 'mproyecto2-e6d4e',
  storageBucket: 'mproyecto2-e6d4e.firebasestorage.app',
  messagingSenderId: '881475675016',
  appId: '1:881475675016:web:aa61a99fca124074a4903d'
}

// Initialize Firebase
const firebase = initializeApp(firebaseConfig)
const db = getFirestore(firebase)
export default db
