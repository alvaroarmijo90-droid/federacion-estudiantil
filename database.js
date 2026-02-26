// database.js - SISTEMA DE SINCRONIZACIÓN CON FIREBASE - CORREGIDO Y FUNCIONAL
class SincronizadorFederacion {
    constructor() {
        this.db = null;
        this.conectado = false;
        this.usuarioId = null;
        this.firebaseInicializado = false;
    }

    async conectar(configFirebase) {
        try {
            console.log('🔌 Conectando a Firebase...');
            
            if (!this.firebaseInicializado) {
                firebase.initializeApp(configFirebase);
                this.firebaseInicializado = true;
            }
            
            this.db = firebase.firestore();
            
            let userId = localStorage.getItem('federacion_user_id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                localStorage.setItem('federacion_user_id', userId);
            }
            this.usuarioId = userId;
            
            this.conectado = true;
            console.log('✅ Conectado a Firebase Firestore');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error conectando a Firebase:', error);
            this.conectado = false;
            return false;
        }
    }

async guardarEnNube(datosCompletos) {
    try {
        const response = await fetch("https://soft-sea-95e1.alvaroarmijo90.workers.dev", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosCompletos)
        });

        if (!response.ok) throw new Error("Error al guardar");

        console.log("✅ Datos guardados en Cloudflare");
        return true;

    } catch (error) {
        console.error("❌ Error guardando:", error);
        return false;
    }
}

async cargarDeNube() {
    try {
        const response = await fetch("https://soft-sea-95e1.alvaroarmijo90.workers.dev");

        if (!response.ok) throw new Error("Error al cargar");

        const datos = await response.json();

        if (datos && datos.contenido) {
            return JSON.parse(datos.contenido);
        }

        return null;

    } catch (error) {
        console.error("❌ Error cargando:", error);
        return null;
    }
}

    cargarLocales() {
        const guardado = localStorage.getItem('datosFederacion');
        if (guardado) {
            try {
                return JSON.parse(guardado);
            } catch (e) {
                console.error('Error parseando localStorage:', e);
                return null;
            }
        }
        return null;
    }

    guardarLocales(datos) {
        localStorage.setItem('datosFederacion', JSON.stringify(datos));
    }

    getEstado() {
        return {
            conectado: this.conectado,
            usuario: this.usuarioId
        };
    }
}

// Crear instancia global
window.sincronizador = new SincronizadorFederacion();

// Función para forzar carga desde Firebase
window.forzarCargaFirebase = async function() {
    if (!window.sincronizador) {
        alert('Sincronizador no disponible');
        return;
    }
    
    if (confirm('¿Cargar datos desde Firebase? Se perderán cambios locales.')) {
        const datosFirebase = await window.sincronizador.cargarDeNube();
        if (datosFirebase) {
            window.datos = datosFirebase;
            if (typeof guardarDatos === 'function') guardarDatos();
            alert('✅ Datos cargados desde Firebase');
        }
    }
};

// Función para verificar Firebase
window.verificarFirebase = async function() {
    if (!window.sincronizador || !window.sincronizador.db) {
        alert('Sincronizador no disponible');
        return;
    }
    
    try {
        const docRef = window.sincronizador.db.collection('datosFederacion').doc('datos_completos');
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            const data = docSnap.data();
            console.log('📊 DATOS EN FIREBASE:', data);
            alert(`✅ Firebase tiene:\n- Gastos: ${data.gastos?.length || 0}\n- Eventos: ${data.eventos?.length || 0}\n- Sectores: ${data.sectoresCobro?.length || 0}`);
        } else {
            alert('❌ No hay datos en Firebase');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
};

console.log('✅ database.js - VERSIÓN SIMPLE Y FUNCIONAL');

