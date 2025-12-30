// config.js - CONFIGURACIÓN DE SUPABASE
// ⚠️ REEMPLAZA LOS VALORES CON LOS TUYOS ⚠️

const CONFIG_SUPABASE = {
    // ESTO ES LO QUE COPIAS DE SUPABASE
    URL: 'https://zdfdvojqaobbzsumgryv.supabase.co',  
    KEY: 'sb_publishable_az8W_VX92emh5jQ-c4JbVw_ry5Exvgy'    
};

// Configuración de la aplicación
const CONFIG_APP = {
    ADMIN_PASSWORD: "admin123",
    VERSION: "2.0.0",
    NOMBRE_FEDERACION: "Federación Estudiantil"
};

console.log('⚙️ Config.js cargado');
console.log('URL Supabase:', CONFIG_SUPABASE.URL ? '✓' : '✗');
console.log('KEY Supabase:', CONFIG_SUPABASE.KEY ? '✓' : '✗');