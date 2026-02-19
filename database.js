// database.js - SISTEMA DE SINCRONIZACIÓN CON FIREBASE
class SincronizadorFederacion {
    constructor() {
        this.db = null;
        this.conectado = false;
        this.usuarioId = null;
        this.ultimoCambio = null;
        this.datosLocales = null;
        this.firebaseInicializado = false;
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
            
            // Configurar escucha en tiempo real
            this.escucharCambios();
            
            // Cargar datos iniciales
            await this.cargarDeNube();
            
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
                    
                    // Mostrar notificación
                    this.mostrarNotificacionCambio();
                    
                    // Recargar datos
                    this.cargarDeNube();
                }
            }, (error) => {
                console.error('❌ Error en escucha:', error);
            });
    }

    mostrarNotificacionCambio() {
        const notificacion = document.createElement('div');
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #FFA500, #FF4500);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            z-index: 99999;
            min-width: 300px;
            animation: slideIn 0.5s ease;
            border-left: 5px solid #00ff00;
            font-family: Arial, sans-serif;
        `;
        
        notificacion.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <i class="fas fa-sync-alt fa-spin" style="color: #00ff00; font-size: 1.2em;"></i>
                <div>
                    <strong style="font-size: 1.1em;">¡Nuevos cambios disponibles!</strong>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em; opacity: 0.9;">
                        Otro usuario actualizó los datos
                    </p>
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="btn-recargar-firebase" 
                        style="background: #00ff00; color: black; 
                               border: none; padding: 8px 15px; 
                               border-radius: 5px; cursor: pointer;
                               font-weight: bold; font-size: 0.9em;">
                    🔄 Recargar ahora
                </button>
                <button id="btn-cerrar-notif-firebase" 
                        style="background: transparent; color: white; 
                               border: 1px solid white; padding: 8px 15px; 
                               border-radius: 5px; cursor: pointer;
                               font-size: 0.9em;">
                    ✕ Cerrar
                </button>
            </div>
        `;
        
        document.body.appendChild(notificacion);
        
        document.getElementById('btn-recargar-firebase').onclick = function() {
            window.location.reload();
        };
        
        document.getElementById('btn-cerrar-notif-firebase').onclick = function() {
            notificacion.remove();
        };
        
        setTimeout(() => {
            if (notificacion.parentElement) {
                notificacion.remove();
            }
        }, 30000);
    }

    async guardarEnNube(datosCompletos) {
        if (!this.conectado || !this.db) {
            console.log('⚠️ No conectado, guardando localmente');
            this.guardarLocales(datosCompletos);
            return false;
        }

        try {
            console.log('☁️ Guardando en Firebase...');
            
            const fechaActual = new Date();
            const totalEstudiantes = Object.values(datosCompletos.cursos || {}).reduce((total, curso) => total + (curso.estudiantes?.length || 0), 0);
            
            // Guardar en Firestore
            await this.db.collection('datosFederacion').doc('configuracion').set({
                datosJSON: JSON.stringify(datosCompletos),
                ultimaActualizacion: fechaActual,
                ultimoUsuario: this.usuarioId,
                totalEstudiantes: totalEstudiantes
            });
            
            console.log('✅ Datos guardados en Firebase');
            
            // Guardar respaldo local
            this.guardarLocales(datosCompletos);
            
            // Marcar último cambio
            const timestamp = Date.now().toString();
            localStorage.setItem('federacion_ultimo_cambio', timestamp);
            this.ultimoCambio = timestamp;
            
            return true;
            
        } catch (error) {
            console.error('❌ Error guardando en Firebase:', error);
            this.guardarLocales(datosCompletos);
            return false;
        }
    }

    async cargarDeNube() {
        if (!this.conectado || !this.db) {
            console.log('⚠️ No conectado, cargando local');
            return this.cargarLocales();
        }

        try {
            console.log('📂 Cargando desde Firebase...');
            
            const docRef = this.db.collection('datosFederacion').doc('configuracion');
            const docSnap = await docRef.get();
            
            if (docSnap.exists) {
                const data = docSnap.data();
                console.log('✅ Datos cargados de Firebase');
                console.log('- Última actualización:', data.ultimaActualizacion?.toDate?.() || 'desconocida');
                console.log('- Último usuario:', data.ultimoUsuario || 'desconocido');
                
                const datosParseados = JSON.parse(data.datosJSON);
                this.guardarLocales(datosParseados);
                return datosParseados;
            } else {
                console.log('ℹ️ No hay datos en Firebase');
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
            this.datosLocales = JSON.parse(guardado);
            return this.datosLocales;
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

// Función para depuración
window.verEstadoSincronizacion = function() {
    if (window.sincronizador) {
        const estado = window.sincronizador.getEstado();
        console.log('📊 Estado sincronización:', estado);
        alert(`Estado: ${estado.conectado ? '✅ CONECTADO' : '❌ DESCONECTADO'}\nUsuario: ${estado.usuario}\nModo: ${estado.modo}`);
    } else {
        console.log('❌ Sincronizador no disponible');
    }
};
