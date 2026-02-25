// database.js - SISTEMA DE SINCRONIZACIÓN CON FIREBASE - VERSIÓN MEJORADA
class SincronizadorFederacion {
    constructor() {
        this.db = null;
        this.conectado = false;
        this.usuarioId = null;
        this.ultimoCambio = null;
        this.firebaseInicializado = false;
        this.colecciones = [
            'gastos',
            'eventos',
            'sectoresCobro',
            'cursos',
            'casilleros',
            'movimientosCaja',
            'otrosCobrosSaldos',
            'configuracion'
        ];
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
                userId = 'user_' + Date.now() + '_' + Math.floor(Math.random()  * 1000);
                localStorage.setItem('federacion_user_id', userId);
            }
            this.usuarioId = userId;
            
            this.conectado = true;
            console.log('✅ Conectado a Firebase Firestore');
            
            setTimeout(() => this.escucharCambios(), 3000);
            
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
        
        // Escuchar SOLO configuración (para detectar cambios)
        this.db.collection('datosFederacion').doc('configuracion')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    console.log('📢 Cambio detectado en Firebase:', data);
                    
                    if (data.ultimoUsuario === this.usuarioId) {
                        console.log('🔄 Ignorando cambio propio');
                        return;
                    }
                    
                    const ultimoLocal = localStorage.getItem('federacion_ultimo_cambio');
                    const ultimoFirebase = data.timestamp || 0;
                    
                    if (ultimoLocal && parseInt(ultimoLocal) > ultimoFirebase) {
                        console.log('⚠️ Datos locales más recientes');
                        return;
                    }
                    
