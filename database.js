// database.js - SISTEMA DE SINCRONIZACIÓN CON FIREBASE - CORREGIDO
class SincronizadorFederacion {
    constructor() {
        this.db = null;
        this.conectado = false;
        this.usuarioId = null;
        this.ultimoCambio = null;
        this.datosLocales = null;
        this.firebaseInicializado = false;
        this.primerCarga = true; // Para controlar la primera carga
    }

    async conectar(configFirebase) {
        try {
            console.log('🔌 Conectando a Firebase...');
            
            // Inicializar Firebase si no está inicializado
            if (!this.firebaseInicializado) {
                firebase.initializeApp(configFirebase);
                this.firebaseInicializado = true;
            }
            
            // Obtener referencia a Firestore
            this.db = firebase.firestore();
            
            console.log('✅ Firebase inicializado');
            
            // ID de usuario
            let userId = localStorage.getItem('federacion_user_id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                localStorage.setItem('federacion_user_id', userId);
            }
            this.usuarioId = userId;
            
            this.conectado = true;
            console.log('✅ Conectado a Firebase Firestore');
            
            // Configurar escucha en tiempo real (con retraso para evitar sobrescritura)
            setTimeout(() => {
                this.escucharCambios();
            }, 3000);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error conectando a Firebase:', error);
            this.conectado = false;
            return false;
        }
    }

