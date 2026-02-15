// database.js - SISTEMA DE SINCRONIZACIÓN CON FIREBASE (CORREGIDO)
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
            
            // Verificar que Firebase esté cargado
            if (typeof firebase === 'undefined') {
                console.error('❌ Firebase no está cargado');
                return false;
            }
            
            // Inicializar Firebase
            if (!this.firebaseInicializado) {
                firebase.initializeApp(configFirebase);
                this.firebaseInicializado = true;
                console.log('✅ Firebase inicializado');
            }
            
            // Obtener referencia a Firestore
            this.db = firebase.firestore();
            console.log('✅ Firestore listo');
            
            // ID de usuario
            let userId = localStorage.getItem('federacion_user_id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                localStorage.setItem('federacion_user_id', userId);
            }
            this.usuarioId = userId;
            
            // PROBAR CONEXIÓN - equivalente a la prueba de Supabase
            console.log('🔄 Probando conexión...');
            try {
                const testDoc = await this.db.collection('datosFederacion').doc('test').get();
                console.log('✅ Conexión a Firebase exitosa');
                this.conectado = true;
            } catch (testError) {
                console.error('❌ Error de conexión:', testError.message);
                this.conectado = false;
                return false;
            }
            
            console.log('✅ Conectado a base de datos compartida (Firebase)');
            console.log('👤 Usuario ID:', this.usuarioId);
            
            // Escuchar cambios de otros (equivalente a Supabase realtime)
            this.escucharCambios();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error conectando:', error);
            this.conectado = false;
            return false;
        }
    }

    escucharCambios() {
        if (!this.conectado || !this.db) {
            console.log('⚠️ No se puede escuchar cambios - sin conexión');
            return;
        }
        
        console.log('👂 Escuchando cambios en tiempo real...');
        
        // Equivalente a Supabase Realtime
        this.db.collection('datosFederacion').doc('configuracion')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    console.log('📢 Cambio detectado en Firebase');
                    
                    // Evitar procesar nuestros propios cambios
                    const data = doc.data();
                    if (this.ultimoCambio && data.ultimoUsuario === this.usuarioId) {
                        console.log('🔄 Ignorando cambio propio');
                        return;
                    }
                    
                    // Mostrar notificación
                    this.mostrarNotificacionCambio();
                }
            }, (error) => {
                console.error('❌ Error escuchando cambios:', error);
            });
    }

    mostrarNotificacionCambio() {
        console.log('🔔 Mostrando notificación de cambio...');
        
        // Crear notificación (exactamente igual que en Supabase)
        const notificacion = document.createElement('div');
        notificacion.id = 'notificacion-cambio';
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
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
        
        // Agregar animación CSS si no existe
        if (!document.querySelector('#estilo-notificacion')) {
            const estilo = document.createElement('style');
            estilo.id = 'estilo-notificacion';
            estilo.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(estilo);
        }
        
        notificacion.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <i class="fas fa-sync-alt fa-spin" style="color: #00ff00; font-size: 1.2em;"></i>
                <div>
                    <strong style="font-size: 1.1em;">¡Nuevos cambios disponibles!</strong>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em; opacity: 0.9;">
                        Otro usuario actualizó los datos de la federación
                    </p>
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="btn-recargar-ahora" 
                        style="background: #00ff00; color: black; 
                               border: none; padding: 8px 15px; 
                               border-radius: 5px; cursor: pointer;
                               font-weight: bold; font-size: 0.9em;">
                    🔄 Recargar ahora
                </button>
                <button id="btn-cerrar-notificacion" 
                        style="background: transparent; color: white; 
                               border: 1px solid white; padding: 8px 15px; 
                               border-radius: 5px; cursor: pointer;
                               font-size: 0.9em;">
                    ✕ Cerrar
                </button>
            </div>
        `;
        
        document.body.appendChild(notificacion);
        
        // Agregar eventos a los botones
        document.getElementById('btn-recargar-ahora').onclick = function() {
            console.log('🔄 Recargando por notificación...');
            window.location.reload();
        };
        
        document.getElementById('btn-cerrar-notificacion').onclick = function() {
            notificacion.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notificacion.parentElement) {
                    notificacion.remove();
                }
            }, 300);
        };
        
        // Auto-eliminar después de 30 segundos
        setTimeout(() => {
            if (notificacion.parentElement) {
                notificacion.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    if (notificacion.parentElement) {
                        notificacion.remove();
                    }
                }, 300);
            }
        }, 30000);
        
        console.log('✅ Notificación mostrada');
    }

    async guardarEnNube(datosCompletos) {
        if (!this.conectado || !this.db) {
            console.log('⚠️ No conectado, no se guarda en nube');
            return false;
        }
        
        try {
            console.log('☁️ Guardando en la nube...');
            
            const datosParaGuardar = {
                datos: datosCompletos,
                fecha_actualizacion: new Date().toISOString(),
                usuario: this.usuarioId,
                total_estudiantes: Object.values(datosCompletos.cursos || {}).reduce((total, curso) => total + (curso.estudiantes?.length || 0), 0)
            };
            
            console.log('📤 Enviando datos:', {
                usuario: this.usuarioId,
                estudiantes: datosParaGuardar.total_estudiantes,
                aportes: datosCompletos.aportes?.length || 0
            });
            
            // Guardar en Firebase (equivalente a upsert de Supabase)
            await this.db.collection('datosFederacion').doc('configuracion').set(datosParaGuardar);
            
            // Guardar timestamp para evitar procesar nuestro propio cambio
            this.ultimoCambio = new Date();
            
            console.log('✅ Datos guardados en la nube (Firebase)');
            return true;
        } catch (error) {
            console.error('❌ Error guardando en nube:', error);
            return false;
        }
    }

    async cargarDeNube() {
        if (!this.conectado || !this.db) {
            console.log('⚠️ No conectado, no se carga de nube');
            return null;
        }
        
        try {
            console.log('☁️ Cargando desde la nube...');
            
            const docRef = this.db.collection('datosFederacion').doc('configuracion');
            const docSnap = await docRef.get();
            
            if (docSnap.exists) {
                const data = docSnap.data();
                console.log('✅ Datos cargados de la nube');
                console.log('- Usuario:', data.usuario || 'desconocido');
                console.log('- Fecha:', data.fecha_actualizacion || 'desconocida');
                
                // IMPORTANTE: Asegurar que todas las estructuras existan
                if (!data.datos.gastos) data.datos.gastos = [];
                if (!data.datos.movimientosCaja) data.datos.movimientosCaja = [];
                if (!data.datos.casilleros) data.datos.casilleros = {};
                if (!data.datos.sectoresCobro) data.datos.sectoresCobro = [];
                
                return data.datos;
            } else {
                console.log('ℹ️ No hay datos en la nube');
                return null;
            }
        } catch (error) {
            console.error('❌ Error cargando de nube:', error);
            return null;
        }
    }

    getEstado() {
        return {
            conectado: this.conectado,
            usuario: this.usuarioId,
            ultimoCambio: this.ultimoCambio
        };
    }
}

// Función global para recargar
window.recargarConNuevosDatos = function() {
    console.log('🔄 Recargando página...');
    window.location.reload();
};

// Crear instancia global
window.sincronizador = new SincronizadorFederacion();

// Función para depuración
window.verEstadoSincronizacion = function() {
    if (window.sincronizador) {
        const estado = window.sincronizador.getEstado();
        console.log('📊 Estado sincronización:', estado);
        alert(`Estado: ${estado.conectado ? '✅ CONECTADO' : '❌ DESCONECTADO'}\nUsuario: ${estado.usuario}`);
    } else {
        console.log('❌ Sincronizador no disponible');
    }
};
