// config.js - CONFIGURACIÓN DE FIREBASE
const CONFIG_FIREBASE = {
    apiKey: "AIzaSyCexmO-DZrMmcPImII4ff5FYDN8YV0O09Y",
    authDomain: "federacion-estudiantil.firebaseapp.com",
    projectId: "federacion-estudiantil",
    storageBucket: "federacion-estudiantil.firebasestorage.app",
    messagingSenderId: "776623574249",
    appId: "1:776623574249:web:bd1ef98b867a8928987478"
};

// IMPORTANTE: También definimos CONFIG_SUPABASE como vacío para evitar errores
const CONFIG_SUPABASE = {
    URL: '',
    KEY: ''
};

const CONFIG_APP = {
    ADMIN_PASSWORD: "admin123",
    VERSION: "2.0.0",
    NOMBRE_FEDERACION: "Federación Estudiantil"
};

console.log('⚙️ Config.js cargado');
