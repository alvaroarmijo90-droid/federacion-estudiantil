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
            
            this.conectado = true;
            console.log('✅ Conectado a Firebase Firestore');
            console.log('👤 Usuario ID:', this.usuarioId);
            
            // Escuchar cambios en tiempo real
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
        
        this.db.collection('datosFederacion').doc('configuracion')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    console.log('📢 Cambio detectado en Firebase');
                    
                    const data = doc.data();
                    
                    // Ignorar cambios propios
                    if (data.ultimoUsuario === this.usuarioId) {
                        console.log('🔄 Ignorando cambio propio');
                        return;
                    }
                    
                    this.mostrarNotificacionCambio();
                    this.cargarDeNube();
                }
            }, (error) => {
                console.error('❌ Error en escucha:', error);
            });
    }

    mostrarNotificacionCambio() {
        if (document.getElementById('notificacion-firebase')) return;
        
        const notificacion = document.createElement('div');
        notificacion.id = 'notificacion-firebase';
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 99999;
            min-width: 300px;
            border-left: 5px solid #00ff00;
        `;
        
        notificacion.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-sync-alt fa-spin" style="color: #00ff00;"></i>
                <div>
                    <strong>¡Nuevos cambios disponibles!</strong>
                    <p style="margin: 5px 0 0 0;">Otro usuario actualizó los datos</p>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button id="btn-recargar-firebase" style="background: #00ff00; color: black; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Recargar</button>
                <button id="btn-cerrar-firebase" style="background: transparent; color: white; border: 1px solid white; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Cerrar</button>
            </div>
        `;
        
        document.body.appendChild(notificacion);
        
        document.getElementById('btn-recargar-firebase').onclick = () => window.location.reload();
        document.getElementById('btn-cerrar-firebase').onclick = () => notificacion.remove();
        
        setTimeout(() => notificacion.remove(), 30000);
    }

    async guardarEnNube(datosCompletos) {
        if (!this.conectado || !this.db) {
            console.log('⚠️ No conectado, guardando localmente');
            this.guardarLocales(datosCompletos);
            return false;
        }

        try {
            console.log('☁️ Guardando en Firebase...');
            
            const totalEstudiantes = Object.values(datosCompletos.cursos || {}).reduce((total, curso) => total + (curso.estudiantes?.length || 0), 0);
            
            await this.db.collection('datosFederacion').doc('configuracion').set({
                datosJSON: JSON.stringify(datosCompletos),
                ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
                ultimoUsuario: this.usuarioId,
                totalEstudiantes: totalEstudiantes
            });
            
            console.log('✅ Datos guardados en Firebase');
            
            // Guardar localmente también
            this.guardarLocales(datosCompletos);
            
            this.ultimoCambio = Date.now();
            
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
                
                if (data.datosJSON) {
                    const datosParseados = JSON.parse(data.datosJSON);
                    console.log('✅ Datos cargados de Firebase');
                    
                    // IMPORTANTE: Asegurar que todas las estructuras existan
                    if (!datosParseados.gastos) datosParseados.gastos = [];
                    if (!datosParseados.movimientosCaja) datosParseados.movimientosCaja = [];
                    if (!datosParseados.casilleros) datosParseados.casilleros = {};
                    if (!datosParseados.cursos) datosParseados.cursos = {};
                    
                    // Guardar localmente
                    this.guardarLocales(datosParseados);
                    
                    return datosParseados;
                }
            }
            
            console.log('ℹ️ No hay datos en Firebase, cargando locales');
            return this.cargarLocales();
            
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
                console.log('📂 Datos cargados desde localStorage');
                return this.datosLocales;
            } catch (e) {
                console.error('Error parseando localStorage:', e);
                return null;
            }
        }
        return null;
    }

    guardarLocales(datos) {
        try {
            localStorage.setItem('datosFederacion', JSON.stringify(datos));
            this.datosLocales = datos;
            console.log('💾 Datos guardados en localStorage');
        } catch (e) {
            console.error('Error guardando en localStorage:', e);
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
