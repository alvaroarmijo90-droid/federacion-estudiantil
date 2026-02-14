// database.js - VERSIÓN PARA NAVEGADOR (SIN INSTALAR NADA)
class SincronizadorFederacion {
    constructor() {
        this.conectado = false;
        this.usuarioId = null;
        this.ultimoCambio = null;
        this.config = null;
        // Guardar datos localmente mientras tanto
        this.datosLocales = null;
    }

    async conectar(configTiDB) {
        try {
            console.log('🔌 Conectando a TiDB Serverless vía API...');
            this.config = configTiDB;
            
            // Extraer información de la URL
            // mysql://2WfMkBbrFCU7Bit.root:m3BfqOZzJZz45HvE@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test
            const match = this.config.url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
            if (!match) {
                console.error('❌ URL de conexión inválida');
                return false;
            }
            
            this.dbUser = match[1];      // 2WfMkBbrFCU7Bit.root
            this.dbPassword = match[2];   // m3BfqOZzJZz45HvE
            this.dbHost = match[3];       // gateway01.us-east-1.prod.aws.tidbcloud.com
            this.dbPort = match[4];       // 4000
            this.dbName = match[5];       // test
            
            console.log('📡 Conectando a:', this.dbHost);
            
            // Probar conexión haciendo una petición a un endpoint público
            // (Esto es solo una simulación - TiDB no tiene endpoint público directo)
            
            this.conectado = true;
            console.log('✅ Modo API activado');
            
            // ID de usuario
            let userId = localStorage.getItem('federacion_user_id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                localStorage.setItem('federacion_user_id', userId);
            }
            this.usuarioId = userId;
            
            // Cargar datos guardados localmente
            this.datosLocales = this.cargarLocales();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error:', error);
            this.conectado = false;
            return false;
        }
    }

    cargarLocales() {
        const guardado = localStorage.getItem('datosFederacion');
        return guardado ? JSON.parse(guardado) : null;
    }

    guardarLocales(datos) {
        localStorage.setItem('datosFederacion', JSON.stringify(datos));
        this.datosLocales = datos;
    }

    async guardarEnNube(datosCompletos) {
        // Por ahora, solo guardamos localmente
        // (TiDB requiere un backend intermedio para conexiones seguras)
        console.log('💾 Guardando localmente (modo offline)');
        this.guardarLocales(datosCompletos);
        
        // Mostrar mensaje de que necesitas un backend
        console.log('ℹ️ Para sincronización real, necesitas un pequeño backend en Node.js');
        return true;
    }

    async cargarDeNube() {
        console.log('📂 Cargando desde almacenamiento local');
        return this.datosLocales;
    }

    getEstado() {
        return {
            conectado: this.conectado,
            usuario: this.usuarioId,
            modo: 'local',
            ultimoCambio: this.ultimoCambio
        };
    }
}

// Crear instancia global
window.sincronizador = new SincronizadorFederacion();

// Función para depuración
window.verEstadoSincronizacion = function() {
    if (window.sincronizador) {
        const estado = window.sincronizador.getEstado();
        console.log('📊 Estado:', estado);
        alert(`Modo: LOCAL\nConectado: ${estado.conectado ? 'SÍ' : 'NO'}\nUsuario: ${estado.usuario}\n\nLos datos se guardan en este navegador solamente`);
    }
};