    escucharCambios() {
        if (!this.conectado || !this.db) return;
        
        console.log('👂 Escuchando cambios en tiempo real...');
        
        // Escuchar el documento de configuración
        this.db.collection('datosFederacion').doc('configuracion')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    console.log('📢 Cambio detectado en Firebase:', data);
                    
                    // Evitar procesar cambios propios
                    if (data.ultimoUsuario === this.usuarioId) {
                        console.log('🔄 Ignorando cambio propio');
                        return;
                    }
                    
                    // Verificar si tenemos datos locales más recientes
                    const ultimoLocal = localStorage.getItem('federacion_ultimo_cambio');
                    const ultimoFirebase = data.timestamp || 0;
                    
                    if (ultimoLocal && parseInt(ultimoLocal) > ultimoFirebase) {
                        console.log('⚠️ Datos locales son más recientes, ignorando Firebase');
                        return;
                    }
                    
                    // Mostrar notificación
                    this.mostrarNotificacionCambio();
                    
                    // Opcional: Recargar si el usuario quiere
                    // No recargar automáticamente para no perder datos
                }
            }, (error) => {
                console.error('❌ Error en escucha:', error);
            });
    }

    mostrarNotificacionCambio() {
        // Solo si existe la función
        if (typeof mostrarMensaje === 'function') {
            mostrarMensaje('🔄 Hay cambios en Firebase. ¿Recargar?', 'info');
        }
    }

    async guardarEnNube(datosCompletos) {
    if (!this.conectado || !this.db) {
        console.log('⚠️ No conectado a Firebase');
        return false;
    }

    try {
        console.log('☁️ Guardando en Firebase...');
        
        const fechaActual = new Date();
        const timestamp = Date.now();
        
        // Guardar en Firestore
        await this.db.collection('datosFederacion').doc('configuracion').set({
            datosJSON: JSON.stringify(datosCompletos),
            ultimaActualizacion: fechaActual,
            ultimoUsuario: this.usuarioId,
            timestamp: timestamp
        });
        
        console.log('✅ Datos guardados en Firebase');
        
        // NO guardar en localStorage aquí para evitar el error
        // this.guardarLocales(datosCompletos); ← ELIMINAR ESTA LÍNEA
        
        localStorage.setItem('federacion_ultimo_cambio', timestamp.toString());
        this.ultimoCambio = timestamp;
        
        return true;
        
    } catch (error) {
        console.error('❌ Error guardando en Firebase:', error);
        return false;
    }
}

    async cargarDeNube() {
        // 🔴 NUEVA LÓGICA: SOLO CARGAR SI EL USUARIO LO PIDE EXPLÍCITAMENTE
        console.log('📂 Verificando Firebase...');
        
        if (!this.conectado || !this.db) {
            console.log('⚠️ No conectado, usando local');
            return this.cargarLocales();
        }

        try {
            const docRef = this.db.collection('datosFederacion').doc('configuracion');
            const docSnap = await docRef.get();
            
            if (docSnap.exists) {
                const data = docSnap.data();
                console.log('✅ Datos encontrados en Firebase');
                console.log('- Última actualización:', data.ultimaActualizacion?.toDate?.() || 'desconocida');
                
                // Verificar si tenemos datos locales
                const datosLocales = this.cargarLocales();
                
                // Si NO hay datos locales, usar Firebase
                if (!datosLocales) {
                    console.log('📥 No hay datos locales, usando Firebase');
                    const datosParseados = JSON.parse(data.datosJSON);
                    this.guardarLocales(datosParseados);
                    return datosParseados;
                }
                
                // Si HAY datos locales, verificar cuál es más reciente
                const timestampFirebase = data.timestamp || 0;
                const timestampLocal = parseInt(localStorage.getItem('federacion_ultimo_cambio') || '0');
                
                if (timestampFirebase > timestampLocal) {
                    console.log('📥 Firebase tiene datos más recientes, actualizando local');
                    const datosParseados = JSON.parse(data.datosJSON);
                    this.guardarLocales(datosParseados);
                    return datosParseados;
                } else {
                    console.log('📥 Datos locales son más recientes, usando locales');
                    return datosLocales;
                }
                
            } else {
                console.log('ℹ️ No hay datos en Firebase, usando locales');
                return this.cargarLocales();
            }
            
        } catch (error) {
            console.error('❌ Error cargando de Firebase:', error);
            return this.cargarLocales();
        }
    }

    cargarLocales() {
        const guardado = localStorage.getItem('datosFederacion');
        if (guardado) {
            try {
                this.datosLocales = JSON.parse(guardado);
                return this.datosLocales;
            } catch (e) {
                console.error('Error parseando localStorage:', e);
                return null;
            }
        }
        return null;
    }

    guardarLocales(datos) {
        localStorage.setItem('datosFederacion', JSON.stringify(datos));
        this.datosLocales = datos;
    }

    getEstado() {
        return {
            conectado: this.conectado,
            usuario: this.usuarioId,
            modo: 'firebase-tiempo-real',
            ultimoCambio: this.ultimoCambio
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
    
    if (confirm('¿Cargar datos desde Firebase? Se perderán los cambios locales no guardados.')) {
        const datosFirebase = await window.sincronizador.cargarDeNube(true);
        if (datosFirebase) {
            window.location.reload();
        }
    }
};

// Función para depuración
window.verEstadoSincronizacion = function() {
    if (window.sincronizador) {
        const estado = window.sincronizador.getEstado();
        console.log('📊 Estado sincronización:', estado);
        
        // Verificar localStorage
        const local = localStorage.getItem('datosFederacion');
        const localData = local ? JSON.parse(local) : null;
        
        console.log('📊 Datos en localStorage:');
        console.log('- gastos:', localData?.gastos?.length || 0);
        console.log('- eventos:', localData?.eventos?.length || 0);
        console.log('- sectoresCobro:', localData?.sectoresCobro?.length || 0);
        
        alert(`Estado: ${estado.conectado ? '✅ CONECTADO' : '❌ DESCONECTADO'}\nUsuario: ${estado.usuario}\n\nGastos locales: ${localData?.gastos?.length || 0}\nEventos locales: ${localData?.eventos?.length || 0}\nSectores: ${localData?.sectoresCobro?.length || 0}`);
    } else {
        console.log('❌ Sincronizador no disponible');
        alert('❌ Sincronizador no disponible');
    }
};

console.log('✅ database.js corregido - Prioridad LOCAL sobre Firebase');

