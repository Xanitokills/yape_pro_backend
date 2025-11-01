// src/config/firebase.js
const admin = require('firebase-admin');

let firebaseApp = null;

/**
 * Inicializar Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('⚠️ Variables de Firebase no configuradas. Las notificaciones push no funcionarán.');
      return null;
    }

    // Si ya está inicializado, retornar
    if (firebaseApp) {
      return firebaseApp;
    }

    // Inicializar Firebase
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n') // Corregir saltos de línea
      })
    });

    console.log('✅ Firebase Admin SDK inicializado correctamente');
    return firebaseApp;

  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error.message);
    return null;
  }
}

// Inicializar al cargar el módulo
const app = initializeFirebase();

/**
 * Obtener instancia de Firebase Messaging
 */
function getMessaging() {
  if (!app) {
    throw new Error('Firebase no está inicializado');
  }
  return admin.messaging();
}

module.exports = {
  firebaseApp: app,
  getMessaging,
  admin
};