                    this.mostrarNotificacionCambio();
                }
            });
    }

    mostrarNotificacionCambio() {
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
            console.log('☁️ Guardando en Firebase (MODO SEPARADO)...');
            
            const timestamp = Date.now();
            const fechaActual = new Date();
            const batch = this.db.batch(); // Usar batch para operación atómica
            
            // ============================================
            // 1. CONFIGURACIÓN (documento principal)
            // ============================================
            const configRef = this.db.collection('datosFederacion').doc('configuracion');
            batch.set(configRef, {
                timestamp: timestamp,
                ultimaActualizacion: fechaActual,
                ultimoUsuario: this.usuarioId,
                version: "2.0"
            }, { merge: true });
            
            // ============================================
            // 2. GASTOS (colección separada)
            // ============================================
            console.log(`📝 Guardando ${datosCompletos.gastos?.length || 0} gastos...`);
            const gastosRef = this.db.collection('datosFederacion').doc('gastos');
            batch.set(gastosRef, {
                items: datosCompletos.gastos || [],
                total: datosCompletos.totalGastos || 0,
                timestamp: timestamp,
                ultimoUsuario: this.usuarioId
            }, { merge: true });
            
            // ============================================
            // 3. EVENTOS (colección separada)
            // ============================================
            console.log(`📝 Guardando ${datosCompletos.eventos?.length || 0} eventos...`);
            const eventosRef = this.db.collection('datosFederacion').doc('eventos');
            batch.set(eventosRef, {
                items: datosCompletos.eventos || [],
                timestamp: timestamp,
                ultimoUsuario: this.usuarioId
            }, { merge: true });
            
            // ============================================
            // 4. SECTORES DE COBRO (colección separada)
            // ============================================
            console.log(`📝 Guardando ${datosCompletos.sectoresCobro?.length || 0} sectores de cobro...`);
            const sectoresRef = this.db.collection('datosFederacion').doc('sectoresCobro');
            batch.set(sectoresRef, {
                items: datosCompletos.sectoresCobro || [],
                total: datosCompletos.totalOtrosCobros || 0,
                timestamp: timestamp,
                ultimoUsuario: this.usuarioId
            }, { merge: true });
            
            // ============================================
            // 5. CURSOS (colección separada)
            // ============================================
            console.log(`📝 Guardando cursos...`);
            const cursosRef = this.db.collection('datosFederacion').doc('cursos');
            batch.set(cursosRef, {
                items: datosCompletos.cursos || {},
                totalAportes: datosCompletos.totalAportesEstudiantes || 0,
                timestamp: timestamp,
                ultimoUsuario: this.usuarioId
            }, { merge: true });
            
            // ============================================
            // 6. CASILLEROS (colección separada)
            // ============================================
            console.log(`📝 Guardando casilleros...`);
            const casillerosRef = this.db.collection('datosFederacion').doc('casilleros');
            batch.set(casillerosRef, {
                items: datosCompletos.casilleros || {},
                gastos: datosCompletos.gastosCasilleros || [],
                timestamp: timestamp,
                ultimoUsuario: this.usuarioId
            }, { merge: true });
            
            // ============================================
            // 7. MOVIMIENTOS DE CAJA
            // ============================================
            console.log(`📝 Guardando movimientos de caja...`);
            const cajaRef = this.db.collection('datosFederacion').doc('movimientosCaja');
            batch.set(cajaRef, {
                items: datosCompletos.movimientosCaja || [],
                totalIngresos: datosCompletos.totalIngresosCaja || 0,
                totalEgresos: datosCompletos.totalEgresosCaja || 0,
                dineroInicial: datosCompletos.dineroInicial || 0,
                dineroFinal: datosCompletos.dineroFinal || 0,
                timestamp: timestamp,
                ultimoUsuario: this.usuarioId
            }, { merge: true });
            
            // ============================================
            // 8. GASTOS DE OTROS COBROS
            // ============================================
            console.log(`📝 Guardando gastos de otros cobros...`);
            const otrosCobrosGastosRef = this.db.collection('datosFederacion').doc('otrosCobrosGastos');
            batch.set(otrosCobrosGastosRef, {
                items: datosCompletos.otrosCobrosSaldos || [],
                totalGastos: datosCompletos.otrosCobrosGastos || 0,
                timestamp: timestamp,
                ultimoUsuario: this.usuarioId
            }, { merge: true });
            
            // EJECUTAR TODAS LAS OPERACIONES
            await batch.commit();
            
            console.log('✅ TODOS LOS DATOS guardados en Firebase (8 documentos separados)');
            
            localStorage.setItem('federacion_ultimo_cambio', timestamp.toString());
            this.ultimoCambio = timestamp;
            
            return true;
            
        } catch (error) {
            console.error('❌ Error guardando en Firebase:', error);
            return false;
        }
    }

    async cargarDeNube(forzarFirebase = false) {
        console.log('📂 Cargando desde Firebase...');
        
        if (!this.conectado || !this.db) {
            console.log('⚠️ No conectado, usando local');
            return this.cargarLocales();
        }

        try {
            // Verificar si hay datos locales
            const datosLocales = this.cargarLocales();
            
            // Si no forzamos Firebase, verificar si los locales son más recientes
            if (!forzarFirebase && datosLocales) {
                const timestampLocal = parseInt(localStorage.getItem('federacion_ultimo_cambio') || '0');
                
                // Obtener timestamp de Firebase
                const configDoc = await this.db.collection('datosFederacion').doc('configuracion').get();
                const timestampFirebase = configDoc.exists ? configDoc.data().timestamp || 0 : 0;
                
                if (timestampLocal > timestampFirebase) {
                    console.log('📥 Usando datos locales (más recientes)');
                    return datosLocales;
                }
            }
            
            console.log('📥 Cargando desde Firebase...');
            
            // ============================================
            // CREAR OBJETO BASE
            // ============================================
            const datosFirebase = {
                gastos: [],
                eventos: [],
                sectoresCobro: [],
                cursos: {},
                casilleros: {},
                movimientosCaja: [],
                otrosCobrosSaldos: [],
                totalGastos: 0,
                totalOtrosCobros: 0,
                totalAportesEstudiantes: 0,
                totalIngresosCaja: 0,
                totalEgresosCaja: 0,
                dineroInicial: 0,
                dineroFinal: 0,
                otrosCobrosGastos: 0,
                gastosCasilleros: []
            };
            
            // Cargar TODAS las colecciones
            const colecciones = [
                'gastos',
                'eventos',
                'sectoresCobro',
                'cursos',
                'casilleros',
                'movimientosCaja',
                'otrosCobrosGastos'
            ];
            
            for (const nombreColeccion of colecciones) {
                try {
                    const docRef = this.db.collection('datosFederacion').doc(nombreColeccion);
                    const docSnap = await docRef.get();
                    
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        console.log(`✅ Cargada colección: ${nombreColeccion}`);
                        
                        switch(nombreColeccion) {
                            case 'gastos':
                                datosFirebase.gastos = data.items || [];
                                datosFirebase.totalGastos = data.total || 0;
                                break;
                            case 'eventos':
                                datosFirebase.eventos = data.items || [];
                                break;
                            case 'sectoresCobro':
                                datosFirebase.sectoresCobro = data.items || [];
                                datosFirebase.totalOtrosCobros = data.total || 0;
                                break;
                            case 'cursos':
                                datosFirebase.cursos = data.items || {};
                                datosFirebase.totalAportesEstudiantes = data.totalAportes || 0;
                                break;
                            case 'casilleros':
                                datosFirebase.casilleros = data.items || {};
                                datosFirebase.gastosCasilleros = data.gastos || [];
                                break;
                            case 'movimientosCaja':
                                datosFirebase.movimientosCaja = data.items || [];
                                datosFirebase.totalIngresosCaja = data.totalIngresos || 0;
                                datosFirebase.totalEgresosCaja = data.totalEgresos || 0;
                                datosFirebase.dineroInicial = data.dineroInicial || 0;
                                datosFirebase.dineroFinal = data.dineroFinal || 0;
                                break;
                            case 'otrosCobrosGastos':
                                datosFirebase.otrosCobrosSaldos = data.items || [];
                                datosFirebase.otrosCobrosGastos = data.totalGastos || 0;
                                break;
                        }
                    }
                } catch (error) {
                    console.error(`Error cargando ${nombreColeccion}:`, error);
                }
            }
            
            console.log('✅ Todos los datos cargados de Firebase');
            console.log(`- Gastos: ${datosFirebase.gastos.length}`);
            console.log(`- Eventos: ${datosFirebase.eventos.length}`);
            console.log(`- Sectores: ${datosFirebase.sectoresCobro.length}`);
            
            // Guardar en localStorage
            this.guardarLocales(datosFirebase);
            
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
            usuario: this.usuarioId,
            modo: 'firestore-multidocumento',
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
    
    if (confirm('¿Cargar TODOS los datos desde Firebase? Se perderán los cambios locales.')) {
        const datosFirebase = await window.sincronizador.cargarDeNube(true);
        if (datosFirebase) {
            // Guardar en datos global
            if (window.datos) {
                window.datos = datosFirebase;
                if (typeof guardarDatos === 'function') guardarDatos();
                if (typeof actualizarTodo === 'function') actualizarTodo();
            }
            alert('✅ Datos cargados desde Firebase');
        }
    }
};

