// database.js - CONEXIÓN A TIDB DATA SERVICE (COMPARTIDO)
class SincronizadorFederacion {
    constructor() {
        this.conectado = false;
        this.usuarioId = null;
        this.ultimoCambio = null;
        this.datosLocales = null;
        
        // TUS DATOS DE DATA SERVICE (cuando los crees)
        this.apiUrl = 'https://your-data-app.tidbcloud.com/api/v1/'; // Reemplazar
        this.apiKey = 'tu-api-key-del-data-app'; // Reemplazar
        this.publicEndpoint = '/endpoint/datos'; // El que creaste
    }

    async conectar() {
        try {
            console.log('🔌 Conectando a TiDB Data Service...');
            
            // ID de usuario
            let userId = localStorage.getItem('federacion_user_id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                localStorage.setItem('federacion_user_id', userId);
            }
            this.usuarioId = userId;
            
            this.conectado = true;
            console.log('✅ Conectado a TiDB Data Service');
            
            // Cargar datos existentes
            await this.cargarDeNube();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error conectando:', error);
            this.conectado = false;
            return false;
        }
    }

    async guardarEnNube(datosCompletos) {
        if (!this.conectado) {
            console.log('⚠️ No conectado, guardando localmente');
            this.guardarLocales(datosCompletos);
            return false;
        }

        try {
            console.log('☁️ Guardando en TiDB Data Service...');
            
            const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const totalEstudiantes = Object.values(datosCompletos.cursos || {}).reduce((total, curso) => total + (curso.estudiantes?.length || 0), 0);
            
            // Preparar datos para enviar
            const datosParaGuardar = {
                datosJSON: JSON.stringify(datosCompletos),
                fecha: fechaActual,
                usuario: this.usuarioId,
                totalEstudiantes: totalEstudiantes
            };
            
            // Enviar a la API
            const response = await fetch(this.apiUrl + this.publicEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(datosParaGuardar)
            });
            
            if (response.ok) {
                console.log('✅ Datos guardados en la nube');
                
                // Guardar respaldo local
                this.guardarLocales(datosCompletos);
                
                // Marcar último cambio
                const timestamp = Date.now().toString();
                localStorage.setItem('federacion_ultimo_cambio', timestamp);
                this.ultimoCambio = timestamp;
                
                return true;
            } else {
                console.error('❌ Error en respuesta:', await response.text());
                this.guardarLocales(datosCompletos);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error guardando:', error);
            this.guardarLocales(datosCompletos);
            return false;
        }
    }

    async cargarDeNube() {
        try {
            console.log('📂 Cargando desde TiDB Data Service...');
            
            // Intentar cargar de la nube
            const response = await fetch(this.apiUrl + this.publicEndpoint, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.rows && data.rows.length > 0) {
                    const row = data.rows[0];
                    console.log('✅ Datos cargados de la nube');
                    
                    // Parsear JSON
                    const datosParseados = JSON.parse(row.DatosJSON);
                    
                    // Guardar localmente
                    this.guardarLocales(datosParseados);
                    
                    return datosParseados;
                }
            }
            
            // Si no hay datos en la nube, cargar local
            const guardado = localStorage.getItem('datosFederacion');
            if (guardado) {
                console.log('📂 Cargando desde almacenamiento local');
                this.datosLocales = JSON.parse(guardado);
                return this.datosLocales;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Error cargando de nube:', error);
            
            // Fallback a local
            const guardado = localStorage.getItem('datosFederacion');
            if (guardado) {
                console.log('📂 Fallback: cargando desde local');
                this.datosLocales = JSON.parse(guardado);
                return this.datosLocales;
            }
            
            return null;
        }
    }

    guardarLocales(datos) {
        localStorage.setItem('datosFederacion', JSON.stringify(datos));
        this.datosLocales = datos;
    }

    getEstado() {
        return {
            conectado: this.conectado,
            usuario: this.usuarioId,
            modo: 'tidb-cloud-compartido',
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
        alert(`Estado: ${estado.conectado ? 'CONECTADO' : 'DESCONECTADO'}\nUsuario: ${estado.usuario}\nModo: ${estado.modo}`);
    } else {
        console.log('❌ Sincronizador no disponible');
    }
};
