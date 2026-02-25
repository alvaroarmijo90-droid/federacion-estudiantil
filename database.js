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
        if (!this.conectado || !this.db) {
            console.log('⚠️ No conectado a Firebase');
            return false;
        }

        try {
            console.log('☁️ Guardando en Firebase...');
            
            const timestamp = Date.now();
            const fechaActual = new Date();
            
            // ============================================
            // CREAR UN SOLO OBJETO COMPLETO
            // ============================================
            const datosParaGuardar = {
                // METADATOS
                timestamp: timestamp,
                ultimaActualizacion: fechaActual.toISOString(),
                ultimoUsuario: this.usuarioId,
                
                // GASTOS - PESTAÑA COMPLETA
                gastos: datosCompletos.gastos || [],
                totalGastos: datosCompletos.totalGastos || 0,
                
                // EVENTOS - PESTAÑA COMPLETA
                eventos: datosCompletos.eventos || [],
                
                // OTROS COBROS - PESTAÑA COMPLETA
                sectoresCobro: datosCompletos.sectoresCobro || [],
                totalOtrosCobros: datosCompletos.totalOtrosCobros || 0,
                otrosCobrosSaldos: datosCompletos.otrosCobrosSaldos || [],
                otrosCobrosGastos: datosCompletos.otrosCobrosGastos || 0,
                
                // CURSOS - PESTAÑA COMPLETA
                cursos: datosCompletos.cursos || {},
                totalAportesEstudiantes: datosCompletos.totalAportesEstudiantes || 0,
                
                // CASILLEROS - PESTAÑA COMPLETA
                casilleros: datosCompletos.casilleros || {},
                gastosCasilleros: datosCompletos.gastosCasilleros || [],
                
                // CAJA - PESTAÑA COMPLETA
                movimientosCaja: datosCompletos.movimientosCaja || [],
                totalIngresosCaja: datosCompletos.totalIngresosCaja || 0,
                totalEgresosCaja: datosCompletos.totalEgresosCaja || 0,
                dineroInicial: datosCompletos.dineroInicial || 0,
                dineroFinal: datosCompletos.dineroFinal || 0
            };
            
            // GUARDAR EN UN SOLO DOCUMENTO
            await this.db.collection('datosFederacion').doc('datos_completos').set(datosParaGuardar);
            
            console.log('✅ Datos guardados en Firebase:');
            console.log(`- Gastos: ${datosCompletos.gastos?.length || 0}`);
            console.log(`- Eventos: ${datosCompletos.eventos?.length || 0}`);
            console.log(`- Sectores: ${datosCompletos.sectoresCobro?.length || 0}`);
            
            localStorage.setItem('federacion_ultimo_cambio', timestamp.toString());
            
            return true;
            
        } catch (error) {
            console.error('❌ Error guardando en Firebase:', error);
            return false;
        }
    }

    async cargarDeNube() {
        console.log('📂 Cargando desde Firebase...');
        
        if (!this.conectado || !this.db) {
            console.log('⚠️ No conectado, usando local');
            return this.cargarLocales();
        }

        try {
            const docRef = this.db.collection('datosFederacion').doc('datos_completos');
            const docSnap = await docRef.get();
            
            if (!docSnap.exists) {
                console.log('ℹ️ No hay datos en Firebase, usando locales');
                return this.cargarLocales();
            }
            
            const datosFirebase = docSnap.data();
            
            console.log('✅ Datos cargados de Firebase:');
            console.log(`- Gastos: ${datosFirebase.gastos?.length || 0}`);
            console.log(`- Eventos: ${datosFirebase.eventos?.length || 0}`);
            console.log(`- Sectores: ${datosFirebase.sectoresCobro?.length || 0}`);
            
            // Verificar si tenemos locales más recientes
            const datosLocales = this.cargarLocales();
            const timestampFirebase = datosFirebase.timestamp || 0;
            const timestampLocal = parseInt(localStorage.getItem('federacion_ultimo_cambio') || '0');
            
            if (timestampLocal > timestampFirebase) {
                console.log('📥 Usando datos locales (más recientes)');
                return datosLocales;
            }
            
            // Guardar en localStorage
            if (datosFirebase) {
                localStorage.setItem('datosFederacion', JSON.stringify(datosFirebase));
            }
            
            return datosFirebase;
            
        } catch (error) {
            console.error('❌ Error cargando de Firebase:', error);
            return this.cargarLocales();
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