// Función para verificar qué hay en Firebase
window.verificarFirebase = async function() {
    if (!window.sincronizador || !window.sincronizador.db) {
        alert('Sincronizador no disponible');
        return;
    }
    
    try {
        console.log('🔍 VERIFICANDO FIREBASE...');
        
        const colecciones = [
            'gastos',
            'eventos',
            'sectoresCobro',
            'cursos',
            'casilleros',
            'movimientosCaja',
            'otrosCobrosGastos',
            'configuracion'
        ];
        
        let mensaje = '📊 CONTENIDO DE FIREBASE:\n\n';
        
        for (const nombre of colecciones) {
            const docRef = window.sincronizador.db.collection('datosFederacion').doc(nombre);
            const docSnap = await docRef.get();
            
            if (docSnap.exists) {
                const data = docSnap.data();
                if (data.items) {
                    mensaje += `✅ ${nombre}: ${data.items.length} registros\n`;
                } else if (data.items === undefined) {
                    mensaje += `⚠️ ${nombre}: existe pero vacío\n`;
                } else {
                    mensaje += `✅ ${nombre}: datos presentes\n`;
                }
            } else {
                mensaje += `❌ ${nombre}: NO EXISTE\n`;
            }
        }
        
        console.log(mensaje);
        alert(mensaje);
        
    } catch (error) {
        console.error('Error verificando Firebase:', error);
        alert('Error verificando Firebase: ' + error.message);
    }
};

console.log('✅ database.js - MODO MULTIDOCUMENTO ACTIVADO');
