// Service worker per le notifiche push in background.
// NOTA: questi valori sono pubblici (sono gli stessi già visibili nel
// codice del sito), non sono segreti — servono solo a far combaciare
// il service worker con il progetto Firebase giusto.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyCVVdyTjKZ555dVfG-MMqhCslkYtHXvcpw",
  authDomain: "richieste-materiale-f8f7b.firebaseapp.com",
  projectId: "richieste-materiale-f8f7b",
  storageBucket: "richieste-materiale-f8f7b.firebasestorage.app",
  messagingSenderId: "772503287683",
  appId: "1:772503287683:web:de7f87c6d7cbd6af1928b6",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Richieste Materiale'
  const options = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  }
  self.registration.showNotification(title, options)
})
