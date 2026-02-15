// Variables globales MEJORADAS
// Variables globales - INICIALMENTE VACÍAS
let datos = {
    totalAportesEstudiantes: 0,
    totalGastos: 0,
    dineroInicial: 0,
    dineroFinal: 0,
    totalIngresosCaja: 0,
    totalEgresosCaja: 0,
    totalOtrosCobros: 0,
    aportes: [],
    gastos: [],
    movimientosCaja: [],
    otrosCobros: [],
    eventos: [],
    casilleros: {},
    sectoresCobro: [], // Nuevo: para otros cobros
    gastosCasilleros: [],
    otrosCobrosIngresos: 0,          // Total recaudado en otros cobros
    otrosCobrosGastos: 0,            // Total gastado de otros cobros
    montoInicialCasilleros: 0,
    otrosCobrosSaldos: [],          // Gastos individuales
    otrosCobrosHistorial: [],        // Historial completo // Nuevo: gastos de fondos de casilleros
    cursos: {
        '1. CIENCIAS NATURALES: BIOLOGÍA - GEOGRAFÍA': { estudiantes: [] },
        '1. CIENCIAS SOCIALES': { estudiantes: [] },
        '2. INICIAL': { estudiantes: [] },
        '2. PRIMARIA': { estudiantes: [] },
        '2. CIENCIAS SOCIALES': { estudiantes: [] },
        '3. INICIAL': { estudiantes: [] },
        '3. PRIMARIA': { estudiantes: [] },
        '3. INGLES': { estudiantes: [] },
        '4. INICIAL': { estudiantes: [] },
        '4. PRIMARIA': { estudiantes: [] },
        '5. INICIAL': { estudiantes: [] },
        '5. PRIMARIA': { estudiantes: [] }
    }
};


function crearBackupAutomatico() {
    try {
        const backupKey = 'backup_' + new Date().toISOString().split('T')[0];
        const backup = {
            datos: JSON.parse(JSON.stringify(datos)),
            fecha: new Date().toISOString(),
            version: "1.0"
        };
        
        localStorage.setItem(backupKey, JSON.stringify(backup));
        console.log("💾 Backup creado:", backupKey);
        
        // Mantener solo últimos 7 backups
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('backup_')) {
                backups.push(key);
            }
        }
        
        if (backups.length > 7) {
            backups.sort();
            const eliminar = backups.slice(0, backups.length - 7);
            eliminar.forEach(key => localStorage.removeItem(key));
        }
        
    } catch (error) {
        console.error("Error creando backup:", error);
    }
}


// Variable para sincronización
let sincronizacionActiva = false;




// Configuración de montos por curso PARA 2026
const montosPorCurso2026 = {
    '0. CURSO ESPECIAL 1': 0,
    '0. CURSO ESPECIAL 2': 0,
    '0. CURSO ESPECIAL 3': 0,
    '1. CIENCIAS NATURALES: BIOLOGÍA - GEOGRAFÍA': 200,
    '1. CIENCIAS SOCIALES': 200,
    '2. INICIAL': 70,
    '2. PRIMARIA': 70,
    '2. CIENCIAS SOCIALES': 70,
    '3. INICIAL': 60,
    '3. PRIMARIA': 60,
    '3. INGLES': 60,
    '4. INICIAL': 50,
    '4. PRIMARIA': 50,
    '5. INICIAL': 50,
    '5. PRIMARIA': 50
};

// Configuración de montos por curso PARA 2027
const montosPorCurso2027 = {
    '0. CURSO ESPECIAL 1': 200,
    '0. CURSO ESPECIAL 2': 200,
    '0. CURSO ESPECIAL 3': 200,
    '1. CIENCIAS NATURALES: BIOLOGÍA - GEOGRAFÍA': 70,
    '1. CIENCIAS SOCIALES': 70,
    '2. INICIAL': 60,
    '2. PRIMARIA': 60,
    '2. CIENCIAS SOCIALES': 60,
    '3. INICIAL': 50,
    '3. PRIMARIA': 50,
    '3. INGLES': 50,
    '4. INICIAL': 50,
    '4. PRIMARIA': 50,
    '5. INICIAL': 0,  // ← CERO porque no pagan en 2027
    '5. PRIMARIA': 0   // ← CERO porque no pagan en 2027
};

// Orden de cursos para mostrar (1-5)
const ordenCursos = [
    '0. CURSO ESPECIAL 1',
    '0. CURSO ESPECIAL 2',
    '0. CURSO ESPECIAL 3',
    '1. CIENCIAS NATURALES: BIOLOGÍA - GEOGRAFÍA',
    '1. CIENCIAS SOCIALES',
    '2. INICIAL',
    '2. PRIMARIA',
    '2. CIENCIAS SOCIALES',
    '3. INICIAL',
    '3. PRIMARIA',
    '3. INGLES',
    '4. INICIAL',
    '4. PRIMARIA',
    '5. INICIAL',
    '5. PRIMARIA'
];



// Función para obtener el monto requerido para un curso según el año
function obtenerMontoCurso(curso, anio) {
    if (anio === '2026') {
        // Si no encuentra el curso, devuelve 0 (no 50)
        return montosPorCurso2026[curso] !== undefined ? montosPorCurso2026[curso] : 0;
    } else if (anio === '2027') {
        // Si no encuentra el curso, devuelve 0 (no 50)
        return montosPorCurso2027[curso] !== undefined ? montosPorCurso2027[curso] : 0;
    }
    return 0; // ← Cambia este 50 por 0
}

// Variables para control de acceso
let isAdmin = false;
let isViewer = false;
const ADMIN_PASSWORD = "admin123";

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Sistema de Gestión Financiera - Inicializando...');
    
 // INICIAR SISTEMA DE SINCRONIZACIÓN
// INICIAR SISTEMA DE SINCRONIZACIÓN
if (window.sincronizador) {
    // ✅ CORREGIDO: Ahora pasa CONFIG_FIREBASE como parámetro
    sincronizacionActiva = await window.sincronizador.conectar(CONFIG_FIREBASE);
    if (sincronizacionActiva) {
        console.log('✅ Modo multiusuario ACTIVADO');
        mostrarMensaje('Conectado - Los cambios se verán en todos los dispositivos', 'success');
    } else {
        console.log('⚠️ Usando modo local');
        mostrarMensaje('Modo local activado - Sin conexión a internet', 'info');
    }
}
    
    // Configurar login
    const loginForm = document.getElementById('loginForm');
    const viewerAccess = document.getElementById('viewerAccess');
    
    if (loginForm) {
        loginForm.addEventListener('submit', verificarLogin);
    }
    
    if (viewerAccess) {
        viewerAccess.addEventListener('click', accederComoObservador);
    }
    
    cargarImagenes();
    cargarDatos();
    inicializarNavegacion();
    inicializarCasilleros();
    // Inicializar estudiantes si no existen
    inicializarEstudiantes();
    inicializarCursosEspeciales(); // ← AGREGAR ESTA LÍNEA

    // Configurar fecha actual en los formularios
    const hoy = new Date().toISOString().split('T')[0];
    ['fechaGasto', 'fechaCaja', 'fechaPago', 'fechaGastoCasillero', 'fechaOtroCobro', 'fechaEvento', 'fechaLimiteSector'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = hoy;
    });
    
    
    
    // Event listeners para formularios
    const cursoOtroCobro = document.getElementById('cursoOtroCobro');
if (cursoOtroCobro) {
    cursoOtroCobro.addEventListener('change', function() {
        cargarEstudiantesParaOtrosCobros();
        
        // Si hay un sector seleccionado, mostrar el marcado
        const sectorId = document.getElementById('sectorCobro').value;
        if (sectorId && this.value) {
            setTimeout(() => cargarEstudiantesParaMarcarPagos(), 100);
        }
    });
}

// Event listeners para filtros
const filtroEstudiante = document.getElementById('filtroEstudiante');
if (filtroEstudiante) {
    filtroEstudiante.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') filtrarEstudiantesSeguimiento();
    });
}
    
    // Event listener para sector de cobro
    const sectorCobroSelect = document.getElementById('sectorCobro');
    if (sectorCobroSelect) {
        sectorCobroSelect.addEventListener('change', actualizarMontoSector);
    }
    
    console.log('Inicialización completada');
});

// Cargar imágenes
function cargarImagenes() {
    const logoImg = document.getElementById('logo-img');
    const backgroundImg = document.getElementById('background-img');
    const cursoImg = document.getElementById('curso-imagen-default');
    const logoDisplay = document.getElementById('logo-display');
    const backgroundElement = document.querySelector('.background-image');
    const cursoImagen = document.getElementById('curso-imagen');
    
    if (logoImg && logoDisplay) {
        logoDisplay.src = logoImg.src;
    }
    
    if (backgroundImg && backgroundElement) {
        backgroundElement.style.backgroundImage = `url('${backgroundImg.src}')`;
    }
    
    if (cursoImg && cursoImagen) {
        cursoImagen.src = cursoImg.src;
    }
}

// Sistema de login
function verificarLogin(e) {
    e.preventDefault();
    const password = document.getElementById('loginPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        isViewer = false;
        iniciarSesion();
    } else {
        mostrarMensaje('Contraseña incorrecta', 'error');
    }
}

function accederComoObservador() {
    isAdmin = false;
    isViewer = true;
    iniciarSesion();
}

function iniciarSesion() {
    console.log('Iniciando sesión...');
    
    // Ocultar login overlay
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) loginOverlay.style.display = 'none';
    
    // Mostrar navbar
    const navbar = document.querySelector('nav');
    if (navbar) navbar.style.display = 'flex';
    
    // Mostrar contenido principal
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.style.display = 'block';

    // Event listener para gastos de otros cobros
const formGastoOtroCobro = document.getElementById('formGastoOtroCobro');
if (formGastoOtroCobro) {
    formGastoOtroCobro.addEventListener('submit', registrarGastoOtroCobro);
}
    
    // Actualizar interfaz según tipo de usuario
    actualizarInterfazPorUsuario();
    // Actualizar resumen de otros cobros
actualizarResumenOtrosCobros();
actualizarResumenCasilleros();

    // Inicializar datos
    cargarDatos();
    inicializarGraficos();
    actualizarDashboard();
    actualizarResumenAportesCursos();
    actualizarReporteMensual();
    actualizarDetalleCajaFuerte();
    actualizarSeguimiento();
    actualizarEventos();
    actualizarSectoresCobro();
    actualizarTablaGastosCasilleros();
    // Agregar botones de administración de cursos
agregarBotonesAdministracionCursos();
    
    // Event listeners para formularios
    const formGasto = document.getElementById('formGasto');
    const formMovimientoCaja = document.getElementById('formMovimientoCaja');
    const formOtroCobro = document.getElementById('formOtroCobro');
    const formEvento = document.getElementById('formEvento');
    const formNuevoSector = document.getElementById('formNuevoSector');
    const formGastoCasillero = document.getElementById('formGastoCasillero');
    
    if (formGasto) formGasto.addEventListener('submit', registrarGasto);
    if (formMovimientoCaja) formMovimientoCaja.addEventListener('submit', registrarMovimientoCaja);
    if (formOtroCobro) formOtroCobro.addEventListener('submit', registrarOtroCobro);
    if (formEvento) formEvento.addEventListener('submit', registrarEvento);
    if (formNuevoSector) formNuevoSector.addEventListener('submit', crearNuevoSector);
    if (formGastoCasillero) formGastoCasillero.addEventListener('submit', registrarGastoCasillero);
    
    // Event listeners para filtros
    const filtroAnio = document.getElementById('filtroAnio');
    const filtroMes = document.getElementById('filtroMes');
    
    if (filtroAnio) filtroAnio.addEventListener('change', actualizarReportes);
    if (filtroMes) filtroMes.addEventListener('change', actualizarReportes);
    
    // Mostrar mensaje de bienvenida
    if (isAdmin) {
        mostrarMensaje('Bienvenido Administrador', 'success');
        const userTypeBadge = document.getElementById('userTypeBadge');
        if (userTypeBadge) userTypeBadge.innerHTML = '<span class="badge bg-danger">Administrador</span>';
    } else {
        mostrarMensaje('Bienvenido Observador', 'info');
        const userTypeBadge = document.getElementById('userTypeBadge');
        if (userTypeBadge) userTypeBadge.innerHTML = '<span class="badge bg-info">Observador</span>';
    }
}

function cerrarSesion() {
    if (confirm('¿Está seguro de cerrar sesión?')) {
        isAdmin = false;
        isViewer = false;
        
        const loginOverlay = document.getElementById('loginOverlay');
        const navbar = document.querySelector('nav');
        const mainContent = document.querySelector('.main-content');
        const loginPassword = document.getElementById('loginPassword');
        
        if (loginOverlay) loginOverlay.style.display = 'flex';
        if (navbar) navbar.style.display = 'none';
        if (mainContent) mainContent.style.display = 'none';
        if (loginPassword) loginPassword.value = '';
        
        mostrarMensaje('Sesión cerrada', 'info');
    }
}

function actualizarInterfazPorUsuario() {
    const elementosEditables = document.querySelectorAll('#formGasto, #formMovimientoCaja, #formOtroCobro, #formEvento, #formNuevoSector, #formGastoCasillero, #guardarPagosBtn, #agregarEstudianteBtn, #eliminarEstudianteBtn, #resetButton, .btn-editar, .btn-pago');
    
    if (isAdmin) {
        elementosEditables.forEach(el => {
            if (el.tagName === 'BUTTON') {
                el.disabled = false;
                el.style.opacity = '1';
                el.style.cursor = 'pointer';
            } else if (el.tagName === 'FORM') {
                const inputs = el.querySelectorAll('input, select, textarea, button');
                inputs.forEach(input => {
                    input.disabled = false;
                    input.style.opacity = '1';
                    input.style.cursor = 'auto';
                });
            }
        });
    } else {
        elementosEditables.forEach(el => {
            if (el.tagName === 'BUTTON') {
                el.disabled = true;
                el.style.opacity = '0.5';
                el.style.cursor = 'not-allowed';
            } else if (el.tagName === 'FORM') {
                const inputs = el.querySelectorAll('input, select, textarea, button[type="submit"]');
                inputs.forEach(input => {
                    input.disabled = true;
                    input.style.opacity = '0.5';
                    input.style.cursor = 'not-allowed';
                });
            }
        });
    }
}

// Inicializar sistema de pestañas
function inicializarNavegacion() {
    const navLinks = document.querySelectorAll('.nav-link[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabContents.forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    
    const dashboardTab = document.getElementById('dashboard');
    if (dashboardTab) {
        dashboardTab.style.display = 'block';
        dashboardTab.classList.add('active');
    }
    
    navLinks.forEach(link => link.classList.remove('active'));
    if (navLinks.length > 0) navLinks[0].classList.add('active');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const tabId = this.getAttribute('data-tab');
            
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(tab => {
                tab.style.display = 'none';
                tab.classList.remove('active');
            });
            
            const tabToShow = document.getElementById(tabId);
            if (tabToShow) {
                tabToShow.style.display = 'block';
                tabToShow.classList.add('active');
                
                switch(tabId) {
                    case 'dashboard': actualizarDashboard(); break;
                    case 'caja': actualizarTablaMovimientosCaja(); break;
                    case 'gastos': actualizarTablaGastos(); break;
                    case 'cursos': break; // Se carga al seleccionar curso
                    case 'reportes': actualizarReportes(); break;
                    case 'seguimiento': actualizarSeguimiento(); break;
                    case 'casilleros': actualizarVistaCasilleros(); break;
                    case 'otros-cobros': actualizarSectoresCobro(); break;
                    case 'eventos': actualizarEventos(); break;
                }
            }
        });
    });
}

// Cargar datos desde localStorage
async function cargarDatos() {
    console.log('📥 Cargando datos...');
    
    let datosCargados = null;
    
    // 1. Intentar cargar de la nube si hay conexión
    if (window.sincronizador && sincronizacionActiva) {
        console.log('🔍 Buscando datos en la nube...');
        datosCargados = await window.sincronizador.cargarDeNube();
        if (datosCargados) {
            console.log('✅ Datos cargados desde la nube');
        }
    }
    
    // 2. Si no hay datos de la nube, usar locales
    if (!datosCargados) {
        console.log('🔍 Buscando datos locales...');
        const datosGuardados = localStorage.getItem('datosFederacion');
        if (datosGuardados) {
            try {
                datosCargados = JSON.parse(datosGuardados);
                console.log('✅ Datos cargados desde localStorage');
            } catch (e) {
                console.error('❌ Error cargando datos locales:', e);
            }
        }
    }
    
    // 3. Si NO HAY DATOS EN ABSOLUTO, usar estructura por defecto
    if (!datosCargados) {
        console.log('⚠️ No hay datos, usando estructura por defecto');
        datosCargados = datos;
    }
    
    // 4. ASIGNAR LOS DATOS CARGADOS A LA VARIABLE GLOBAL
    datos = datosCargados;
    
    // 5. Asegurar que todos los cursos tengan la estructura correcta
    if (!datos.cursos) {
        datos.cursos = {};
        ordenCursos.forEach(curso => {
            datos.cursos[curso] = { estudiantes: [] };
        });
    }
    
    // 6. Asegurar que cada curso tenga estudiantes
    for (const cursoNombre of ordenCursos) {
        if (!datos.cursos[cursoNombre]) {
            datos.cursos[cursoNombre] = { estudiantes: [] };
        }
        if (!datos.cursos[cursoNombre].estudiantes) {
            datos.cursos[cursoNombre].estudiantes = [];
        }
    }
    
    // 7. Asegurar que casilleros exista
    if (!datos.casilleros) {
        datos.casilleros = {};
    }
    
    // 8. Asegurar que sectoresCobro exista
    if (!datos.sectoresCobro) {
        datos.sectoresCobro = [];
    }
    
    // 9. Asegurar que gastosCasilleros exista
    if (!datos.gastosCasilleros) {
        console.log("🔧 Creando gastosCasilleros porque no existe");
        datos.gastosCasilleros = [];
    }
    
    // 10. Inicializar estudiantes si no existen
    inicializarEstudiantes();
    
    // 11. Inicializar casilleros si no existen
    if (Object.keys(datos.casilleros).length === 0) {
        inicializarCasilleros();
    }
    
    console.log('📊 Datos cargados correctamente');
    console.log('- Total estudiantes:', Object.values(datos.cursos || {}).reduce((total, curso) => total + (curso.estudiantes?.length || 0), 0));
    console.log('- Total sectores cobro:', datos.sectoresCobro?.length || 0);
    
    // 12. Actualizar toda la interfaz
    actualizarDashboard();
    actualizarTablaGastos();
    actualizarTablaMovimientosCaja();
    actualizarUltimosRegistros();
    actualizarTotalOtrosCobros();
    actualizarDetalleCajaFuerte();
    actualizarSeguimiento();
    actualizarVistaCasilleros();
    actualizarEventos();
    actualizarSectoresCobro();
    actualizarTablaGastosCasilleros();
    actualizarResumenOtrosCobros();
    actualizarResumenCasilleros();
    actualizarResumenCursosSeguimiento();
    
const hoy = new Date().toISOString().split('T')[0];
const fechaGastoOtroCobro = document.getElementById('fechaGastoOtroCobro');
if (fechaGastoOtroCobro) fechaGastoOtroCobro.value = hoy;


    return datos;
}
// Guardar datos en localStorage
function guardarDatos() {
    // 1. Guardar local como siempre
    localStorage.setItem('datosFederacion', JSON.stringify(datos));
    
    // 2. Si hay conexión, guardar en la nube también
    if (window.sincronizador && sincronizacionActiva) {
        window.sincronizador.guardarEnNube(datos);
    }
    
    console.log('💾 Datos guardados' + (sincronizacionActiva ? ' y sincronizados' : ''));
}

// Inicializar estudiantes
function inicializarEstudiantes() {
    for (const cursoNombre of ordenCursos) {
        const datosCurso = datos.cursos[cursoNombre];
        if (!datosCurso.estudiantes || datosCurso.estudiantes.length === 0) {
            datosCurso.estudiantes = [];
            for (let i = 1; i <= 45; i++) {
                datosCurso.estudiantes.push({
                    nombre: `Estudiante ${i}`,
                    pagos: {
                        2026: { monto: 0, fecha: '', pagado: false },
                        2027: { monto: 0, fecha: '', pagado: false }
                    }
                });
            }
        }
    }
    guardarDatos();
}

// INICIALIZAR CASILLEROS MEJORADO
function inicializarCasilleros() {
    if (!datos.casilleros || Object.keys(datos.casilleros).length === 0) {
        datos.casilleros = {};
        for (let i = 1; i <= 36; i++) {
            datos.casilleros[i] = {
                numero: i,
                estudiante: '',
                montoMensual: 10.00,
                mesesPagados2026: [],
                mesesPagados2027: [],
                historialPagos: [], // Nuevo: historial detallado
                fechaAsignacion: '',
                totalPagado: 0,
                estado: 'libre'
            };
        }
    }
    
    const selectCasilleros = document.getElementById('numeroCasillero');
    if (selectCasilleros) {
        selectCasilleros.innerHTML = '<option value="">Seleccione casillero</option>';
        for (let i = 1; i <= 36; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Casillero ${i}`;
            selectCasilleros.appendChild(option);
        }
    }
    
    // Inicializar calendarios de meses COMPACTOS
    inicializarCalendarioMesesCompacto('calendario2026', 2026);
    inicializarCalendarioMesesCompacto('calendario2027', 2027);
    
    actualizarVistaCasilleros();
}


function inicializarCalendarioMesesCompacto(containerId, anio) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const meses = [
        'E', 'F', 'M', 'A', 'M', 'J',
        'J', 'A', 'S', 'O', 'N', 'D'
    ];
    
    meses.forEach((mes, index) => {
        const mesDiv = document.createElement('div');
        mesDiv.className = 'mes-cuadrito mes-no-pagado';
        mesDiv.title = `${obtenerNombreMesCompleto(index + 1)} ${anio}`;
        mesDiv.dataset.mes = index + 1;
        mesDiv.dataset.anio = anio;
        
        mesDiv.innerHTML = `<small>${mes}</small>`;
        
        mesDiv.onclick = function() {
            if (!isAdmin) return;
            this.classList.toggle('mes-pagado');
            this.classList.toggle('mes-no-pagado');
        };
        
        container.appendChild(mesDiv);
    });
}

// FUNCIÓN AUXILIAR PARA NOMBRE COMPLETO DEL MES
function obtenerNombreMesCompleto(numero) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[numero - 1] || 'Mes ' + numero;
}

// INICIALIZAR CALENDARIO DE MESES
function inicializarCalendarioMeses(containerId, anio) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const meses = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    meses.forEach((mes, index) => {
        const mesDiv = document.createElement('div');
        mesDiv.className = 'mes-calendario mes-no-pagado';
        mesDiv.textContent = mes;
        mesDiv.dataset.mes = index + 1;
        mesDiv.dataset.anio = anio;
        
        mesDiv.onclick = function() {
            this.classList.toggle('mes-pagado');
            this.classList.toggle('mes-no-pagado');
        };
        
        container.appendChild(mesDiv);
    });
}

// CARGAR DATOS DE CASILLERO
function cargarDatosCasillero() {
    const numero = parseInt(document.getElementById('numeroCasillero').value);
    if (!numero) return;
    
    const casillero = datos.casilleros[numero] || {
        numero: numero,
        estudiante: '',
        montoMensual: 10.00,
        mesesPagados2026: [],
        mesesPagados2027: [],
        historial: []
    };
    
    document.getElementById('estudianteCasillero').value = casillero.estudiante || '';
    document.getElementById('montoMensualCasillero').value = casillero.montoMensual || 10.00;
    
    // Marcar meses pagados 2026
    const meses2026 = document.querySelectorAll('#calendario2026 .mes-calendario');
    meses2026.forEach(mesDiv => {
        const mesNum = parseInt(mesDiv.dataset.mes);
        const pagado = casillero.mesesPagados2026.includes(mesNum);
        
        if (pagado) {
            mesDiv.classList.add('mes-pagado');
            mesDiv.classList.remove('mes-no-pagado');
        } else {
            mesDiv.classList.add('mes-no-pagado');
            mesDiv.classList.remove('mes-pagado');
        }
    });
    
    // Marcar meses pagados 2027
    const meses2027 = document.querySelectorAll('#calendario2027 .mes-calendario');
    meses2027.forEach(mesDiv => {
        const mesNum = parseInt(mesDiv.dataset.mes);
        const pagado = casillero.mesesPagados2027.includes(mesNum);
        
        if (pagado) {
            mesDiv.classList.add('mes-pagado');
            mesDiv.classList.remove('mes-no-pagado');
        } else {
            mesDiv.classList.add('mes-no-pagado');
            mesDiv.classList.remove('mes-pagado');
        }
    });
}

// GUARDAR CASILLERO
function guardarCasillero() {
    if (!isAdmin) return;
    
    const numero = parseInt(document.getElementById('numeroCasillero').value);
    const estudiante = document.getElementById('estudianteCasillero').value;
    const montoMensual = parseFloat(document.getElementById('montoMensualCasillero').value) || 10.00;
    
    if (!numero) {
        mostrarMensaje('Seleccione un casillero', 'error');
        return;
    }
    
    if (!estudiante.trim()) {
        mostrarMensaje('Ingrese el nombre del estudiante', 'error');
        return;
    }
    
    // Obtener meses pagados 2026
    const mesesPagados2026 = [];
    const meses2026 = document.querySelectorAll('#calendario2026 .mes-cuadrito.mes-pagado');
    meses2026.forEach(mesDiv => {
        mesesPagados2026.push(parseInt(mesDiv.dataset.mes));
    });
    
    // Obtener meses pagados 2027
    const mesesPagados2027 = [];
    const meses2027 = document.querySelectorAll('#calendario2027 .mes-cuadrito.mes-pagado');
    meses2027.forEach(mesDiv => {
        mesesPagados2027.push(parseInt(mesDiv.dataset.mes));
    });
    
    // Calcular total pagado
    const totalPagado = (mesesPagados2026.length + mesesPagados2027.length) * montoMensual;
    
    // Crear/actualizar historial de pagos
    const hoy = new Date().toISOString().split('T')[0];
    let historialPagos = [];
    
    // Si ya existe el casillero, mantener su historial anterior
    if (datos.casilleros[numero] && datos.casilleros[numero].historialPagos) {
        historialPagos = datos.casilleros[numero].historialPagos;
    }
    
    // Agregar nuevos pagos al historial
    const fechaActual = new Date();
    const fechaActualStr = fechaActual.toISOString().split('T')[0];
    
    // Agregar pagos 2026 al historial
    mesesPagados2026.forEach(mes => {
        const pagoExistente = historialPagos.find(p => 
            p.anio === 2026 && p.mes === mes
        );
        
        if (!pagoExistente) {
            historialPagos.push({
                fecha: fechaActualStr,
                anio: 2026,
                mes: mes,
                nombreMes: obtenerNombreMesCompleto(mes),
                monto: montoMensual,
                estudiante: estudiante,
                tipo: 'pago_mensual',
                timestamp: Date.now()
            });
        }
    });
    
    // Agregar pagos 2027 al historial
    mesesPagados2027.forEach(mes => {
        const pagoExistente = historialPagos.find(p => 
            p.anio === 2027 && p.mes === mes
        );
        
        if (!pagoExistente) {
            historialPagos.push({
                fecha: fechaActualStr,
                anio: 2027,
                mes: mes,
                nombreMes: obtenerNombreMesCompleto(mes),
                monto: montoMensual,
                estudiante: estudiante,
                tipo: 'pago_mensual',
                timestamp: Date.now()
            });
        }
    });
    
    // Si es nuevo casillero, agregar registro de asignación
    if (!datos.casilleros[numero] || !datos.casilleros[numero].estudiante) {
        historialPagos.push({
            fecha: fechaActualStr,
            anio: 2026,
            mes: 0,
            nombreMes: 'Asignación',
            monto: 0,
            estudiante: estudiante,
            tipo: 'asignacion',
            descripcion: `Casillero ${numero} asignado a ${estudiante}`,
            timestamp: Date.now()
        });
    }
    
    // Ordenar historial por fecha (más reciente primero)
    historialPagos.sort((a, b) => b.timestamp - a.timestamp);
    
    // Guardar casillero
    datos.casilleros[numero] = {
        numero: numero,
        estudiante: estudiante,
        montoMensual: montoMensual,
        mesesPagados2026: mesesPagados2026,
        mesesPagados2027: mesesPagados2027,
        historialPagos: historialPagos,
        totalPagado: totalPagado,
        fechaAsignacion: datos.casilleros[numero] && datos.casilleros[numero].fechaAsignacion ? 
                        datos.casilleros[numero].fechaAsignacion : fechaActualStr,
        estado: estudiante.trim() ? 'ocupado' : 'libre',
        ultimaActualizacion: fechaActualStr
    };
    
    guardarDatos();
    actualizarVistaCasilleros();
    actualizarDetalleCajaFuerte();
    
    mostrarMensaje('Casillero guardado exitosamente', 'success');
}


// ACTUALIZAR VISTA DE CASILLEROS MEJORADA
// ACTUALIZAR VISTA DE CASILLEROS (VISTA ORIGINAL - calendario solo en modal)
function actualizarVistaCasilleros() {
    const sectorA = document.getElementById('sectorA');
    const sectorB = document.getElementById('sectorB');
    
    if (!sectorA || !sectorB) return;
    
    sectorA.innerHTML = '';
    sectorB.innerHTML = '';
    
    let totalSectorA = 0;
    let totalSectorB = 0;
    let totalGeneral = 0;
    
    for (let i = 1; i <= 36; i++) {
        const casillero = datos.casilleros[i] || {
            numero: i,
            estudiante: '',
            montoMensual: 10.00,
            mesesPagados2026: [],
            mesesPagados2027: [],
            historial: [],
            totalPagado: 0
        };
        
        // Calcular total pagado si no existe
        if (!casillero.totalPagado) {
            casillero.totalPagado = (casillero.mesesPagados2026.length + casillero.mesesPagados2027.length) * (casillero.montoMensual || 10.00);
        }
        
        const tieneEstudiante = casillero.estudiante && casillero.estudiante.trim() !== '';
        const estadoClase = tieneEstudiante ? 'pagado' : 'libre';
        const estadoTexto = tieneEstudiante ? 'OCUPADO' : 'LIBRE';
        
        // Calcular meses pagados para mostrar resumen
        const totalMesesPagados = casillero.mesesPagados2026.length + casillero.mesesPagados2027.length;
        let resumenMeses = '';
        
        if (tieneEstudiante && totalMesesPagados > 0) {
            resumenMeses = `<div class="mt-1"><small>${totalMesesPagados} mes(es) pagado(s)</small></div>`;
        }
        
        const casilleroDiv = document.createElement('div');
        casilleroDiv.className = `col-4 col-md-2`;
        
        casilleroDiv.innerHTML = `
            <div class="casillero ${estadoClase}" onclick="verHistorialCasillero(${i})" style="cursor: pointer;">
                <div class="numero">${i}</div>
                <div class="estudiante-casillero">${casillero.estudiante || 'Sin asignar'}</div>
                ${resumenMeses}
                <div class="estado">${estadoTexto}</div>
                <div class="mt-1"><small>Bs ${casillero.totalPagado.toFixed(2)}</small></div>
                <button class="btn-historial mt-1" onclick="event.stopPropagation(); verHistorialCasillero(${i})">
                    <i class="fas fa-history"></i>
                </button>
            </div>
        `;
        
        if (i <= 18) {
            sectorA.appendChild(casilleroDiv);
            totalSectorA += casillero.totalPagado || 0;
        } else {
            sectorB.appendChild(casilleroDiv);
            totalSectorB += casillero.totalPagado || 0;
        }
        
        totalGeneral += casillero.totalPagado || 0;
    }
    
    // CALCULAR GASTOS Y RESTARLOS AL TOTAL GENERAL
    let totalGastos = 0;
    if (datos.gastosCasilleros && Array.isArray(datos.gastosCasilleros)) {
        totalGastos = datos.gastosCasilleros.reduce((sum, gasto) => sum + (gasto.monto || 0), 0);
    }
    
    // Calcular el balance neto (recaudación - gastos)
    const balanceNeto = totalGeneral - totalGastos;
    const montoVisualGuardado = localStorage.getItem('montoGeneralCasillerosVisual');
    const montoParaMostrar = montoVisualGuardado ? parseFloat(montoVisualGuardado) : balanceNeto;
    
    // Actualizar los elementos en el HTML
    if (document.getElementById('totalPagadoSectorA')) {
        document.getElementById('totalPagadoSectorA').textContent = `Bs ${totalSectorA.toFixed(2)}`;
    }
    if (document.getElementById('totalPagadoSectorB')) {
        document.getElementById('totalPagadoSectorB').textContent = `Bs ${totalSectorB.toFixed(2)}`;
    }
    
    // ACTUALIZAR TOTAL GENERAL RESTANDO LOS GASTOS
    // ACTUALIZAR TOTAL GENERAL RESTANDO LOS GASTOS
if (document.getElementById('totalGeneralCasilleros')) {
    const elemento = document.getElementById('totalGeneralCasilleros');
    
    // Cargar monto visual guardado si existe (solo para visualización)
    const montoVisualGuardado = localStorage.getItem('montoGeneralCasillerosVisual');
    const montoParaMostrar = montoVisualGuardado ? parseFloat(montoVisualGuardado) : balanceNeto;
    
    // Si es admin, mostrar con botón de edición
    if (isAdmin) {
        elemento.innerHTML = `
            <span class="contador-cobros">Bs ${montoParaMostrar.toFixed(2)}</span>
            <button class="btn btn-sm btn-outline-warning btn-editar-total ms-2" 
                    onclick="editarMontoGeneralCasilleros()" 
                    title="Editar monto general"
                    style="padding: 5px 8px; border-radius: 50%;">
                <i class="fas fa-pencil-alt"></i>
            </button>
        `;
    } else {
        // Para observadores, solo mostrar el texto
        elemento.textContent = `Bs ${montoParaMostrar.toFixed(2)}`;
    }
    
    // Cambiar color según si es positivo o negativo
    if (montoParaMostrar >= 0) {
        elemento.style.color = '#28a745';
        elemento.classList.add('text-success');
    } else {
        elemento.style.color = '#dc3545';
        elemento.classList.add('text-danger');
    }
}
}
// VER HISTORIAL DE CASILLERO
/// VER HISTORIAL DE CASILLERO - SIMPLIFICADA Y FUNCIONAL
// FUNCIÓN MEJORADA PARA VER HISTORIAL DE CASILLERO
// VER HISTORIAL DE CASILLERO - COMPLETA CON CONTROLES DE PAGO
// VER HISTORIAL DE CASILLERO - COMPLETA CON CONTROLES DE PAGO

// FUNCIÓN MEJORADA PARA EDITAR MONTO GENERAL DE CASILLEROS
function editarMontoGeneralCasilleros() {
    if (!isAdmin) {
        mostrarMensaje('Solo el administrador puede editar montos', 'error');
        return;
    }
    
    // Obtener el monto actual del texto (quitando "Bs ")
    const elementoTotal = document.getElementById('totalGeneralCasilleros');
    let montoActualTexto = elementoTotal.textContent;
    
    // Si el elemento tiene hijos (como el span y el botón), tomar solo el texto del primer hijo
    if (elementoTotal.firstChild && elementoTotal.firstChild.nodeType === 3) {
        montoActualTexto = elementoTotal.firstChild.textContent;
    }
    
    const montoActual = parseFloat(montoActualTexto.replace('Bs ', '').replace(',', '')) || 0;
    
    // Crear un modal mejorado para la edición
    const modalHTML = `
        <div class="modal fade" id="modalEditarMontoGeneral" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-edit"></i> Editar Monto General de Casilleros</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Este monto es solo informativo. Para cambiar montos reales:</p>
                        <ul class="mb-3">
                            <li><strong>Monto predeterminado:</strong> Cambia el valor base para nuevos casilleros</li>
                            <li><strong>Monto por casillero:</strong> Edita cada casillero individualmente</li>
                        </ul>
                        
                        <div class="mb-3">
                            <label class="form-label">Monto general informativo:</label>
                            <input type="number" id="nuevoMontoGeneral" class="form-control" 
                                   value="${montoActual.toFixed(2)}" step="0.01" min="0">
                            <div class="form-text">Este valor solo afecta la visualización, no los cálculos reales</div>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i> 
                            <strong>Para cambiar cálculos reales:</strong><br>
                            <button class="btn btn-sm btn-warning mt-2" onclick="cambiarMontoPredeterminado()">
                                <i class="fas fa-cog"></i> Cambiar monto predeterminado
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="guardarMontoGeneralEditado()">
                            <i class="fas fa-save"></i> Guardar Cambio Visual
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Si el modal ya existe, removerlo
    const modalExistente = document.getElementById('modalEditarMontoGeneral');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    // Agregar el modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarMontoGeneral'));
    modal.show();
    
    // Enfocar el campo de entrada
    setTimeout(() => {
        document.getElementById('nuevoMontoGeneral').focus();
    }, 500);
}

// FUNCIÓN PARA GUARDAR EL MONTO GENERAL EDITADO
function guardarMontoGeneralEditado() {
    const nuevoMonto = parseFloat(document.getElementById('nuevoMontoGeneral').value) || 0;
    
    if (isNaN(nuevoMonto) || nuevoMonto < 0) {
        mostrarMensaje('Ingrese un monto válido', 'error');
        return;
    }
    
    // Actualizar el elemento en pantalla
    const elementoTotal = document.getElementById('totalGeneralCasilleros');
    
    // Si tiene estructura con hijos (span + botón)
    if (elementoTotal.querySelector('span')) {
        elementoTotal.querySelector('span').textContent = `Bs ${nuevoMonto.toFixed(2)}`;
    } else {
        // Si es texto simple
        elementoTotal.textContent = `Bs ${nuevoMonto.toFixed(2)}`;
    }
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('montoGeneralCasillerosVisual', nuevoMonto.toString());
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarMontoGeneral'));
    modal.hide();
    
    mostrarMensaje('Monto general actualizado (visualmente)', 'success');
}

// FUNCIÓN PARA CARGAR EL MONTO VISUAL AL INICIAR
function cargarMontoVisualCasilleros() {
    const montoGuardado = localStorage.getItem('montoGeneralCasillerosVisual');
    if (montoGuardado && document.getElementById('totalGeneralCasilleros')) {
        const montoNum = parseFloat(montoGuardado);
        const elemento = document.getElementById('totalGeneralCasilleros');
        
        if (isAdmin) {
            elemento.innerHTML = `
                <span class="contador-cobros">Bs ${montoNum.toFixed(2)}</span>
                <button class="btn btn-sm btn-outline-warning btn-editar-total ms-2" 
                        onclick="editarMontoGeneralCasilleros()" 
                        title="Editar monto general"
                        style="padding: 5px 8px; border-radius: 50%;">
                    <i class="fas fa-pencil-alt"></i>
                </button>
            `;
        } else {
            elemento.textContent = `Bs ${montoNum.toFixed(2)}`;
        }
        
        elemento.style.color = montoNum >= 0 ? '#28a745' : '#dc3545';
    }
}

// LLAMAR ESTA FUNCIÓN AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', function() {
    // Cargar monto visual si existe
    setTimeout(cargarMontoVisualCasilleros, 1000);
});



function verHistorialCasillero(numero) {
    const casillero = datos.casilleros[numero] || {
        numero: numero,
        estudiante: '',
        montoMensual: 10.00,
        mesesPagados2026: [],
        mesesPagados2027: [],
        historialPagos: [],
        totalPagado: 0,
        estado: 'libre'
    };
    
    // Calcular totales
    const meses2026 = casillero.mesesPagados2026.length;
    const meses2027 = casillero.mesesPagados2027.length;
    const totalMeses = meses2026 + meses2027;
    const totalPagado = totalMeses * (casillero.montoMensual || 10.00);
    
    // Actualizar el título del modal
    document.getElementById('numeroCasilleroModal').textContent = numero;
    
    // Generar contenido para el modal
    let contenidoHTML = `
        <div class="row mb-4">
            <div class="col-md-6">
                <p><strong><i class="fas fa-user"></i> Estudiante:</strong> ${casillero.estudiante || 'Sin asignar'}</p>
                <p><strong><i class="fas fa-money-bill"></i> Monto Mensual:</strong> Bs ${(casillero.montoMensual || 10.00).toFixed(2)}</p>
            </div>
            <div class="col-md-6">
                <p><strong><i class="fas fa-coins"></i> Total Pagado:</strong> Bs ${totalPagado.toFixed(2)}</p>
                <p><strong><i class="fas fa-calendar-alt"></i> Meses Pagados:</strong> ${totalMeses} meses</p>
            </div>
        </div>
        
        <!-- Calendario compacto CON CONTROLES DE PAGO -->
        <div class="calendario-compacto mb-4">
            <h6 class="text-center mb-3 text-info">CALENDARIO DE PAGOS - ADMINISTRACIÓN</h6>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="text-warning mb-0"><small>2026</small></h6>
                            ${isAdmin ? `
                            <button class="btn btn-sm btn-outline-warning" onclick="marcarTodosMeses(${numero}, 2026)">
                                <i class="fas fa-check-double"></i> Todos
                            </button>
                            ` : ''}
                        </div>
                        <div class="meses-container-compacto">
    `;
    
    // Meses 2026 en cuadritos CON CONTROLES
    for (let mes = 1; mes <= 12; mes++) {
        const pagado = casillero.mesesPagados2026.includes(mes);
        const mesLetra = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][mes-1];
        
        contenidoHTML += `
            <div class="mes-cuadrito-vista-con-control ${pagado ? 'mes-pagado' : 'mes-no-pagado'}" 
                 title="${obtenerNombreMesCompleto(mes)} 2026 - ${pagado ? 'PAGADO' : 'NO PAGADO'}"
                 ${isAdmin ? `onclick="togglePagoMes(${numero}, 2026, ${mes})"` : ''}
                 id="mes-${numero}-2026-${mes}">
                ${mesLetra}
                <div class="indicador-admin">
                    ${pagado ? '✓' : '○'}
                </div>
            </div>
        `;
    }
    
    contenidoHTML += `
                        </div>
                        ${isAdmin ? `
                        <div class="mt-2 text-center">
                            <button class="btn btn-sm btn-warning" onclick="registrarPagoMasivo(${numero}, 2026)">
                                <i class="fas fa-save"></i> Guardar cambios 2026
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="text-info mb-0"><small>2027</small></h6>
                            ${isAdmin ? `
                            <button class="btn btn-sm btn-outline-info" onclick="marcarTodosMeses(${numero}, 2027)">
                                <i class="fas fa-check-double"></i> Todos
                            </button>
                            ` : ''}
                        </div>
                        <div class="meses-container-compacto">
    `;
    
    // Meses 2027 en cuadritos CON CONTROLES
    for (let mes = 1; mes <= 12; mes++) {
        const pagado = casillero.mesesPagados2027.includes(mes);
        const mesLetra = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][mes-1];
        
        contenidoHTML += `
            <div class="mes-cuadrito-vista-con-control ${pagado ? 'mes-pagado' : 'mes-no-pagado'}" 
                 title="${obtenerNombreMesCompleto(mes)} 2027 - ${pagado ? 'PAGADO' : 'NO PAGADO'}"
                 ${isAdmin ? `onclick="togglePagoMes(${numero}, 2027, ${mes})"` : ''}
                 id="mes-${numero}-2027-${mes}">
                ${mesLetra}
                <div class="indicador-admin">
                    ${pagado ? '✓' : '○'}
                </div>
            </div>
        `;
    }
    
    contenidoHTML += `
                        </div>
                        ${isAdmin ? `
                        <div class="mt-2 text-center">
                            <button class="btn btn-sm btn-info" onclick="registrarPagoMasivo(${numero}, 2027)">
                                <i class="fas fa-save"></i> Guardar cambios 2027
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- BOTONES DE ACCIÓN RÁPIDA -->
            ${isAdmin ? `
            <div class="acciones-rapidas mt-4">
                <div class="row">
                    <div class="col-md-4">
                        <button class="btn btn-success w-100" onclick="registrarPagoMensual(${numero})">
                            <i class="fas fa-money-bill-wave"></i> Registrar pago actual
                        </button>
                    </div>
                    <div class="col-md-4">
                        <button class="btn btn-warning w-100" onclick="abrirModalLiberarCasillero(${numero})">
                            <i class="fas fa-door-open"></i> Liberar casillero
                        </button>
                    </div>
                    <div class="col-md-4">
                        <button class="btn btn-primary w-100" onclick="abrirModalCambiarEstudiante(${numero})">
                            <i class="fas fa-exchange-alt"></i> Cambiar estudiante
                        </button>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- RESUMEN -->
            <div class="resumen-calendario mt-4">
                <h6 class="text-center mb-2">RESUMEN</h6>
                <div class="row text-center">
                    <div class="col-4">
                        <div class="resumen-item">
                            <div class="resumen-titulo">2026</div>
                            <div class="resumen-valor" id="contador2026">${meses2026}/12</div>
                            <div class="resumen-monto">Bs ${(meses2026 * (casillero.montoMensual || 10)).toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="resumen-item">
                            <div class="resumen-titulo">2027</div>
                            <div class="resumen-valor" id="contador2027">${meses2027}/12</div>
                            <div class="resumen-monto">Bs ${(meses2027 * (casillero.montoMensual || 10)).toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="resumen-item">
                            <div class="resumen-titulo">TOTAL</div>
                            <div class="resumen-valor" id="contadorTotal">${totalMeses}/24</div>
                            <div class="resumen-monto">Bs ${totalPagado.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- HISTORIAL -->
    `;
    
    // Generar historial de pagos si existe
    if (casillero.historialPagos && casillero.historialPagos.length > 0) {
        contenidoHTML += `
            <div class="historial-container">
                <h6 class="text-info mb-2"><i class="fas fa-history"></i> Historial de Pagos</h6>
                <table class="table table-sm table-dark">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th>Monto</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        casillero.historialPagos.forEach((registro, index) => {
            let descripcion = '';
            let monto = '';
            
            if (registro.tipo === 'asignacion') {
                descripcion = registro.descripcion || 'Asignación de casillero';
                monto = '-';
            } else if (registro.tipo === 'pago_mensual') {
                descripcion = `Pago ${registro.nombreMes} ${registro.anio}`;
                monto = `Bs ${registro.monto.toFixed(2)}`;
            } else if (registro.tipo === 'liberacion') {
                descripcion = registro.descripcion || 'Liberación de casillero';
                monto = '-';
            } else if (registro.tipo === 'cambio_estudiante') {
                descripcion = registro.descripcion || 'Cambio de estudiante';
                monto = '-';
            }
            
            contenidoHTML += `
                <tr>
                    <td>${registro.fecha}</td>
                    <td>${descripcion}</td>
                    <td>${monto}</td>
                    <td>
                        ${isAdmin && registro.tipo === 'pago_mensual' ? `
                        <button class="btn btn-danger btn-sm" onclick="eliminarPagoIndividual(${numero}, ${registro.anio}, ${registro.mes})">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
        
        contenidoHTML += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        contenidoHTML += `
            <div class="text-center text-muted py-3">
                <i class="fas fa-history fa-2x"></i>
                <p>No hay historial registrado</p>
            </div>
        `;
    }
    
    // Insertar contenido en el modal fijo
    const contenidoModal = document.getElementById('contenidoHistorialCompacto');
    if (contenidoModal) {
        contenidoModal.innerHTML = contenidoHTML;
    }
    
    // Guardar el número del casillero en una variable global
    window.casilleroActual = numero;
    
    // Mostrar el modal fijo
    const modal = new bootstrap.Modal(document.getElementById('modalHistorialCasilleroCompacto'));
    modal.show();
}

// FUNCIÓN PARA EDITAR DESDE EL MODAL
function editarCasilleroDesdeModal() {
    // Obtener el número del casillero desde el título del modal
    const titulo = document.getElementById('numeroCasilleroModal').textContent;
    const numero = parseInt(titulo);
    
    if (numero) {
        // Cerrar el modal primero
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalHistorialCasilleroCompacto'));
        modal.hide();
        
        // Cargar datos en el formulario principal
        setTimeout(() => {
            document.getElementById('numeroCasillero').value = numero;
            cargarDatosCasillero();
            
            // Hacer scroll al formulario
            document.querySelector('#casilleros').scrollIntoView({ behavior: 'smooth' });
            
            // Enfocar en el campo estudiante
            document.getElementById('estudianteCasillero').focus();
        }, 300);
    }
}

// FUNCIÓN PARA EDITAR DESDE MODAL
function editarCasilleroDesdeModal(numero) {
    // Cerrar modal primero
    const modal = bootstrap.Modal.getInstance(document.getElementById(`modalCasillero${numero}`));
    modal.hide();
    
    // Cargar datos en formulario
    document.getElementById('numeroCasillero').value = numero;
    cargarDatosCasillero();
    
    // Enfocar en formulario
    setTimeout(() => {
        document.getElementById('estudianteCasillero').focus();
    }, 300);
}

// FUNCIÓN PARA LIBERAR DESDE MODAL
function liberarCasilleroDesdeModal(numero) {
    if (confirm(`¿Está seguro de liberar el casillero ${numero}?`)) {
        datos.casilleros[numero] = {
            numero: numero,
            estudiante: '',
            montoMensual: 10.00,
            mesesPagados2026: [],
            mesesPagados2027: [],
            historial: [],
            totalPagado: 0
        };
        
        guardarDatos();
        actualizarVistaCasilleros();
        actualizarDetalleCajaFuerte();
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById(`modalCasillero${numero}`));
        modal.hide();
        
        mostrarMensaje('Casillero liberado exitosamente', 'success');
    }
}

// FUNCIÓN AUXILIAR PARA NOMBRE MES CORTO
function obtenerNombreMesCorto(numero) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[numero - 1] || 'Mes ' + numero;
}

// FUNCIÓN PARA MOSTRAR MODAL DE HISTORIAL DE CASILLERO
function mostrarModalHistorialCasillero() {
    // Verificar si el modal existe
    if (!document.getElementById('modalHistorialCasillero')) {
        console.error('Modal no encontrado');
        return false;
    }
    return true;
}


// FUNCIÓN AUXILIAR PARA OBTENER NOMBRE DEL MES
function obtenerNombreMes(numero) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[numero - 1] || 'Mes ' + numero;
}

// LIBERAR CASILLERO SELECCIONADO
function liberarCasilleroSeleccionado() {
    if (!isAdmin) return;
    
    const numero = parseInt(document.getElementById('numeroCasillero').value);
    if (!numero) {
        mostrarMensaje('Seleccione un casillero primero', 'error');
        return;
    }
    
    if (confirm(`¿Está seguro de liberar el casillero ${numero}?`)) {
        datos.casilleros[numero] = {
            numero: numero,
            estudiante: '',
            montoMensual: 10.00,
            mesesPagados2026: [],
            mesesPagados2027: [],
            historial: [],
            totalPagado: 0
        };
        
        // Limpiar formulario
        document.getElementById('estudianteCasillero').value = '';
        inicializarCalendarioMeses('calendario2026', 2026);
        inicializarCalendarioMeses('calendario2027', 2027);
        
        guardarDatos();
        actualizarVistaCasilleros();
        actualizarDetalleCajaFuerte();
        
        mostrarMensaje('Casillero liberado exitosamente', 'success');
    }
}

// VER HISTORIAL CASILLERO SELECCIONADO
function verHistorialCasilleroSeleccionado() {
    const numero = parseInt(document.getElementById('numeroCasillero').value);
    if (!numero) {
        mostrarMensaje('Seleccione un casillero primero', 'error');
        return;
    }
    
    verHistorialCasillero(numero);
}

// EDITAR CASILLERO DESDE HISTORIAL
function editarCasilleroDesdeHistorial() {
    const numero = parseInt(document.getElementById('numeroCasilleroHistorial').textContent);
    
    // Seleccionar en el formulario
    document.getElementById('numeroCasillero').value = numero;
    cargarDatosCasillero();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalHistorialCasillero'));
    modal.hide();
}

// LIBERAR CASILLERO DESDE HISTORIAL
function liberarCasilleroDesdeHistorial() {
    const numero = parseInt(document.getElementById('numeroCasilleroHistorial').textContent);
    
    if (confirm(`¿Está seguro de liberar el casillero ${numero}?`)) {
        datos.casilleros[numero] = {
            numero: numero,
            estudiante: '',
            montoMensual: 10.00,
            mesesPagados2026: [],
            mesesPagados2027: [],
            historial: [],
            totalPagado: 0
        };
        
        guardarDatos();
        actualizarVistaCasilleros();
        actualizarDetalleCajaFuerte();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalHistorialCasillero'));
        modal.hide();
        
        mostrarMensaje('Casillero liberado exitosamente', 'success');
    }
}

// REGISTRAR GASTO DE CASILLEROS
// REGISTRAR GASTO DE CASILLEROS - VERSIÓN MEJORADA

// FUNCIÓN PARA ACTUALIZAR RESUMEN DE CASILLEROS
// FUNCIÓN PARA ACTUALIZAR RESUMEN DE CASILLEROS
function actualizarResumenCasilleros() {
    // Calcular ingresos totales (suma de todos los pagos de casilleros)
    let ingresosTotales = 0;
    
    if (datos.casilleros) {
        // Verificar si casilleros es un objeto
        if (typeof datos.casilleros === 'object' && datos.casilleros !== null) {
            // Recorrer todos los casilleros (es un objeto, no un array)
            Object.values(datos.casilleros).forEach(casillero => {
                if (casillero && casillero.totalPagado) {
                    ingresosTotales += casillero.totalPagado || 0;
                }
            });
        }
    }
    
    // Calcular gastos totales de casilleros
    let gastosTotales = 0;
    if (datos.gastosCasilleros && Array.isArray(datos.gastosCasilleros)) {
        datos.gastosCasilleros.forEach(gasto => {
            gastosTotales += gasto.monto || 0;
        });
    }
    
    // Calcular saldo
    const saldo = ingresosTotales - gastosTotales;
    
    // Actualizar en la página
    if (document.getElementById('casillerosIngresos')) {
        document.getElementById('casillerosIngresos').textContent = `Bs ${ingresosTotales.toFixed(2)}`;
    }
    if (document.getElementById('casillerosGastos')) {
        document.getElementById('casillerosGastos').textContent = `Bs ${gastosTotales.toFixed(2)}`;
    }
    if (document.getElementById('casillerosSaldo')) {
        document.getElementById('casillerosSaldo').textContent = `Bs ${saldo.toFixed(2)}`;
    }
    if (document.getElementById('resumenIngresosCasilleros')) {
        document.getElementById('resumenIngresosCasilleros').textContent = `Bs ${ingresosTotales.toFixed(2)}`;
    }
    if (document.getElementById('resumenGastosCasilleros')) {
        document.getElementById('resumenGastosCasilleros').textContent = `Bs ${gastosTotales.toFixed(2)}`;
    }
    if (document.getElementById('resumenSaldoCasilleros')) {
        document.getElementById('resumenSaldoCasilleros').textContent = `Bs ${saldo.toFixed(2)}`;
    }
    
    // Guardar los datos calculados en el objeto datos
    datos.casillerosIngresos = ingresosTotales || 0;
    datos.casillerosGastos = gastosTotales || 0;
    
    // Actualizar también el total general de casilleros (en el header si existe)
    if (document.getElementById('totalCasilleros')) {
        document.getElementById('totalCasilleros').textContent = `Bs ${ingresosTotales.toFixed(2)}`;
    }
}

// FUNCIÓN PARA REGISTRAR GASTO DE CASILLEROS
// FUNCIÓN PARA REGISTRAR GASTO DE CASILLEROS
function registrarGastoCasillero(e) {
    if (e) e.preventDefault();
    
    if (!isAdmin) {
        mostrarMensaje('Solo el administrador puede registrar gastos', 'error');
        return false;
    }
    
    const concepto = document.getElementById('conceptoGastoCasillero').value;
    const monto = parseFloat(document.getElementById('montoGastoCasillero').value) || 0;
    const fecha = document.getElementById('fechaGastoCasillero').value;
    const descripcion = document.getElementById('descripcionGastoCasillero').value;
    
    if (!concepto || !monto || !fecha || !descripcion) {
        mostrarMensaje('Complete todos los campos', 'error');
        return false;
    }
    
    // PASO 1: CREAR EL GASTO
    const nuevoGasto = {
        id: Date.now(),
        concepto: concepto,
        monto: monto,
        fecha: fecha,
        descripcion: descripcion,
        timestamp: Date.now()
    };
    
    console.log("📝 Creando gasto:", nuevoGasto);
    
    // PASO 2: AGREGAR AL ARRAY (asegurando que existe)
    if (!datos.gastosCasilleros) {
        console.log("⚠️ Creando array gastosCasilleros");
        datos.gastosCasilleros = [];
    }
    
    datos.gastosCasilleros.push(nuevoGasto);
    console.log("✅ Gasto agregado. Total:", datos.gastosCasilleros.length);
    
    // PASO 3: GUARDAR EN LOCALSTORAGE DE FORMA DIRECTA
    try {
        localStorage.setItem('gastos_casilleros', JSON.stringify(datos.gastosCasilleros));
        console.log("💾 Guardado directo en localStorage");
    } catch (error) {
        console.error("Error guardando:", error);
    }
    
    // PASO 4: GUARDAR TODO EL OBJETO DATOS
    guardarDatos();
    
    // PASO 5: ACTUALIZAR VISUALIZACIÓN INMEDIATA
    actualizarTablaGastosCasilleros();
    actualizarResumenCasilleros();
    
    // PASO 6: LIMPIAR FORMULARIO
    document.getElementById('formGastoCasillero').reset();
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaGastoCasillero').value = hoy;
    
    mostrarMensaje('Gasto registrado exitosamente', 'success');
    return false;
}

// FUNCIÓN PARA ACTUALIZAR TABLA DE GASTOS DE CASILLEROS
// FUNCIÓN PARA ACTUALIZAR TABLA DE GASTOS DE CASILLEROS
function actualizarTablaGastosCasilleros() {
    console.log("🔄 Actualizando tabla de gastos casilleros");
    
    const tbody = document.getElementById('tablaGastosCasilleros');
    if (!tbody) {
        console.error("❌ No existe tablaGastosCasilleros en el HTML");
        return;
    }
    
    tbody.innerHTML = '';
    
    // VERIFICAR SI EXISTEN DATOS
    if (!datos.gastosCasilleros || datos.gastosCasilleros.length === 0) {
        console.log("ℹ️ No hay gastos para mostrar");
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No hay gastos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    console.log(`✅ Mostrando ${datos.gastosCasilleros.length} gastos`);
    
    // Mostrar en orden inverso (más reciente primero)
    for (let i = datos.gastosCasilleros.length - 1; i >= 0; i--) {
        const gasto = datos.gastosCasilleros[i];
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${gasto.fecha || 'Sin fecha'}</td>
            <td>${gasto.concepto || 'Sin concepto'}</td>
            <td>${gasto.descripcion || 'Sin descripción'}</td>
            <td class="text-danger">Bs ${(gasto.monto || 0).toFixed(2)}</td>
            <td>
                ${isAdmin ? `
                <button class="btn btn-danger btn-sm" onclick="eliminarGastoCasillero(${gasto.id})">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(fila);
    }
}
// FUNCIÓN PARA ELIMINAR GASTO DE CASILLEROS
function eliminarGastoCasillero(id) {
    if (!isAdmin) {
        mostrarMensaje('Solo el administrador puede eliminar gastos', 'error');
        return;
    }
    
    if (!confirm('¿Está seguro de eliminar este gasto?')) {
        return;
    }
    
    // Verificar que existe el array
    if (!datos.gastosCasilleros || !Array.isArray(datos.gastosCasilleros)) {
        return;
    }
    
    const index = datos.gastosCasilleros.findIndex(gasto => gasto.id === id);
    if (index !== -1) {
        const gasto = datos.gastosCasilleros[index];
        
        // Eliminar de la lista
        datos.gastosCasilleros.splice(index, 1);
        
        // Eliminar del historial
        if (datos.casillerosHistorial) {
            const histIndex = datos.casillerosHistorial.findIndex(h => h.id === id);
            if (histIndex !== -1) datos.casillerosHistorial.splice(histIndex, 1);
        }
        
        // FORMA SEGURA DE GUARDAR
        guardarDatosSeguro();
        
        // Actualizar todo
        actualizarResumenCasilleros();
        actualizarTablaGastosCasilleros();
        
        mostrarMensaje('Gasto eliminado', 'success');
    }
}

// FUNCIÓN PARA ACTUALIZAR CUANDO SE REGISTRE UN PAGO DE CASILLERO
function actualizarCuandoSeRegistrePagoCasillero(monto) {
    if (!datos.casillerosIngresos) datos.casillerosIngresos = 0;
    datos.casillerosIngresos += monto;
    actualizarResumenCasilleros();
}

// FUNCIÓN DE GUARDADO SEGURO - AGREGAR ESTA FUNCIÓN NUEVA
// FUNCIÓN DE GUARDADO SEGURO - VERSIÓN QUE SÍ FUNCIONA
function guardarDatosSeguro() {
    try {
        console.log("💾 GUARDANDO DATOS SEGURO...");
        
        // 1. Asegurar que todos los arrays y objetos existen
        if (!datos.gastosCasilleros || !Array.isArray(datos.gastosCasilleros)) {
            console.log("⚠️ Creando gastosCasilleros...");
            datos.gastosCasilleros = [];
        }
        
        if (!datos.gastos || !Array.isArray(datos.gastos)) {
            datos.gastos = [];
        }
        
        if (!datos.movimientosCaja || !Array.isArray(datos.movimientosCaja)) {
            datos.movimientosCaja = [];
        }
        
        if (!datos.sectoresCobro || !Array.isArray(datos.sectoresCobro)) {
            datos.sectoresCobro = [];
        }
        
        if (!datos.casilleros || typeof datos.casilleros !== 'object') {
            datos.casilleros = {};
        }
        
        if (!datos.otrosCobrosSaldos || !Array.isArray(datos.otrosCobrosSaldos)) {
            datos.otrosCobrosSaldos = [];
        }
        
        // 2. Convertir a JSON con manejo de errores
        const datosJSON = JSON.stringify(datos);
        
        // 3. Guardar en localStorage
        localStorage.setItem('datosFederacion', datosJSON);
        
        console.log("✅ Datos guardados correctamente en localStorage");
        console.log("📊 Gastos casilleros guardados:", datos.gastosCasilleros.length);
        console.log("📊 Total en localStorage:", localStorage.getItem('datosFederacion')?.length || 0, "caracteres");
        
    } catch (error) {
        console.error("❌ ERROR CRÍTICO al guardar:", error);
        
        // Intentar guardar solo los datos esenciales
        try {
            const datosMinimos = {
                gastosCasilleros: datos.gastosCasilleros || [],
                casilleros: datos.casilleros || {},
                timestamp: Date.now()
            };
            localStorage.setItem('datosFederacion_min', JSON.stringify(datosMinimos));
            console.log("✅ Datos mínimos guardados como respaldo");
        } catch (e2) {
            console.error("❌ No se pudo guardar ni siquiera los datos mínimos:", e2);
        }
    }
}
// LUEGO, al inicio de tu código (después de cargarDatos()), agrega:
// Busca donde dice:
// cargarDatos();
// Y agrega después:

// INICIALIZAR gastosCasilleros si no existe después de cargar
if (!datos.gastosCasilleros) {
    datos.gastosCasilleros = [];
    guardarDatosSeguro();
}


// FUNCIÓN ACTUALIZAR DASHBOARD CORREGIDA
function actualizarDashboard() {
    // 1. DINERO INICIAL
    if (datos.dineroInicial === 0) {
        datos.dineroInicial = obtenerDineroInicial();
    }
    
    // 2. TOTAL APORTES ESTUDIANTES (de la pestaña Cursos)
    let totalAportesEstudiantes = 0;
    for (const curso of Object.values(datos.cursos)) {
        if (curso.estudiantes) {
            for (const estudiante of curso.estudiantes) {
                if (estudiante.pagos) {
                    for (const pago of Object.values(estudiante.pagos)) {
                        if (pago.pagado && pago.monto > 0) {
                            totalAportesEstudiantes += pago.monto;
                        }
                    }
                }
            }
        }
    }
    datos.totalAportesEstudiantes = totalAportesEstudiantes;
    
    // 3. TOTAL GASTOS
    let totalGastosCalculado = 0;
    for (const gasto of datos.gastos) {
        totalGastosCalculado += gasto.monto || 0;
    }
    datos.totalGastos = totalGastosCalculado;
    
    // 4. DINERO FINAL
    const dineroFinal = datos.dineroInicial + datos.totalAportesEstudiantes - datos.totalGastos;
    datos.dineroFinal = dineroFinal;
    
    // Actualizar los valores en el dashboard
    if (document.getElementById('dineroInicial')) {
        document.getElementById('dineroInicial').textContent = `Bs ${datos.dineroInicial.toFixed(2)}`;
    }
    if (document.getElementById('dineroFinal')) {
        document.getElementById('dineroFinal').textContent = `Bs ${datos.dineroFinal.toFixed(2)}`;
    }
    if (document.getElementById('totalAportesEstudiantes')) {
        document.getElementById('totalAportesEstudiantes').textContent = `Bs ${datos.totalAportesEstudiantes.toFixed(2)}`;
    }
    if (document.getElementById('totalGastos')) {
        document.getElementById('totalGastos').textContent = `Bs ${datos.totalGastos.toFixed(2)}`;
    }
    
    // Panel de caja
    if (document.getElementById('totalCajaDisplay')) {
        document.getElementById('totalCajaDisplay').textContent = `Bs ${datos.dineroFinal.toFixed(2)}`;
    }
    if (document.getElementById('totalIngresosCaja')) {
        document.getElementById('totalIngresosCaja').textContent = `Bs ${datos.totalIngresosCaja.toFixed(2)}`;
    }
    if (document.getElementById('totalEgresosCaja')) {
        document.getElementById('totalEgresosCaja').textContent = `Bs ${datos.totalEgresosCaja.toFixed(2)}`;
    }
    if (document.getElementById('totalAportesCaja')) {
        document.getElementById('totalAportesCaja').textContent = `Bs ${datos.totalAportesEstudiantes.toFixed(2)}`;
    }
    if (document.getElementById('saldoCaja')) {
        document.getElementById('saldoCaja').textContent = `Bs ${datos.dineroFinal.toFixed(2)}`;
    }
    
    // Actualizar últimos pagos registrados
    actualizarUltimosPagosDashboard();
    actualizarResumenOtrosCobros();
    actualizarResumenCursosSeguimiento();
    actualizarResumenCasilleros();
}

// Función para obtener el dinero inicial
function obtenerDineroInicial() {
    if (datos.movimientosCaja.length === 0) return 0;
    
    const movimientosIngreso = datos.movimientosCaja
        .filter(mov => mov.tipo === 'ingreso')
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    return movimientosIngreso.length > 0 ? (movimientosIngreso[0].monto || 0) : 0;
}

// ACTUALIZAR ÚLTIMOS PAGOS DASHBOARD (de la pestaña Cursos)
function actualizarUltimosPagosDashboard() {
    const tbody = document.getElementById('ultimosPagosRegistrados');
    if (!tbody) return;
    
    tbody.innerHTML = '';


    
    // Recopilar todos los pagos de estudiantes
    let todosLosPagos = [];
    
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
        if (datosCurso.estudiantes) {
            datosCurso.estudiantes.forEach((estudiante, index) => {
                if (estudiante.pagos) {
                    ['2026', '2027'].forEach(anio => {
                        const pago = estudiante.pagos[anio];
                        if (pago && pago.pagado && pago.fecha && pago.monto > 0) {
                            todosLosPagos.push({
                                curso: cursoNombre,
                                estudiante: estudiante.nombre || `Estudiante ${index + 1}`,
                                anio: anio,
                                monto: pago.monto,
                                fecha: pago.fecha
                            });
                        }
                    });
                }
            });
        }
    }
    
    // Ordenar por fecha (más reciente primero)
    todosLosPagos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Tomar los últimos 5
    const ultimosPagos = todosLosPagos.slice(0, 5);
    
    if (ultimosPagos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No hay pagos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    ultimosPagos.forEach(pago => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${pago.curso}</td>
            <td>${pago.estudiante}</td>
            <td>${pago.anio}</td>
            <td class="text-success">Bs ${pago.monto.toFixed(2)}</td>
            <td>${pago.fecha}</td>
        `;
        tbody.appendChild(fila);
    });
}

// ACTUALIZAR DETALLE DE CAJA FUERTE MEJORADA
function actualizarDetalleCajaFuerte() {
    // Calcular ingresos por aportes (de la pestaña Cursos)
    let ingresosAportes = 0;
    for (const curso of Object.values(datos.cursos)) {
        if (curso.estudiantes) {
            for (const estudiante of curso.estudiantes) {
                if (estudiante.pagos) {
                    for (const pago of Object.values(estudiante.pagos)) {
                        if (pago.pagado && pago.monto > 0) {
                            ingresosAportes += pago.monto;
                        }
                    }
                }
            }
        }
    }
    
    // Calcular ingresos por casilleros
    let ingresosCasilleros = 0;
    for (const casillero of Object.values(datos.casilleros)) {
        if (casillero && casillero.totalPagado) {
            ingresosCasilleros += casillero.totalPagado;
        }
    }
    
    // Calcular otros ingresos (movimientos de caja que no son aportes ni casilleros)
    let otrosIngresos = 0;
    for (const movimiento of datos.movimientosCaja) {
        if (movimiento.tipo === 'ingreso') {
            const concepto = movimiento.concepto ? movimiento.concepto.toLowerCase() : '';
            if (!concepto.includes('aporte') && 
                !concepto.includes('casillero') &&
                !concepto.includes('estudiante')) {
                otrosIngresos += movimiento.monto || 0;
            }
        }
    }
    
    if (document.getElementById('ingresosAportes')) {
        document.getElementById('ingresosAportes').textContent = `Bs ${ingresosAportes.toFixed(2)}`;
    }
    if (document.getElementById('ingresosCasilleros')) {
        document.getElementById('ingresosCasilleros').textContent = `Bs ${ingresosCasilleros.toFixed(2)}`;
    }
    if (document.getElementById('otrosIngresos')) {
        document.getElementById('otrosIngresos').textContent = `Bs ${otrosIngresos.toFixed(2)}`;
    }
}

// ACTUALIZAR SEGUIMIENTO MEJORADO
function actualizarSeguimiento() {
    console.log("🔄 Actualizando seguimiento...");
    
    // RESETEAR CONTADORES
    let estudiantesAlDia = 0;
    let estudiantesConDeuda = 0;
    let totalAportes = 0;
    let totalDeudas = 0;
    
    // CONTADORES POR AÑO
    let estudiantesAlDia2026 = 0;
    let estudiantesFaltan2026 = 0;
    let totalDeuda2026 = 0;
    
    let estudiantesAlDia2027 = 0;
    let estudiantesFaltan2027 = 0;
    let totalDeuda2027 = 0;
    
    // RECORRER TODOS LOS CURSOS
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
        if (!datosCurso.estudiantes) continue;
        
        const montoReq2026 = obtenerMontoCurso(cursoNombre, '2026');
        const montoReq2027 = obtenerMontoCurso(cursoNombre, '2027');
        
        console.log(`Curso: ${cursoNombre} - 2026: Bs ${montoReq2026}, 2027: Bs ${montoReq2027}`);
        
        datosCurso.estudiantes.forEach(estudiante => {
            let estaAlDia = true;
            let aporteEstudiante = 0;
            let deudaEstudiante = 0;
            
            // PAGO 2026
            const pago2026 = estudiante.pagos?.['2026'] || { monto: 0, fecha: '', pagado: false };
            if (pago2026.pagado) {
                aporteEstudiante += pago2026.monto || 0;
                totalAportes += pago2026.monto || 0;
                
                if (pago2026.monto >= montoReq2026) {
                    estudiantesAlDia2026++;
                } else {
                    estudiantesFaltan2026++;
                    totalDeuda2026 += (montoReq2026 - pago2026.monto);
                    deudaEstudiante += (montoReq2026 - pago2026.monto);
                    estaAlDia = false;
                }
            } else {
                estudiantesFaltan2026++;
                totalDeuda2026 += montoReq2026;
                deudaEstudiante += montoReq2026;
                estaAlDia = false;
            }
            
            // PAGO 2027
            const pago2027 = estudiante.pagos?.['2027'] || { monto: 0, fecha: '', pagado: false };
            if (pago2027.pagado) {
                aporteEstudiante += pago2027.monto || 0;
                totalAportes += pago2027.monto || 0;
                
                if (pago2027.monto >= montoReq2027) {
                    estudiantesAlDia2027++;
                } else {
                    estudiantesFaltan2027++;
                    totalDeuda2027 += (montoReq2027 - pago2027.monto);
                    deudaEstudiante += (montoReq2027 - pago2027.monto);
                    estaAlDia = false;
                }
            } else {
                estudiantesFaltan2027++;
                totalDeuda2027 += montoReq2027;
                deudaEstudiante += montoReq2027;
                estaAlDia = false;
            }
            
            // ESTADO GENERAL
            if (estaAlDia) {
                estudiantesAlDia++;
            } else {
                estudiantesConDeuda++;
            }
            
            totalDeudas += deudaEstudiante;
        });
    }
    
    console.log("📊 RESULTADOS:");
    console.log(`Estudiantes al día: ${estudiantesAlDia}`);
    console.log(`Estudiantes con deuda: ${estudiantesConDeuda}`);
    console.log(`Total aportes: Bs ${totalAportes.toFixed(2)}`);
    console.log(`Total deudas: Bs ${totalDeudas.toFixed(2)}`);
    console.log(`2026 - Al día: ${estudiantesAlDia2026}, Faltan: ${estudiantesFaltan2026}, Deuda: Bs ${totalDeuda2026.toFixed(2)}`);
    console.log(`2027 - Al día: ${estudiantesAlDia2027}, Faltan: ${estudiantesFaltan2027}, Deuda: Bs ${totalDeuda2027.toFixed(2)}`);
    
    // ACTUALIZAR LOS 4 CUADROS GRANDES
    if (document.getElementById('estudiantesAlDia')) {
        document.getElementById('estudiantesAlDia').textContent = estudiantesAlDia;
    }
    if (document.getElementById('estudiantesFaltan')) {
        document.getElementById('estudiantesFaltan').textContent = estudiantesConDeuda;
    }
    if (document.getElementById('totalAportesSeguimiento')) {
        document.getElementById('totalAportesSeguimiento').textContent = `Bs ${totalAportes.toFixed(2)}`;
    }
    if (document.getElementById('totalDeudasSeguimiento')) {
        // ====== CAMBIO: OCULTAR DEUDA TOTAL A OBSERVADORES ======
        if (isAdmin) {
            document.getElementById('totalDeudasSeguimiento').textContent = `Bs ${totalDeudas.toFixed(2)}`;
        } else {
            document.getElementById('totalDeudasSeguimiento').textContent = "---";
        }
        // ========================================================
    }
    
    // ACTUALIZAR LOS NUEVOS CUADROS POR AÑO (si existen)
    try {
        if (document.getElementById('estudiantesAlDia2026')) {
            document.getElementById('estudiantesAlDia2026').textContent = estudiantesAlDia2026;
        }
        if (document.getElementById('estudiantesFaltan2026')) {
            document.getElementById('estudiantesFaltan2026').textContent = estudiantesFaltan2026;
        }
        if (document.getElementById('deudaTotal2026')) {
            // ====== CAMBIO: OCULTAR DEUDA 2026 A OBSERVADORES ======
            if (isAdmin) {
                document.getElementById('deudaTotal2026').textContent = `Bs ${totalDeuda2026.toFixed(2)}`;
            } else {
                document.getElementById('deudaTotal2026').textContent = "---";
            }
            // ========================================================
        }
        
        if (document.getElementById('estudiantesAlDia2027')) {
            document.getElementById('estudiantesAlDia2027').textContent = estudiantesAlDia2027;
        }
        if (document.getElementById('estudiantesFaltan2027')) {
            document.getElementById('estudiantesFaltan2027').textContent = estudiantesFaltan2027;
        }
        if (document.getElementById('deudaTotal2027')) {
            if (isAdmin) {
                document.getElementById('deudaTotal2027').textContent = `Bs ${totalDeuda2027.toFixed(2)}`;
            } else {
                document.getElementById('deudaTotal2027').textContent = "---";
            }
        }
    } catch (e) {
        console.log("Algunos elementos por año no existen aún");
    }
    
    // Actualizar el resto
    actualizarTablaSeguimientoEstudiantes();
    actualizarResumenCursosSeguimiento();
    actualizarUltimosPagosSeguimiento();
    actualizarTablaGastosCasilleros();
}

// ACTUALIZAR TABLA DE SEGUIMIENTO ESTUDIANTES
function actualizarTablaSeguimientoEstudiantes() {
    const tbody = document.getElementById('tablaSeguimientoEstudiantes');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let contador = 1;
    for (const cursoNombre of ordenCursos) {
        const datosCurso = datos.cursos[cursoNombre];
        if (datosCurso.estudiantes) {
            datosCurso.estudiantes.forEach((estudiante, index) => {
                let totalPagado = 0;
                let totalDeuda = 0;
                
                const montoReq2026 = obtenerMontoCurso(cursoNombre, '2026');
                const montoReq2027 = obtenerMontoCurso(cursoNombre, '2027');
                
                const pago2026 = estudiante.pagos ? estudiante.pagos['2026'] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false };
                const pago2027 = estudiante.pagos ? estudiante.pagos['2027'] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false };
                
                if (pago2026.pagado) totalPagado += pago2026.monto || 0;
                if (pago2027.pagado) totalPagado += pago2027.monto || 0;
                
                if (!pago2026.pagado || pago2026.monto < montoReq2026) {
                    totalDeuda += (montoReq2026 - (pago2026.pagado ? pago2026.monto : 0));
                }
                
                if (!pago2027.pagado || pago2027.monto < montoReq2027) {
                    totalDeuda += (montoReq2027 - (pago2027.pagado ? pago2027.monto : 0));
                }
                
                const estado2026 = determinarEstadoPago(pago2026, montoReq2026);
                const estado2027 = determinarEstadoPago(pago2027, montoReq2027);
                
                let estadoGeneral = 'al-dia';
                if (totalDeuda === (montoReq2026 + montoReq2027)) {
                    estadoGeneral = 'con-deuda';
                } else if (totalDeuda > 0) {
                    estadoGeneral = 'parcial';
                }
                
                const fila = document.createElement('tr');
                fila.setAttribute('data-curso', cursoNombre);
                fila.setAttribute('data-estudiante', estudiante.nombre || `Estudiante ${index + 1}`);
                fila.setAttribute('data-estado', estadoGeneral);
                
                fila.innerHTML = `
    <td>${contador}</td>
    <td><strong>${cursoNombre}</strong></td>
    <td>${estudiante.nombre || `Estudiante ${index + 1}`}</td>
    ${montoReq2026 > 0 ? `
    <td>Bs ${montoReq2026.toFixed(2)}</td>
    <td class="${pago2026.pagado ? 'text-success' : 'text-danger'}">
        ${pago2026.pagado ? 'Bs ' + (pago2026.monto || 0).toFixed(2) : 'Bs 0.00'}
    </td>
    <td>
        <span class="estado-${estado2026}">
            ${estado2026 === 'pagado' ? 'COMPLETO' : estado2026 === 'deuda' ? 'DEUDA' : 'PARCIAL'}
        </span>
    </td>
    ` : `
    <td colspan="3" class="text-center text-muted">
        <small>NO APLICA</small>
    </td>
    `}
    ${montoReq2027 > 0 ? `
    <td>Bs ${montoReq2027.toFixed(2)}</td>
    <td class="${pago2027.pagado ? 'text-success' : 'text-danger'}">
        ${pago2027.pagado ? 'Bs ' + (pago2027.monto || 0).toFixed(2) : 'Bs 0.00'}
    </td>
    <td>
        <span class="estado-${estado2027}">
            ${estado2027 === 'pagado' ? 'COMPLETO' : estado2027 === 'deuda' ? 'DEUDA' : 'PARCIAL'}
        </span>
    </td>
    ` : `
    <td colspan="3" class="text-center text-muted">
        <small>NO APLICA</small>
    </td>
    `}
    <td class="text-success">Bs ${totalPagado.toFixed(2)}</td>
    <td class="${totalDeuda > 0 ? 'text-danger' : 'text-success'}">Bs ${totalDeuda.toFixed(2)}</td>
    <td>
        <span class="estado-${estadoGeneral}">
            ${estadoGeneral === 'al-dia' ? 'AL DÍA' : estadoGeneral === 'con-deuda' ? 'CON DEUDA' : 'PARCIAL'}
        </span>
    </td>
    <td>
        ${isAdmin ? `
        <button class="btn btn-pago btn-sm" onclick="abrirModalEditarPagoEspecifico('${cursoNombre}', ${index})">
            <i class="fas fa-edit"></i>
        </button>
        ` : ''}
        <button class="btn btn-recibo btn-sm" onclick="generarRecibo('${cursoNombre}', ${index})">
            <i class="fas fa-receipt"></i>
        </button>
    </td>
`;
                tbody.appendChild(fila);
                contador++;
            });
        }
    }
}


// NUEVA FUNCIÓN: Mostrar resumen financiero en seguimiento
function actualizarResumenFinancieroSeguimiento() {
    const contenedor = document.getElementById('resumenFinancieroSeguimiento');
    if (!contenedor) {
        // Si no existe el contenedor, créalo
        const tabSeguimiento = document.getElementById('seguimiento');
        if (tabSeguimiento) {
            // Buscar dónde insertar (después de la tabla de últimos pagos)
            const ultimaSeccion = tabSeguimiento.querySelector('#tablaUltimosPagosSeguimiento');
            if (ultimaSeccion) {
                const nuevoContenedor = document.createElement('div');
                nuevoContenedor.id = 'resumenFinancieroSeguimiento';
                nuevoContenedor.className = 'mt-4';
                nuevoContenedor.innerHTML = `
                    <h4 class="neon-text mb-3"><i class="fas fa-chart-line"></i> Resumen Financiero Actual</h4>
                    <div class="row" id="contenidoResumenFinanciero">
                        <!-- Aquí se cargará el resumen -->
                    </div>
                `;
                ultimaSeccion.parentNode.insertBefore(nuevoContenedor, ultimaSeccion.nextSibling);
            }
        }
        return;
    }
    
    // Calcular todos los datos financieros
    const contenidoHTML = `
        <div class="col-md-4 mb-3">
            <div class="card-financiero card-ingresos">
                <div class="card-body">
                    <h5 class="card-title"><i class="fas fa-money-bill-wave text-success"></i> INGRESOS</h5>
                    <div class="card-text">
                        <div class="d-flex justify-content-between">
                            <span>Aportes Estudiantes:</span>
                            <strong class="text-success">Bs ${datos.totalAportesEstudiantes?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Casilleros:</span>
                            <strong class="text-success">Bs ${calcularTotalCasilleros().toFixed(2)}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Otros Ingresos:</span>
                            <strong class="text-success">Bs ${calcularOtrosIngresos().toFixed(2)}</strong>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <strong>TOTAL INGRESOS:</strong>
                            <strong class="text-success">Bs ${(datos.totalAportesEstudiantes + calcularTotalCasilleros() + calcularOtrosIngresos()).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-4 mb-3">
            <div class="card-financiero card-egresos">
                <div class="card-body">
                    <h5 class="card-title"><i class="fas fa-receipt text-danger"></i> GASTOS</h5>
                    <div class="card-text">
                        <div class="d-flex justify-content-between">
                            <span>Gastos Operativos:</span>
                            <strong class="text-danger">Bs ${datos.totalGastos?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Egresos de Caja:</span>
                            <strong class="text-danger">Bs ${datos.totalEgresosCaja?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Gastos Casilleros:</span>
                            <strong class="text-danger">Bs ${calcularGastosCasilleros().toFixed(2)}</strong>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <strong>TOTAL GASTOS:</strong>
                            <strong class="text-danger">Bs ${(datos.totalGastos + datos.totalEgresosCaja + calcularGastosCasilleros()).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-4 mb-3">
            <div class="card-financiero card-saldo">
                <div class="card-body">
                    <h5 class="card-title"><i class="fas fa-piggy-bank text-primary"></i> SALDOS</h5>
                    <div class="card-text">
                        <div class="d-flex justify-content-between">
                            <span>Dinero Inicial:</span>
                            <strong>Bs ${datos.dineroInicial?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Total Recaudado:</span>
                            <strong class="text-success">Bs ${(datos.totalAportesEstudiantes + calcularTotalCasilleros() + calcularOtrosIngresos()).toFixed(2)}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Total Gastado:</span>
                            <strong class="text-danger">Bs ${(datos.totalGastos + datos.totalEgresosCaja + calcularGastosCasilleros()).toFixed(2)}</strong>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <strong>SALDO ACTUAL:</strong>
                            <strong class="text-primary" style="font-size: 1.2rem;">Bs ${datos.dineroFinal?.toFixed(2) || '0.00'}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    contenedor.querySelector('#contenidoResumenFinanciero').innerHTML = contenidoHTML;
    
    // También agregar los últimos gastos
    actualizarUltimosGastosSeguimiento();
}

// Funciones auxiliares para calcular
function calcularTotalCasilleros() {
    let total = datos.montoInicialCasilleros || 0;

    datos.sectores.forEach(sector => {
        if (sector.cobros) {
            sector.cobros.forEach(cobro => {
                total += cobro.monto || 0;
            });
        }
    });

    return total;
}

function calcularOtrosIngresos() {
    let total = 0;
    for (const movimiento of datos.movimientosCaja) {
        if (movimiento.tipo === 'ingreso') {
            const concepto = movimiento.concepto ? movimiento.concepto.toLowerCase() : '';
            if (!concepto.includes('aporte') && 
                !concepto.includes('casillero') &&
                !concepto.includes('estudiante')) {
                total += movimiento.monto || 0;
            }
        }
    }
    return total;
}

function calcularGastosCasilleros() {
    let total = 0;
    for (const gasto of datos.gastosCasilleros) {
        total += gasto.monto || 0;
    }
    return total;
}

function actualizarUltimosGastosSeguimiento() {
    const contenedor = document.getElementById('ultimosGastosSeguimiento');
    if (!contenedor) {
        // Crear contenedor si no existe
        const resumenContainer = document.getElementById('resumenFinancieroSeguimiento');
        if (resumenContainer) {
            const nuevoContenedor = document.createElement('div');
            nuevoContenedor.id = 'ultimosGastosSeguimiento';
            nuevoContenedor.className = 'col-12 mt-3';
            nuevoContenedor.innerHTML = `
                <h5 class="neon-text-red mb-3"><i class="fas fa-history"></i> Últimos Gastos Registrados</h5>
                <div class="table-responsive" id="tablaUltimosGastos">
                    <!-- Los gastos se cargarán aquí -->
                </div>
            `;
            resumenContainer.querySelector('.row').appendChild(nuevoContenedor);
        }
    }
    
    const tablaContainer = document.getElementById('tablaUltimosGastos');
    if (!tablaContainer) return;
    
    // Obtener los últimos 10 gastos
    const ultimosGastos = [...datos.gastos]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 10);
    
    if (ultimosGastos.length === 0) {
        tablaContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No hay gastos registrados
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="table table-sm table-dark table-hover">
            <thead>
                <tr>
                    <th width="15%">Fecha</th>
                    <th width="20%">Categoría</th>
                    <th width="40%">Descripción</th>
                    <th width="15%" class="text-end">Monto</th>
                    <th width="10%">Comprobante</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    ultimosGastos.forEach(gasto => {
        html += `
            <tr>
                <td>${gasto.fecha || '-'}</td>
                <td>${gasto.categoria || '-'}</td>
                <td>${(gasto.descripcion || '').substring(0, 40)}${(gasto.descripcion || '').length > 40 ? '...' : ''}</td>
                <td class="text-danger text-end">Bs ${(gasto.monto || 0).toFixed(2)}</td>
                <td>
                    ${gasto.comprobante ? 
                        `<button class="btn btn-sm btn-info" onclick="verComprobante(${gasto.id})">
                            <i class="fas fa-eye"></i>
                        </button>` : 
                        '<span class="badge bg-secondary">No</span>'
                    }
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
            <tfoot>
                <tr class="table-danger">
                    <td colspan="3" class="text-end"><strong>Total últimos 10 gastos:</strong></td>
                    <td class="text-end"><strong>Bs ${ultimosGastos.reduce((sum, gasto) => sum + (gasto.monto || 0), 0).toFixed(2)}</strong></td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    `;
    
    tablaContainer.innerHTML = html;
}
// ACTUALIZAR RESUMEN DE CURSOS SEGUIMIENTO CON MONTOS FALTANTES
// ACTUALIZAR RESUMEN DE CURSOS EN SEGUIMIENTO - SEPARADO POR AÑO
// ============================================
// FUNCIÓN ACTUALIZADA PARA ACTUALIZACIÓN AUTOMÁTICA
// ============================================
function actualizarTablaSeguimientoEstudiantes() {
    const tbody = document.getElementById('tablaSeguimientoEstudiantes');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let contador = 1;
    for (const cursoNombre of ordenCursos) {
        const datosCurso = datos.cursos[cursoNombre];
        if (datosCurso.estudiantes) {
            datosCurso.estudiantes.forEach((estudiante, index) => {
                let totalPagado = 0;
                let totalDeuda = 0;
                
                const montoReq2026 = obtenerMontoCurso(cursoNombre, '2026');
                const montoReq2027 = obtenerMontoCurso(cursoNombre, '2027');
                
                const pago2026 = estudiante.pagos ? estudiante.pagos['2026'] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false };
                const pago2027 = estudiante.pagos ? estudiante.pagos['2027'] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false };
                
                if (pago2026.pagado) totalPagado += pago2026.monto || 0;
                if (pago2027.pagado) totalPagado += pago2027.monto || 0;
                
                if (!pago2026.pagado || pago2026.monto < montoReq2026) {
                    totalDeuda += (montoReq2026 - (pago2026.pagado ? pago2026.monto : 0));
                }
                
                if (!pago2027.pagado || pago2027.monto < montoReq2027) {
                    totalDeuda += (montoReq2027 - (pago2027.pagado ? pago2027.monto : 0));
                }
                
                const estado2026 = determinarEstadoPago(pago2026, montoReq2026);
                const estado2027 = determinarEstadoPago(pago2027, montoReq2027);
                
                let estadoGeneral = 'al-dia';
                if (totalDeuda === (montoReq2026 + montoReq2027)) {
                    estadoGeneral = 'con-deuda';
                } else if (totalDeuda > 0) {
                    estadoGeneral = 'parcial';
                }
                
                const fila = document.createElement('tr');
                fila.setAttribute('data-curso', cursoNombre);
                fila.setAttribute('data-estudiante', estudiante.nombre || `Estudiante ${index + 1}`);
                fila.setAttribute('data-estado', estadoGeneral);
                
                fila.innerHTML = `
    <td>${contador}</td>
    <td><strong>${cursoNombre}</strong></td>
    <td>${estudiante.nombre || `Estudiante ${index + 1}`}</td>
    ${montoReq2026 > 0 ? `
    <td>Bs ${montoReq2026.toFixed(2)}</td>
    <td class="${pago2026.pagado ? 'text-success' : 'text-danger'}">
        ${pago2026.pagado ? 'Bs ' + (pago2026.monto || 0).toFixed(2) : 'Bs 0.00'}
    </td>
    <td>
        <span class="estado-${estado2026}">
            ${estado2026 === 'pagado' ? 'COMPLETO' : estado2026 === 'deuda' ? 'DEUDA' : 'PARCIAL'}
        </span>
    </td>
    ` : `
    <td colspan="3" class="text-center text-muted">
        <small>NO APLICA</small>
    </td>
    `}
    ${montoReq2027 > 0 ? `
    <td>Bs ${montoReq2027.toFixed(2)}</td>
    <td class="${pago2027.pagado ? 'text-success' : 'text-danger'}">
        ${pago2027.pagado ? 'Bs ' + (pago2027.monto || 0).toFixed(2) : 'Bs 0.00'}
    </td>
    <td>
        <span class="estado-${estado2027}">
            ${estado2027 === 'pagado' ? 'COMPLETO' : estado2027 === 'deuda' ? 'DEUDA' : 'PARCIAL'}
        </span>
    </td>
    ` : `
    <td colspan="3" class="text-center text-muted">
        <small>NO APLICA</small>
    </td>
    `}
    <td class="text-success">Bs ${totalPagado.toFixed(2)}</td>
    <td class="${totalDeuda > 0 ? 'text-danger' : 'text-success'}">Bs ${totalDeuda.toFixed(2)}</td>
    <td>
        <span class="estado-${estadoGeneral}">
            ${estadoGeneral === 'al-dia' ? 'AL DÍA' : estadoGeneral === 'con-deuda' ? 'CON DEUDA' : 'PARCIAL'}
        </span>
    </td>
    <td>
        ${isAdmin ? `
        <button class="btn btn-pago btn-sm" onclick="abrirModalEditarPagoEspecifico('${cursoNombre}', ${index})">
            <i class="fas fa-edit"></i>
        </button>
        ` : ''}
        <button class="btn btn-recibo btn-sm" onclick="generarRecibo('${cursoNombre}', ${index})">
            <i class="fas fa-receipt"></i>
        </button>
    </td>
`;
                tbody.appendChild(fila);
                contador++;
            });
        }
    }
}


// NUEVA FUNCIÓN: Mostrar resumen financiero en seguimiento
function actualizarResumenFinancieroSeguimiento() {
    const contenedor = document.getElementById('resumenFinancieroSeguimiento');
    if (!contenedor) {
        // Si no existe el contenedor, créalo
        const tabSeguimiento = document.getElementById('seguimiento');
        if (tabSeguimiento) {
            // Buscar dónde insertar (después de la tabla de últimos pagos)
            const ultimaSeccion = tabSeguimiento.querySelector('#tablaUltimosPagosSeguimiento');
            if (ultimaSeccion) {
                const nuevoContenedor = document.createElement('div');
                nuevoContenedor.id = 'resumenFinancieroSeguimiento';
                nuevoContenedor.className = 'mt-4';
                nuevoContenedor.innerHTML = `
                    <h4 class="neon-text mb-3"><i class="fas fa-chart-line"></i> Resumen Financiero Actual</h4>
                    <div class="row" id="contenidoResumenFinanciero">
                        <!-- Aquí se cargará el resumen -->
                    </div>
                `;
                ultimaSeccion.parentNode.insertBefore(nuevoContenedor, ultimaSeccion.nextSibling);
            }
        }
        return;
    }
    
    // Calcular todos los datos financieros
    const contenidoHTML = `
        <div class="col-md-4 mb-3">
            <div class="card-financiero card-ingresos">
                <div class="card-body">
                    <h5 class="card-title"><i class="fas fa-money-bill-wave text-success"></i> INGRESOS</h5>
                    <div class="card-text">
                        <div class="d-flex justify-content-between">
                            <span>Aportes Estudiantes:</span>
                            <strong class="text-success">Bs ${datos.totalAportesEstudiantes?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Casilleros:</span>
                            <strong class="text-success">Bs ${calcularTotalCasilleros().toFixed(2)}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Otros Ingresos:</span>
                            <strong class="text-success">Bs ${calcularOtrosIngresos().toFixed(2)}</strong>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <strong>TOTAL INGRESOS:</strong>
                            <strong class="text-success">Bs ${(datos.totalAportesEstudiantes + calcularTotalCasilleros() + calcularOtrosIngresos()).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-4 mb-3">
            <div class="card-financiero card-egresos">
                <div class="card-body">
                    <h5 class="card-title"><i class="fas fa-receipt text-danger"></i> GASTOS</h5>
                    <div class="card-text">
                        <div class="d-flex justify-content-between">
                            <span>Gastos Operativos:</span>
                            <strong class="text-danger">Bs ${datos.totalGastos?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Egresos de Caja:</span>
                            <strong class="text-danger">Bs ${datos.totalEgresosCaja?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Gastos Casilleros:</span>
                            <strong class="text-danger">Bs ${calcularGastosCasilleros().toFixed(2)}</strong>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <strong>TOTAL GASTOS:</strong>
                            <strong class="text-danger">Bs ${(datos.totalGastos + datos.totalEgresosCaja + calcularGastosCasilleros()).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-4 mb-3">
            <div class="card-financiero card-saldo">
                <div class="card-body">
                    <h5 class="card-title"><i class="fas fa-piggy-bank text-primary"></i> SALDOS</h5>
                    <div class="card-text">
                        <div class="d-flex justify-content-between">
                            <span>Dinero Inicial:</span>
                            <strong>Bs ${datos.dineroInicial?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Total Recaudado:</span>
                            <strong class="text-success">Bs ${(datos.totalAportesEstudiantes + calcularTotalCasilleros() + calcularOtrosIngresos()).toFixed(2)}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Total Gastado:</span>
                            <strong class="text-danger">Bs ${(datos.totalGastos + datos.totalEgresosCaja + calcularGastosCasilleros()).toFixed(2)}</strong>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <strong>SALDO ACTUAL:</strong>
                            <strong class="text-primary" style="font-size: 1.2rem;">Bs ${datos.dineroFinal?.toFixed(2) || '0.00'}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    contenedor.querySelector('#contenidoResumenFinanciero').innerHTML = contenidoHTML;
    
    // También agregar los últimos gastos
    actualizarUltimosGastosSeguimiento();
}

// Funciones auxiliares para calcular
function calcularTotalCasilleros() {
    let total = datos.montoInicialCasilleros || 0;

    datos.sectores.forEach(sector => {
        if (sector.cobros) {
            sector.cobros.forEach(cobro => {
                total += cobro.monto || 0;
            });
        }
    });

    return total;
}

function calcularOtrosIngresos() {
    let total = 0;
    for (const movimiento of datos.movimientosCaja) {
        if (movimiento.tipo === 'ingreso') {
            const concepto = movimiento.concepto ? movimiento.concepto.toLowerCase() : '';
            if (!concepto.includes('aporte') && 
                !concepto.includes('casillero') &&
                !concepto.includes('estudiante')) {
                total += movimiento.monto || 0;
            }
        }
    }
    return total;
}

function calcularGastosCasilleros() {
    let total = 0;
    for (const gasto of datos.gastosCasilleros) {
        total += gasto.monto || 0;
    }
    return total;
}

function actualizarUltimosGastosSeguimiento() {
    const contenedor = document.getElementById('ultimosGastosSeguimiento');
    if (!contenedor) {
        // Crear contenedor si no existe
        const resumenContainer = document.getElementById('resumenFinancieroSeguimiento');
        if (resumenContainer) {
            const nuevoContenedor = document.createElement('div');
            nuevoContenedor.id = 'ultimosGastosSeguimiento';
            nuevoContenedor.className = 'col-12 mt-3';
            nuevoContenedor.innerHTML = `
                <h5 class="neon-text-red mb-3"><i class="fas fa-history"></i> Últimos Gastos Registrados</h5>
                <div class="table-responsive" id="tablaUltimosGastos">
                    <!-- Los gastos se cargarán aquí -->
                </div>
            `;
            resumenContainer.querySelector('.row').appendChild(nuevoContenedor);
        }
    }
    
    const tablaContainer = document.getElementById('tablaUltimosGastos');
    if (!tablaContainer) return;
    
    // Obtener los últimos 10 gastos
    const ultimosGastos = [...datos.gastos]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 10);
    
    if (ultimosGastos.length === 0) {
        tablaContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No hay gastos registrados
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="table table-sm table-dark table-hover">
            <thead>
                <tr>
                    <th width="15%">Fecha</th>
                    <th width="20%">Categoría</th>
                    <th width="40%">Descripción</th>
                    <th width="15%" class="text-end">Monto</th>
                    <th width="10%">Comprobante</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    ultimosGastos.forEach(gasto => {
        html += `
            <tr>
                <td>${gasto.fecha || '-'}</td>
                <td>${gasto.categoria || '-'}</td>
                <td>${(gasto.descripcion || '').substring(0, 40)}${(gasto.descripcion || '').length > 40 ? '...' : ''}</td>
                <td class="text-danger text-end">Bs ${(gasto.monto || 0).toFixed(2)}</td>
                <td>
                    ${gasto.comprobante ? 
                        `<button class="btn btn-sm btn-info" onclick="verComprobante(${gasto.id})">
                            <i class="fas fa-eye"></i>
                        </button>` : 
                        '<span class="badge bg-secondary">No</span>'
                    }
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
            <tfoot>
                <tr class="table-danger">
                    <td colspan="3" class="text-end"><strong>Total últimos 10 gastos:</strong></td>
                    <td class="text-end"><strong>Bs ${ultimosGastos.reduce((sum, gasto) => sum + (gasto.monto || 0), 0).toFixed(2)}</strong></td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    `;
    
    tablaContainer.innerHTML = html;
}
// ACTUALIZAR RESUMEN DE CURSOS SEGUIMIENTO CON MONTOS FALTANTES
// ACTUALIZAR RESUMEN DE CURSOS EN SEGUIMIENTO - SEPARADO POR AÑO
// ============================================
// FUNCIÓN ACTUALIZADA PARA ACTUALIZACIÓN AUTOMÁTICA
// ============================================
function actualizarResumenCursosSeguimiento() {
    console.log("🔄 ACTUALIZANDO RESUMEN DE CURSOS - AUTOMÁTICO");
    
    const contenedor = document.getElementById('resumenCursosSeguimiento');
    if (!contenedor) {
        console.error("❌ ERROR: No existe div con id='resumenCursosSeguimiento'");
        return;
    }
    
    contenedor.innerHTML = '';
    
    // VERIFICAR DATOS CRÍTICOS
    if (!datos) {
        datos = { cursos: {} };
        console.warn("⚠️ Datos vacíos, creando estructura");
    }
    
    if (!datos.cursos) {
        datos.cursos = {};
        console.warn("⚠️ Cursos vacíos, creando estructura");
    }
    
    // GARANTIZAR QUE EXISTEN TODOS LOS CURSOS
    ordenCursos.forEach(cursoNombre => {
        if (!datos.cursos[cursoNombre]) {
            datos.cursos[cursoNombre] = { estudiantes: [] };
        }
        
        // Crear estudiantes si no existen
        if (!datos.cursos[cursoNombre].estudiantes || datos.cursos[cursoNombre].estudiantes.length === 0) {
            datos.cursos[cursoNombre].estudiantes = [];
            for (let i = 1; i <= 45; i++) {
                datos.cursos[cursoNombre].estudiantes.push({
                    nombre: `Estudiante ${i}`,
                    pagos: {
                        '2026': { monto: 0, fecha: '', pagado: false },
                        '2027': { monto: 0, fecha: '', pagado: false }
                    }
                });
            }
        }
    });
    
    // CONTADOR PARA DEBUG
    let cursosMostrados = 0;
    
    for (const cursoNombre of ordenCursos) {
        const datosCurso = datos.cursos[cursoNombre];
        const totalEstudiantes = datosCurso.estudiantes.length;
        
        // OBTENER MONTOS EXACTOS
        const monto2026 = obtenerMontoCurso(cursoNombre, '2026');
        const monto2027 = obtenerMontoCurso(cursoNombre, '2027');
        
        // Si NO tiene montos en NINGÚN año, omitir
        if (monto2026 <= 0 && monto2027 <= 0) {
            continue;
        }
        
        // ============= CÁLCULOS PRECISOS PARA 2026 =============
        let pagaron2026 = 0;
        let parcial2026 = 0;
        let faltan2026 = 0;
        let recaudado2026 = 0;
        let faltante2026 = 0;
        
        if (monto2026 > 0) {
            datosCurso.estudiantes.forEach(estudiante => {
                const pago = estudiante.pagos?.['2026'] || { monto: 0, pagado: false };
                
                if (pago.pagado && pago.monto > 0) {
                    recaudado2026 += pago.monto;
                    
                    if (pago.monto >= monto2026) {
                        pagaron2026++;
                    } else {
                        parcial2026++;
                        faltante2026 += (monto2026 - pago.monto);
                    }
                } else {
                    faltan2026++;
                    faltante2026 += monto2026;
                }
            });
        }
        
        // ============= CÁLCULOS PRECISOS PARA 2027 =============
        let pagaron2027 = 0;
        let parcial2027 = 0;
        let faltan2027 = 0;
        let recaudado2027 = 0;
        let faltante2027 = 0;
        
        if (monto2027 > 0) {
            datosCurso.estudiantes.forEach(estudiante => {
                const pago = estudiante.pagos?.['2027'] || { monto: 0, pagado: false };
                
                if (pago.pagado && pago.monto > 0) {
                    recaudado2027 += pago.monto;
                    
                    if (pago.monto >= monto2027) {
                        pagaron2027++;
                    } else {
                        parcial2027++;
                        faltante2027 += (monto2027 - pago.monto);
                    }
                } else {
                    faltan2027++;
                    faltante2027 += monto2027;
                }
            });
        }
        
        // ============= CREAR TARJETA VISUAL =============
        const colDiv = document.createElement('div');
        colDiv.className = 'col-md-6 col-lg-4 mb-4';
        
        // Calcular porcentajes
        const porcentaje2026 = (totalEstudiantes * monto2026) > 0 ? 
            Math.round((recaudado2026 / (totalEstudiantes * monto2026)) * 100) : 0;
        
        const porcentaje2027 = (totalEstudiantes * monto2027) > 0 ? 
            Math.round((recaudado2027 / (totalEstudiantes * monto2027)) * 100) : 0;
        
        // Totales del curso
        const totalRecaudado = recaudado2026 + recaudado2027;
        const totalFaltante = faltante2026 + faltante2027;
        const totalPagaron = pagaron2026 + pagaron2027;
        const totalParcial = parcial2026 + parcial2027;
        const totalFaltan = faltan2026 + faltan2027;
        
        let contenido2026 = '';
        let contenido2027 = '';
        
        // SECCIÓN 2026 (solo si tiene monto)
        if (monto2026 > 0) {
            contenido2026 = `
                <div class="anio-seguimiento anio-2026 mb-3">
                    <div class="anio-header">
                        <h6 class="text-warning mb-2">
                            <i class="fas fa-calendar-alt"></i> 2026
                            <small class="text-white ms-2">(Bs ${monto2026})</small>
                        </h6>
                    </div>
                    <div class="row text-center mb-2">
                        <div class="col-4">
                            <div class="numero-seguimiento text-success">${pagaron2026}</div>
                            <small class="text-success">Al día</small>
                        </div>
                        <div class="col-4">
                            <div class="numero-seguimiento text-warning">${parcial2026}</div>
                            <small class="text-warning">Parcial</small>
                        </div>
                        <div class="col-4">
                            <div class="numero-seguimiento text-danger">${faltan2026}</div>
                            <small class="text-danger">Faltan</small>
                        </div>
                    </div>
                    <div class="info-financiera">
                        <div class="d-flex justify-content-between">
                            <small>Recaudado:</small>
                            <strong class="text-success">Bs ${recaudado2026.toFixed(2)}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <small>Faltante:</small>
                            ${!esObservador ? `<strong class="text-danger">Bs ${faltante2026.toFixed(2)}</strong>` : `<strong class="text-muted">---</strong>`}
                        </div>
                        <div class="d-flex justify-content-between">
                            <small>% Completado:</small>
                            <strong class="${porcentaje2026 >= 50 ? 'text-success' : 'text-warning'}">
                                ${porcentaje2026}%
                            </strong>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // SECCIÓN 2027 (solo si tiene monto)
        if (monto2027 > 0) {
            contenido2027 = `
                <div class="anio-seguimiento anio-2027">
                    <div class="anio-header">
                        <h6 class="text-info mb-2">
                            <i class="fas fa-calendar-alt"></i> 2027
                            <small class="text-white ms-2">(Bs ${monto2027})</small>
                        </h6>
                    </div>
                    <div class="row text-center mb-2">
                        <div class="col-4">
                            <div class="numero-seguimiento text-success">${pagaron2027}</div>
                            <small class="text-success">Al día</small>
                        </div>
                        <div class="col-4">
                            <div class="numero-seguimiento text-warning">${parcial2027}</div>
                            <small class="text-warning">Parcial</small>
                        </div>
                        <div class="col-4">
                            <div class="numero-seguimiento text-danger">${faltan2027}</div>
                            <small class="text-danger">Faltan</small>
                        </div>
                    </div>
                    <div class="info-financiera">
                        <div class="d-flex justify-content-between">
                            <small>Recaudado:</small>
                            <strong class="text-success">Bs ${recaudado2027.toFixed(2)}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <small>Faltante:</small>
                            ${!esObservador ? `<strong class="text-danger">Bs ${faltante2027.toFixed(2)}</strong>` : `<strong class="text-muted">---</strong>`}
                        </div>
                        <div class="d-flex justify-content-between">
                            <small>% Completado:</small>
                            <strong class="${porcentaje2027 >= 50 ? 'text-success' : 'text-warning'}">
                                ${porcentaje2027}%
                            </strong>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // CALCULAR PORCENTAJE TOTAL
        const totalEsperado = (totalEstudiantes * monto2026) + (totalEstudiantes * monto2027);
        const porcentajeTotal = totalEsperado > 0 ? Math.round((totalRecaudado / totalEsperado) * 100) : 0;
        
        // HTML COMPLETO DE LA TARJETA
        colDiv.innerHTML = `
            <div class="resumen-curso-seguimiento">
                <div class="curso-header-seguimiento">
                    <h6 class="text-center mb-2">${cursoNombre}</h6>
                    <div class="text-center mb-2">
                        <small class="text-muted">${totalEstudiantes} estudiantes</small>
                    </div>
                </div>
                
                ${contenido2026}
                ${contenido2027}
                
                <!-- RESUMEN TOTAL DEL CURSO -->
                <div class="resumen-total mt-3 p-2 rounded" style="background: rgba(188, 19, 254, 0.1);">
                    <div class="row text-center">
                        <div class="col-3">
                            <div class="numero-seguimiento text-info">${totalEstudiantes}</div>
                            <small>Total</small>
                        </div>
                        <div class="col-3">
                            <div class="numero-seguimiento text-success">${totalPagaron}</div>
                            <small>Al día</small>
                        </div>
                        <div class="col-3">
                            <div class="numero-seguimiento text-warning">${totalParcial}</div>
                            <small>Parcial</small>
                        </div>
                        <div class="col-3">
                            <div class="numero-seguimiento text-danger">${totalFaltan}</div>
                            <small>Faltan</small>
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="d-flex justify-content-between">
                            <small>Total recaudado:</small>
                            <strong class="text-success">Bs ${totalRecaudado.toFixed(2)}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <small>Total faltante:</small>
                            ${!esObservador ? `<strong class="text-danger">Bs ${totalFaltante.toFixed(2)}</strong>` : `<strong class="text-muted">---</strong>`}
                        </div>
                        <div class="d-flex justify-content-between">
                            <small>% Total:</small>
                            <strong class="${porcentajeTotal >= 50 ? 'text-success' : 'text-warning'}">
                                ${porcentajeTotal}%
                            </strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        contenedor.appendChild(colDiv);
        cursosMostrados++;
    }
    
    // SI NO HAY CURSOS, MOSTRAR MENSAJE
    if (cursosMostrados === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h4 class="neon-text">No hay datos para mostrar</h4>
                <p class="text-muted">Ve a la pestaña "Cursos" y registra pagos</p>
                <button class="btn btn-primary mt-3" onclick="crearDatosDePrueba()">
                    <i class="fas fa-vial"></i> Crear datos de prueba
                </button>
            </div>
        `;
    }
}

// ============================================
// FUNCIÓN MEJORADA PARA GUARDAR DATOS (con actualización automática)
// ============================================
// FUNCIÓN DE GUARDADO MEJORADA CON ACTUALIZACIÓN AUTOMÁTICA
function guardarDatos(forzarActualizacion = false) {
    try {
        console.log("💾 Guardando datos - Usuario:", isAdmin ? "ADMIN" : "OBSERVADOR");
        
        // 1. Guardar en localStorage (SIEMPRE)
        localStorage.setItem('datosFederacion', JSON.stringify(datos));
        
        // 2. Si hay conexión, guardar en la nube también
        if (window.sincronizador && sincronizacionActiva) {
            // ====== CAMBIO CRÍTICO: ======
            // El ADMIN SIEMPRE puede guardar en la nube
            // Los OBSERVADORES solo guardan localmente
            if (isAdmin) {
                console.log("👑 Admin guardando en la nube...");
                window.sincronizador.guardarEnNube(datos)
                    .then(exito => {
                        if (exito) {
                            console.log("✅ Admin: Datos forzados a la nube");
                            // Notificación especial para admin
                            mostrarNotificacionAdmin("Cambios guardados y sincronizados");
                        }
                    });
            } else {
                console.log("👁️ Observador: Solo guardado local (no en la nube)");
            }
            // ==============================
        }
        
        // 3. ACTUALIZACIÓN AUTOMÁTICA INMEDIATA
        setTimeout(() => {
            // Determinar qué pestaña está activa
            const tabs = document.querySelectorAll('.tab-content');
            const tabActivo = Array.from(tabs).find(tab => 
                tab.style.display === 'block' || 
                tab.style.display === '' ||
                tab.classList.contains('active')
            );
            
            if (tabActivo) {
                const tabId = tabActivo.id;
                console.log(`🔄 Actualizando pestaña activa: ${tabId}`);
                
                switch(tabId) {
                    case 'dashboard':
                        actualizarDashboard();
                        actualizarDetalleCajaFuerte();
                        actualizarUltimosPagosDashboard();
                        actualizarGraficos();
                        break;
                    case 'caja':
                        actualizarTablaMovimientosCaja();
                        break;
                    case 'gastos':
                        actualizarTablaGastos();
                        break;
                    case 'cursos':
                        cargarCursoSeleccionado();
                        break;
                    case 'reportes':
                        actualizarReportes();
                        break;
                    case 'seguimiento':
                        actualizarSeguimiento();
                        actualizarResumenCursosSeguimiento();
                        actualizarTablaSeguimientoEstudiantes();
                        actualizarUltimosPagosSeguimiento();
                        break;
                    case 'casilleros':
                        actualizarVistaCasilleros();
                        actualizarResumenCasilleros();
                        actualizarTablaGastosCasilleros();
                        break;
                    case 'otros-cobros':
                        actualizarSectoresCobro();
                        actualizarResumenOtrosCobros();
                        actualizarTablaGastosOtrosCobros();
                        break;
                    case 'eventos':
                        actualizarEventos();
                        break;
                }
            }
            
            // SIEMPRE actualizar el dashboard (números principales)
            actualizarDashboardRapido();
            actualizarResumenCursosSeguimiento();
            actualizarTablaGastosCasilleros(); // ← AÑADE ESTA LÍNEA
            actualizarResumenCasilleros();
            actualizarResumenOtrosCobros();
    actualizarTablaGastosOtrosCobros();
            
        }, 100);
        
        console.log("✅ Datos guardados exitosamente");
        crearBackupAutomatico();
        
        return true;
        
        

    } catch (error) {
        console.error('❌ Error guardando datos:', error);
        return false;
    }
}

// ACTUALIZACIÓN RÁPIDA DEL DASHBOARD (solo números críticos)
function actualizarDashboardRapido() {
    try {
        // Calcular totales rápidos
        let totalAportes = 0;
        for (const curso of Object.values(datos.cursos)) {
            if (curso.estudiantes) {
                for (const estudiante of curso.estudiantes) {
                    if (estudiante.pagos) {
                        for (const pago of Object.values(estudiante.pagos)) {
                            if (pago.pagado && pago.monto > 0) {
                                totalAportes += pago.monto;
                            }
                        }
                    }
                }
            }
        }
        
        let totalGastos = 0;
        for (const gasto of datos.gastos) {
            totalGastos += gasto.monto || 0;
        }
        
        const dineroFinal = datos.dineroInicial + totalAportes - totalGastos;
        
        // Actualizar elementos específicos
        const elementos = [
            'dineroFinal', 'totalAportesEstudiantes', 'totalGastos',
            'totalCajaDisplay', 'saldoCaja', 'totalIngresosCaja',
            'totalEgresosCaja', 'totalAportesCaja'
        ];
        
        elementos.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                if (id === 'dineroFinal' || id === 'totalCajaDisplay' || id === 'saldoCaja') {
                    elem.textContent = `Bs ${dineroFinal.toFixed(2)}`;
                } else if (id === 'totalAportesEstudiantes' || id === 'totalAportesCaja') {
                    elem.textContent = `Bs ${totalAportes.toFixed(2)}`;
                } else if (id === 'totalGastos') {
                    elem.textContent = `Bs ${totalGastos.toFixed(2)}`;
                }
            }
        });
        
    } catch (e) {
        console.error("Error en actualización rápida:", e);
    }
}

// ============================================
// FUNCIÓN PARA CREAR DATOS DE PRUEBA
// ============================================
function crearDatosDePrueba() {
    console.log("🧪 Creando datos de prueba...");
    
    ordenCursos.forEach(cursoNombre => {
        if (!datos.cursos[cursoNombre]) {
            datos.cursos[cursoNombre] = { estudiantes: [] };
        }
        
        // Limpiar estudiantes existentes
        datos.cursos[cursoNombre].estudiantes = [];
        
        // Crear 10 estudiantes con pagos variados
        for (let i = 1; i <= 10; i++) {
            const estudiante = {
                nombre: `Estudiante ${i} ${cursoNombre.substring(0, 3)}`,
                pagos: {}
            };
            
            // 2026 - 60% paga completo, 20% paga parcial, 20% no paga
            const monto2026 = obtenerMontoCurso(cursoNombre, '2026');
            if (monto2026 > 0) {
                const random = Math.random();
                if (random < 0.6) {
                    // Paga completo
                    estudiante.pagos['2026'] = {
                        monto: monto2026,
                        fecha: '2024-01-15',
                        pagado: true
                    };
                } else if (random < 0.8) {
                    // Paga parcial
                    estudiante.pagos['2026'] = {
                        monto: monto2026 * 0.5,
                        fecha: '2024-01-15',
                        pagado: true
                    };
                }
                // else: no paga (no se crea el pago)
            }
            
            // 2027 - 50% paga completo, 30% paga parcial, 20% no paga
            const monto2027 = obtenerMontoCurso(cursoNombre, '2027');
            if (monto2027 > 0) {
                const random = Math.random();
                if (random < 0.5) {
                    // Paga completo
                    estudiante.pagos['2027'] = {
                        monto: monto2027,
                        fecha: '2024-01-15',
                        pagado: true
                    };
                } else if (random < 0.8) {
                    // Paga parcial
                    estudiante.pagos['2027'] = {
                        monto: monto2027 * 0.6,
                        fecha: '2024-01-15',
                        pagado: true
                    };
                }
                // else: no paga (no se crea el pago)
            }
            
            datos.cursos[cursoNombre].estudiantes.push(estudiante);
        }
    });
    
    guardarDatos();
    console.log("✅ Datos de prueba creados");
    alert('✅ Datos de prueba creados. Verás los cursos con pagos.');
}

// ============================================
// ACTUALIZACIÓN AUTOMÁTICA CUANDO SE MODIFICAN PAGOS
// ============================================

// 1. Función mejorada para registrar pagos (llama al resumen automáticamente)
function registrarPagoEstudiante() {
    if (!isAdmin) return;
    
    const curso = document.getElementById('cursoActual').value;
    const index = parseInt(document.getElementById('estudianteIndex').value);
    const anio = document.getElementById('anioPago').value;
    const monto = parseFloat(document.getElementById('montoPago').value) || 0;
    const fecha = document.getElementById('fechaPago').value;
    
    if (!curso || isNaN(index) || !anio || !monto || !fecha) {
        mostrarMensaje('Complete todos los campos', 'error');
        return;
    }
    
    if (!datos.cursos[curso].estudiantes[index].pagos) {
        datos.cursos[curso].estudiantes[index].pagos = {
            2026: { monto: 0, fecha: '', pagado: false },
            2027: { monto: 0, fecha: '', pagado: false }
        };
    }
    
    datos.cursos[curso].estudiantes[index].pagos[anio] = {
        monto: monto,
        fecha: fecha,
        pagado: true
    };
    
    guardarDatos(); // Esto ya llama a actualizarResumenCursosSeguimiento()
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalPago'));
    modal.hide();
    
    mostrarMensaje('Pago registrado exitosamente', 'success');
}

// 2. Función mejorada para editar pagos
function guardarEdicionPago() {
    if (!isAdmin) return;
    
    const curso = document.getElementById('editarCurso').value;
    const index = parseInt(document.getElementById('editarIndex').value);
    const anio = document.getElementById('editarAnio').value;
    const monto = parseFloat(document.getElementById('editarMontoPago').value) || 0;
    const fecha = document.getElementById('editarFechaPago').value;
    const pagado = document.getElementById('editarPagado').checked;
    
    if (!datos.cursos[curso].estudiantes[index].pagos) {
        datos.cursos[curso].estudiantes[index].pagos = {
            2026: { monto: 0, fecha: '', pagado: false },
            2027: { monto: 0, fecha: '', pagado: false }
        };
    }
    
    datos.cursos[curso].estudiantes[index].pagos[anio] = {
        monto: monto,
        fecha: fecha,
        pagado: pagado
    };
    
    guardarDatos(); // Esto ya llama a actualizarResumenCursosSeguimiento()
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarPago'));
    modal.hide();
    
    mostrarMensaje('Pago actualizado exitosamente', 'success');
}

// ============================================
// EJECUTAR AL CARGAR Y CAMBIAR PESTAÑAS
// ============================================

// Asegurar que la función se ejecute al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log("📋 Página cargada - Listo para mostrar cursos");
    
    // Esperar un momento y ejecutar
    setTimeout(() => {
        actualizarResumenCursosSeguimiento();
    }, 1000);
    
    // También ejecutar cuando se haga clic en la pestaña de seguimiento
    const tabSeguimiento = document.querySelector('a[href="#seguimiento"]');
    if (tabSeguimiento) {
        tabSeguimiento.addEventListener('shown.bs.tab', function() {
            console.log("📊 Mostrando pestaña de seguimiento - actualizando");
            actualizarResumenCursosSeguimiento();
        });
    }
});

// También agregar esto a la función actualizarSeguimiento() si existe
function actualizarSeguimiento() {
    console.log("🔄 Actualizando seguimiento completo...");
    // ... (tu código existente de actualizarSeguimiento) ...
    
    // AGREGAR ESTA LÍNEA AL FINAL:
    actualizarResumenCursosSeguimiento();
}

// También mejora los estilos para el seguimiento

// ACTUALIZAR ÚLTIMOS PAGOS SEGUIMIENTO
function actualizarUltimosPagosSeguimiento() {
    const tbody = document.getElementById('tablaUltimosPagosSeguimiento');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Recopilar todos los pagos
    let todosLosPagos = [];
    
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
        if (datosCurso.estudiantes) {
            datosCurso.estudiantes.forEach((estudiante, index) => {
                if (estudiante.pagos) {
                    ['2026', '2027'].forEach(anio => {
                        const pago = estudiante.pagos[anio];
                        if (pago && pago.pagado && pago.fecha && pago.monto > 0) {
                            todosLosPagos.push({
                                curso: cursoNombre,
                                estudiante: estudiante.nombre || `Estudiante ${index + 1}`,
                                anio: anio,
                                monto: pago.monto,
                                fecha: pago.fecha
                            });
                        }
                    });
                }
            });
        }
    }
    
    // Ordenar por fecha
    todosLosPagos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Tomar los últimos 10
    const ultimosPagos = todosLosPagos.slice(0, 10);
    
    if (ultimosPagos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No hay pagos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    ultimosPagos.forEach(pago => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${pago.fecha}</td>
            <td>${pago.curso}</td>
            <td>${pago.estudiante}</td>
            <td>${pago.anio}</td>
            <td class="text-success">Bs ${pago.monto.toFixed(2)}</td>
        `;
        tbody.appendChild(fila);
    });
}

// FILTRAR ESTUDIANTES EN SEGUIMIENTO
function filtrarEstudiantesSeguimiento() {
    const filtroNombre = document.getElementById('filtroEstudiante').value.toLowerCase();
    const filtroCurso = document.getElementById('filtroCursoSeguimiento').value;
    const filtroEstado = document.getElementById('filtroEstadoSeguimiento').value;
    
    const tbody = document.getElementById('tablaSeguimientoEstudiantes');
    if (!tbody) return;
    
    const filas = tbody.querySelectorAll('tr');
    
    filas.forEach(fila => {
        const estudiante = fila.getAttribute('data-estudiante').toLowerCase();
        const curso = fila.getAttribute('data-curso');
        const estado = fila.getAttribute('data-estado');
        
        let mostrar = true;
        
        if (filtroNombre && !estudiante.includes(filtroNombre)) {
            mostrar = false;
        }
        
        if (filtroCurso !== 'todos' && curso !== filtroCurso) {
            mostrar = false;
        }
        
        if (filtroEstado !== 'todos' && estado !== filtroEstado) {
            mostrar = false;
        }
        
        fila.style.display = mostrar ? '' : 'none';
    });
}

function limpiarFiltrosSeguimiento() {
    document.getElementById('filtroEstudiante').value = '';
    document.getElementById('filtroCursoSeguimiento').value = 'todos';
    document.getElementById('filtroAnioSeguimiento').value = 'todos';
    document.getElementById('filtroEstadoSeguimiento').value = 'todos';
    filtrarEstudiantesSeguimiento();
}

// CARGAR ESTUDIANTES PARA OTROS COBROS
function cargarEstudiantesParaOtrosCobros() {
   // Configurar eventos para "Otros Cobros"
const cursoOtroCobro = document.getElementById('cursoOtroCobro');
const sectorCobroSelect = document.getElementById('sectorCobro');

if (cursoOtroCobro) {
    cursoOtroCobro.addEventListener('change', function() {
        // Cargar estudiantes en el select del formulario
        cargarEstudiantesParaOtrosCobros();
        
        // Si hay un sector seleccionado, mostrar la tabla de marcado
        const sectorId = sectorCobroSelect ? sectorCobroSelect.value : null;
        if (sectorId && this.value) {
            setTimeout(() => cargarEstudiantesParaMarcarPagos(), 100);
        }
    });
}

if (sectorCobroSelect) {
    sectorCobroSelect.addEventListener('change', function() {
        // Actualizar monto del sector
        actualizarMontoSector();
        
        // Si hay un curso seleccionado, mostrar la tabla de marcado
        const cursoSeleccionado = cursoOtroCobro ? cursoOtroCobro.value : null;
        if (cursoSeleccionado && this.value) {
            setTimeout(() => cargarEstudiantesParaMarcarPagos(), 100);
        }
    });
}

// Event listeners para filtros
const filtroEstudiante = document.getElementById('filtroEstudiante');
if (filtroEstudiante) {
    filtroEstudiante.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') filtrarEstudiantesSeguimiento();
    });
}
}

// CARGAR CURSO SELECCIONADO
function cargarCursoSeleccionado() {
    const cursoSeleccionado = document.getElementById('selectorCurso').value;
    
    if (!cursoSeleccionado) {
        mostrarMensaje('Seleccione un curso', 'error');
        return;
    }
    
    const monto2026 = obtenerMontoCurso(cursoSeleccionado, '2026');
    const monto2027 = obtenerMontoCurso(cursoSeleccionado, '2027');
    
    document.getElementById('tituloCurso').textContent = `Gestión de Pagos - ${cursoSeleccionado}`;
    
    // Mostrar información de montos (con "NO APLICA" si es 0)
    let infoMontos = '';
    if (monto2026 > 0 && monto2027 > 0) {
        infoMontos = `<span class="text-info">Monto 2026: <strong>Bs ${monto2026}</strong></span> | 
                      <span class="text-warning">Monto 2027: <strong>Bs ${monto2027}</strong></span>`;
    } else if (monto2026 > 0) {
        infoMontos = `<span class="text-info">Monto 2026: <strong>Bs ${monto2026}</strong></span> | 
                      <span class="text-muted">2027: NO APLICA</span>`;
    } else if (monto2027 > 0) {
        infoMontos = `<span class="text-muted">2026: NO APLICA</span> | 
                      <span class="text-warning">Monto 2027: <strong>Bs ${monto2027}</strong></span>`;
    } else {
        infoMontos = `<span class="text-muted">Este curso no tiene cobros programados</span>`;
    }
    
    document.getElementById('infoMontosCurso').innerHTML = infoMontos;
    document.getElementById('contenedorCurso').style.display = 'block';
    
    const datosCurso = datos.cursos[cursoSeleccionado];
    const cuerpoTabla = document.getElementById('cuerpoTablaPagos');
    cuerpoTabla.innerHTML = '';
    
    if (!datosCurso.estudiantes) datosCurso.estudiantes = [];
    
    datosCurso.estudiantes.forEach((estudiante, index) => {
        const totalPagado = Object.values(estudiante.pagos || {}).reduce((total, pago) => total + (pago.pagado ? (pago.monto || 0) : 0), 0);
        
        let deudaTotal = 0;
        if (estudiante.pagos) {
            // Solo calcular deuda si el monto requerido es mayor a 0
            if (monto2026 > 0) {
                if (!estudiante.pagos[2026] || !estudiante.pagos[2026].pagado || estudiante.pagos[2026].monto < monto2026) {
                    deudaTotal += (monto2026 - (estudiante.pagos[2026] && estudiante.pagos[2026].pagado ? estudiante.pagos[2026].monto : 0));
                }
            }
            
            if (monto2027 > 0) {
                if (!estudiante.pagos[2027] || !estudiante.pagos[2027].pagado || estudiante.pagos[2027].monto < monto2027) {
                    deudaTotal += (monto2027 - (estudiante.pagos[2027] && estudiante.pagos[2027].pagado ? estudiante.pagos[2027].monto : 0));
                }
            }
        } else {
            deudaTotal = (monto2026 > 0 ? monto2026 : 0) + (monto2027 > 0 ? monto2027 : 0);
        }
        
        const estado2026 = determinarEstadoPago(
            estudiante.pagos ? estudiante.pagos[2026] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false },
            monto2026
        );
        
        const estado2027 = determinarEstadoPago(
            estudiante.pagos ? estudiante.pagos[2027] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false },
            monto2027
        );
        
        let estadoGeneral = 'al-dia';
        const totalRequerido = (monto2026 > 0 ? monto2026 : 0) + (monto2027 > 0 ? monto2027 : 0);
        
        if (deudaTotal === totalRequerido) {
            estadoGeneral = 'con-deuda';
        } else if (deudaTotal > 0) {
            estadoGeneral = 'parcial';
        }
        
        const fila = document.createElement('tr');
        
        // Determinar qué columnas mostrar
        const mostrar2026 = monto2026 > 0;
        const mostrar2027 = monto2027 > 0;
        
        fila.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <input type="text" class="form-control form-control-sm" value="${estudiante.nombre || `Estudiante ${index + 1}`}" 
                       onchange="${isAdmin ? `actualizarNombreEstudiante('${cursoSeleccionado}', ${index}, this.value)` : ''}"
                       ${!isAdmin ? 'disabled' : ''}>
            </td>
            ${mostrar2026 ? `
            <td>
                ${estudiante.pagos && estudiante.pagos[2026] && estudiante.pagos[2026].pagado ? 
                    'Bs ' + (estudiante.pagos[2026].monto || 0).toFixed(2) : 
                    'Bs 0.00'}
            </td>
            <td>${estudiante.pagos && estudiante.pagos[2026] ? (estudiante.pagos[2026].fecha || '-') : '-'}</td>
            <td>
                <span class="estado-${estado2026}">
                    ${estado2026 === 'pagado' ? 'COMPLETO' : estado2026 === 'deuda' ? 'DEUDA' : 'PARCIAL'}
                </span>
            </td>
            ` : `
            <td colspan="3" class="text-center text-muted">
                <small>No aplica</small>
            </td>
            `}
            ${mostrar2027 ? `
            <td>
                ${estudiante.pagos && estudiante.pagos[2027] && estudiante.pagos[2027].pagado ? 
                    'Bs ' + (estudiante.pagos[2027].monto || 0).toFixed(2) : 
                    'Bs 0.00'}
            </td>
            <td>${estudiante.pagos && estudiante.pagos[2027] ? (estudiante.pagos[2027].fecha || '-') : '-'}</td>
            <td>
                <span class="estado-${estado2027}">
                    ${estado2027 === 'pagado' ? 'COMPLETO' : estado2027 === 'deuda' ? 'DEUDA' : 'PARCIAL'}
                </span>
            </td>
            ` : `
            <td colspan="3" class="text-center text-muted">
                <small>No aplica</small>
            </td>
            `}
            <td class="${totalPagado > 0 ? 'text-success' : 'text-warning'}">Bs ${totalPagado.toFixed(2)}</td>
            <td>
                <span class="estado-${estadoGeneral}">
                    ${estadoGeneral === 'al-dia' ? 'AL DÍA' : estadoGeneral === 'con-deuda' ? 'CON DEUDA' : 'PARCIAL'}
                    ${deudaTotal > 0 ? ` (Bs ${deudaTotal.toFixed(2)})` : ''}
                </span>
            </td>
            <td>
                ${isAdmin ? `
                <button class="btn btn-pago btn-sm" onclick="abrirModalPago('${cursoSeleccionado}', ${index})">
                    <i class="fas fa-money-bill"></i>
                </button>
                ` : ''}
                <button class="btn btn-recibo btn-sm" onclick="generarRecibo('${cursoSeleccionado}', ${index})">
                    <i class="fas fa-receipt"></i>
                </button>
                ${isAdmin ? `
                <button class="btn btn-editar btn-sm" onclick="abrirModalEditarPagoEspecifico('${cursoSeleccionado}', ${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-eliminar-estudiante" onclick="eliminarEstudiante('${cursoSeleccionado}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
        cuerpoTabla.appendChild(fila);
    });
}
// ABRIR MODAL PARA REGISTRAR PAGO
function abrirModalPago(curso, index) {
    if (!isAdmin) return;
    
    document.getElementById('estudianteIndex').value = index;
    document.getElementById('cursoActual').value = curso;
    
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaPago').value = hoy;
    
    const modal = new bootstrap.Modal(document.getElementById('modalPago'));
    modal.show();
}

// ABRIR MODAL PARA EDITAR PAGO ESPECÍFICO POR AÑO
function abrirModalEditarPagoEspecifico(curso, index) {
    if (!isAdmin) return;
    
    document.getElementById('editarCurso').value = curso;
    document.getElementById('editarIndex').value = index;
    
    const anio = prompt('¿Qué año desea editar? (2026, 2027)');
    if (!['2026', '2027'].includes(anio)) {
        mostrarMensaje('Año inválido', 'error');
        return;
    }
    
    const estudiante = datos.cursos[curso].estudiantes[index];
    const pago = estudiante.pagos ? estudiante.pagos[anio] : { monto: 0, fecha: '', pagado: false };
    
    document.getElementById('editarAnio').value = anio;
    document.getElementById('editarMontoPago').value = pago.monto || 0;
    document.getElementById('editarFechaPago').value = pago.fecha || '';
    document.getElementById('editarPagado').checked = pago.pagado || false;
    
    const modal = new bootstrap.Modal(document.getElementById('modalEditarPago'));
    modal.show();
}

// GUARDAR EDICIÓN DE PAGO
function guardarEdicionPago() {
    if (!isAdmin) return;
    
    const curso = document.getElementById('editarCurso').value;
    const index = parseInt(document.getElementById('editarIndex').value);
    const anio = document.getElementById('editarAnio').value;
    const monto = parseFloat(document.getElementById('editarMontoPago').value) || 0;
    const fecha = document.getElementById('editarFechaPago').value;
    const pagado = document.getElementById('editarPagado').checked;
    
    if (!datos.cursos[curso].estudiantes[index].pagos) {
        datos.cursos[curso].estudiantes[index].pagos = {
            2026: { monto: 0, fecha: '', pagado: false },
            2027: { monto: 0, fecha: '', pagado: false }
        };
    }
    
    datos.cursos[curso].estudiantes[index].pagos[anio] = {
        monto: monto,
        fecha: fecha,
        pagado: pagado
    };
    
    guardarDatos();
    actualizarDashboard();
    actualizarResumenAportesCursos();
    actualizarDetalleCajaFuerte();
    cargarCursoSeleccionado();
    actualizarSeguimiento();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarPago'));
    modal.hide();
    
    mostrarMensaje('Pago actualizado exitosamente', 'success');
}

// REGISTRAR PAGO DE ESTUDIANTE
function registrarPagoEstudiante() {
    if (!isAdmin) return;
    
    const curso = document.getElementById('cursoActual').value;
    const index = parseInt(document.getElementById('estudianteIndex').value);
    const anio = document.getElementById('anioPago').value;
    const monto = parseFloat(document.getElementById('montoPago').value) || 0;
    const fecha = document.getElementById('fechaPago').value;
    
    if (!curso || isNaN(index) || !anio || !monto || !fecha) {
        mostrarMensaje('Complete todos los campos', 'error');
        return;
    }
    
    if (!datos.cursos[curso].estudiantes[index].pagos) {
        datos.cursos[curso].estudiantes[index].pagos = {
            2026: { monto: 0, fecha: '', pagado: false },
            2027: { monto: 0, fecha: '', pagado: false }
        };
    }
    
    datos.cursos[curso].estudiantes[index].pagos[anio] = {
        monto: monto,
        fecha: fecha,
        pagado: true
    };
    
    guardarDatos();
    actualizarDashboard();
    actualizarResumenAportesCursos();
    actualizarDetalleCajaFuerte();
    cargarCursoSeleccionado();
    actualizarSeguimiento();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalPago'));
    modal.hide();
    
    mostrarMensaje('Pago registrado exitosamente', 'success');
}

// ACTUALIZAR NOMBRE DE ESTUDIANTE
function actualizarNombreEstudiante(curso, index, nuevoNombre) {
    if (!isAdmin) return;
    
    datos.cursos[curso].estudiantes[index].nombre = nuevoNombre;
    guardarDatos();
    mostrarMensaje('Nombre actualizado', 'success');
}

// ELIMINAR ESTUDIANTE
function eliminarEstudiante(curso, index) {
    if (!isAdmin) return;
    
    if (confirm('¿Está seguro de eliminar este estudiante?')) {
        datos.cursos[curso].estudiantes.splice(index, 1);
        guardarDatos();
        cargarCursoSeleccionado();
        actualizarSeguimiento();
        mostrarMensaje('Estudiante eliminado', 'success');
    }
}

// ELIMINAR ÚLTIMO ESTUDIANTE
function eliminarUltimoEstudiante() {
    if (!isAdmin) return;
    
    const cursoSeleccionado = document.getElementById('selectorCurso').value;
    if (!cursoSeleccionado) {
        mostrarMensaje('Seleccione un curso primero', 'error');
        return;
    }
    
    const datosCurso = datos.cursos[cursoSeleccionado];
    if (datosCurso.estudiantes.length === 0) {
        mostrarMensaje('No hay estudiantes para eliminar', 'error');
        return;
    }
    
    if (confirm('¿Está seguro de eliminar el último estudiante?')) {
        datosCurso.estudiantes.pop();
        guardarDatos();
        cargarCursoSeleccionado();
        actualizarSeguimiento();
        mostrarMensaje('Estudiante eliminado', 'success');
    }
}

// AGREGAR ESTUDIANTE
function agregarEstudiante() {
    if (!isAdmin) return;
    
    const cursoSeleccionado = document.getElementById('selectorCurso').value;
    if (!cursoSeleccionado) {
        mostrarMensaje('Seleccione un curso primero', 'error');
        return;
    }
    
    const nuevoIndex = datos.cursos[cursoSeleccionado].estudiantes.length;
    
    datos.cursos[cursoSeleccionado].estudiantes.push({
        nombre: `Nuevo Estudiante ${nuevoIndex + 1}`,
        pagos: {
            2026: { monto: 0, fecha: '', pagado: false },
            2027: { monto: 0, fecha: '', pagado: false }
        }
    });
    
    guardarDatos();
    cargarCursoSeleccionado();
    actualizarSeguimiento();
    mostrarMensaje('Estudiante agregado', 'success');
}

// REGISTRAR GASTO
function registrarGasto(e) {
    e.preventDefault();
    
    if (!isAdmin) return;
    
    const categoria = document.getElementById('categoria').value;
    const montoGasto = parseFloat(document.getElementById('montoGasto').value) || 0;
    const fechaGasto = document.getElementById('fechaGasto').value;
    const descripcion = document.getElementById('descripcion').value;
    const comprobanteInput = document.getElementById('comprobante');
    
    if (!categoria || !montoGasto || !fechaGasto || !descripcion) {
        mostrarMensaje('Complete todos los campos', 'error');
        return;
    }
    
    if (isNaN(montoGasto) || montoGasto <= 0) {
        mostrarMensaje('Ingrese un monto válido', 'error');
        return;
    }
    
    const nuevoGasto = {
        id: Date.now(),
        categoria: categoria,
        monto: montoGasto,
        fecha: fechaGasto,
        descripcion: descripcion,
        comprobante: null
    };
    
    if (comprobanteInput.files && comprobanteInput.files[0]) {
        const file = comprobanteInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            nuevoGasto.comprobante = {
                nombre: file.name,
                tipo: file.type,
                datos: e.target.result.split(',')[1]
            };
            
            datos.gastos.push(nuevoGasto);
            guardarDatos();
            actualizarDashboard();
            actualizarTablaGastos();
            actualizarDetalleCajaFuerte();
            actualizarSeguimiento();
            
            document.getElementById('formGasto').reset();
            const hoy = new Date().toISOString().split('T')[0];
            document.getElementById('fechaGasto').value = hoy;
            
            mostrarMensaje('Gasto registrado exitosamente con comprobante', 'success');
        };
        
        reader.onerror = function() {
            mostrarMensaje('Error al leer el archivo', 'error');
        };
        
        reader.readAsDataURL(file);
    } else {
        datos.gastos.push(nuevoGasto);
        guardarDatos();
        actualizarDashboard();
        actualizarTablaGastos();
        actualizarDetalleCajaFuerte();
        actualizarSeguimiento();
        
        document.getElementById('formGasto').reset();
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaGasto').value = hoy;
        
        mostrarMensaje('Gasto registrado exitosamente', 'success');
    }
}

// REGISTRAR MOVIMIENTO DE CAJA
function registrarMovimientoCaja(e) {
    e.preventDefault();
    e.stopPropagation(); // ← TAMBIÉN AGREGAR ESTA
    
    if (!isAdmin) return;
    
    const tipoMovimiento = document.getElementById('tipoMovimiento').value;
    const montoCaja = parseFloat(document.getElementById('montoCaja').value) || 0;
    const fechaCaja = document.getElementById('fechaCaja').value;
    const conceptoCaja = document.getElementById('conceptoCaja').value;
    

    
    if (!tipoMovimiento || !montoCaja || !fechaCaja || !conceptoCaja) {
        mostrarMensaje('Complete todos los campos', 'error');
        return;
    }
    
    if (isNaN(montoCaja) || montoCaja <= 0) {
        mostrarMensaje('Ingrese un monto válido', 'error');
        return;
    }
    
    const nuevoMovimiento = {
        id: Date.now(),
        tipo: tipoMovimiento,
        monto: montoCaja,
        fecha: fechaCaja,
        concepto: conceptoCaja
    };
    
    datos.movimientosCaja.push(nuevoMovimiento);
    
    if (tipoMovimiento === 'ingreso') {
        datos.totalIngresosCaja += montoCaja;
    } else {
        datos.totalEgresosCaja += montoCaja;
    }
    
    guardarDatos();
    actualizarDashboard();
    actualizarTablaMovimientosCaja();
    actualizarDetalleCajaFuerte();
    actualizarSeguimiento();
    
    document.getElementById('formMovimientoCaja').reset();
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaCaja').value = hoy;
    
    mostrarMensaje('Movimiento de caja registrado exitosamente', 'success');
}

// ABRIR MODAL PARA EDITAR MOVIMIENTO DE CAJA
function abrirModalEditarCaja(id) {
    if (!isAdmin) return;
    
    const movimiento = datos.movimientosCaja.find(mov => mov.id === id);
    if (!movimiento) return;
    
    document.getElementById('editarIdCaja').value = id;
    document.getElementById('editarTipoCaja').value = movimiento.tipo;
    document.getElementById('editarMontoCaja').value = movimiento.monto || 0;
    document.getElementById('editarFechaCaja').value = movimiento.fecha || '';
    document.getElementById('editarConceptoCaja').value = movimiento.concepto || '';
    
    const modal = new bootstrap.Modal(document.getElementById('modalEditarCaja'));
    modal.show();
}

// GUARDAR EDICIÓN DE MOVIMIENTO DE CAJA
function guardarEdicionCaja() {
    if (!isAdmin) return;
    
    const id = parseInt(document.getElementById('editarIdCaja').value);
    const tipo = document.getElementById('editarTipoCaja').value;
    const monto = parseFloat(document.getElementById('editarMontoCaja').value) || 0;
    const fecha = document.getElementById('editarFechaCaja').value;
    const concepto = document.getElementById('editarConceptoCaja').value;
    
    const movimiento = datos.movimientosCaja.find(mov => mov.id === id);
    if (!movimiento) return;
    
    // Restar el monto anterior de los totales
    if (movimiento.tipo === 'ingreso') {
        datos.totalIngresosCaja -= movimiento.monto || 0;
    } else {
        datos.totalEgresosCaja -= movimiento.monto || 0;
    }
    
    // Actualizar movimiento
    movimiento.tipo = tipo;
    movimiento.monto = monto;
    movimiento.fecha = fecha;
    movimiento.concepto = concepto;
    
    // Sumar el nuevo monto a los totales
    if (tipo === 'ingreso') {
        datos.totalIngresosCaja += monto;
    } else {
        datos.totalEgresosCaja += monto;
    }
    
    guardarDatos();
    actualizarDashboard();
    actualizarTablaMovimientosCaja();
    actualizarDetalleCajaFuerte();
    actualizarSeguimiento();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarCaja'));
    modal.hide();
    
    mostrarMensaje('Movimiento actualizado exitosamente', 'success');
}

// CREAR NUEVO SECTOR DE COBRO
function crearNuevoSector(e) {
    e.preventDefault();
    
    if (!isAdmin) return;
    
    const nombre = document.getElementById('nombreSector').value;
    const monto = parseFloat(document.getElementById('montoSector').value) || 0;
    const fechaLimite = document.getElementById('fechaLimiteSector').value;
    const descripcion = document.getElementById('descripcionSector').value;
    
    if (!nombre || !monto || !fechaLimite || !descripcion) {
        mostrarMensaje('Complete todos los campos', 'error');
        return;
    }
    
    const nuevoSector = {
        id: Date.now(),
        nombre: nombre,
        monto: monto,
        fechaLimite: fechaLimite,
        descripcion: descripcion,
        cobros: [],
        fechaCreacion: new Date().toISOString().split('T')[0]
    };
    
    datos.sectoresCobro.push(nuevoSector);
    guardarDatos();
    actualizarSectoresCobro();
    
    document.getElementById('formNuevoSector').reset();
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaLimiteSector').value = hoy;
    
    mostrarMensaje('Sector de cobro creado exitosamente', 'success');
}

// ACTUALIZAR SECTORES DE COBRO
function actualizarSectoresCobro() {
    const listaSectores = document.getElementById('listaSectoresCobro');
    const selectSector = document.getElementById('sectorCobro');
    
    if (!listaSectores || !selectSector) return;
    
    listaSectores.innerHTML = '';
    selectSector.innerHTML = '<option value="">Seleccione sector</option>';
    
    if (datos.sectoresCobro.length === 0) {
        listaSectores.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-inbox fa-2x mb-2"></i>
                <p>No hay sectores de cobro creados</p>
                <p class="small">Crea tu primer sector de cobro</p>
            </div>
        `;
        return;
    }
    
    datos.sectoresCobro.forEach(sector => {
        // Calcular estadísticas del sector
        const totalCobrado = sector.cobros.reduce((total, cobro) => total + (cobro.monto || 0), 0);
        const totalEsperado = Object.values(datos.cursos).reduce((total, curso) => total + (curso.estudiantes?.length || 0), 0) * sector.monto;
        const porcentaje = totalEsperado > 0 ? Math.round((totalCobrado / totalEsperado) * 100) : 0;
        
        // Agregar a la lista
        const sectorDiv = document.createElement('div');
        sectorDiv.className = 'sector-cobro mb-3 p-3';
        sectorDiv.style.border = '1px solid #00ffff';
        sectorDiv.style.borderRadius = '8px';
        sectorDiv.style.background = 'rgba(0, 255, 255, 0.1)';
        
        sectorDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="neon-text">${sector.nombre}</h6>
                    <p class="mb-1"><small>${sector.descripcion}</small></p>
                    <p class="mb-1"><small><strong>Monto:</strong> Bs ${sector.monto.toFixed(2)}</small></p>
                    <p class="mb-1"><small><strong>Fecha límite:</strong> ${sector.fechaLimite}</small></p>
                    <p class="mb-1"><small><strong>Creado:</strong> ${sector.fechaCreacion}</small></p>
                </div>
                <div class="text-end">
                    <div class="mb-2">
                        <span class="badge bg-success">Bs ${totalCobrado.toFixed(2)}</span>
                        <small class="text-muted"> / Bs ${totalEsperado.toFixed(2)}</small>
                    </div>
                    <div class="progress" style="height: 5px; width: 100px;">
                        <div class="progress-bar bg-success" style="width: ${porcentaje}%"></div>
                    </div>
                    <small>${porcentaje}% completado</small>
                </div>
            </div>
            <div class="mt-2">
                <button class="btn btn-sm btn-info" onclick="verReporteSector(${sector.id})">
                    <i class="fas fa-file-pdf"></i> Reporte
                </button>
                ${isAdmin ? `
                <button class="btn btn-sm btn-warning" onclick="editarSector(${sector.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarSector(${sector.id})">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </div>
        `;
        
        listaSectores.appendChild(sectorDiv);
        
        // Agregar al select
        const option = document.createElement('option');
        option.value = sector.id;
        option.textContent = `${sector.nombre} (Bs ${sector.monto})`;
        selectSector.appendChild(option);
    });
}

// ACTUALIZAR MONTO SECTOR
function actualizarMontoSector() {
    const sectorId = parseInt(document.getElementById('sectorCobro').value);
    if (!sectorId) return;
    
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    if (!sector) return;
    
    // El monto ya está en el select, no necesita actualización
}

// REGISTRAR OTRO COBRO
function registrarOtroCobro(e) {
    e.preventDefault();
    
    if (!isAdmin) return;
    
    const sectorId = parseInt(document.getElementById('sectorCobro').value);
    const curso = document.getElementById('cursoOtroCobro').value;
    const estudianteIndex = document.getElementById('estudianteOtroCobro').value;
    const fecha = document.getElementById('fechaOtroCobro').value;
    const observaciones = document.getElementById('observacionesOtroCobro').value;
    
    if (!sectorId || !curso || !estudianteIndex || !fecha) {
        mostrarMensaje('Complete todos los campos', 'error');
        return;
    }
    
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    if (!sector) {
        mostrarMensaje('Sector no encontrado', 'error');
        return;
    }
    
    const estudiante = datos.cursos[curso].estudiantes[estudianteIndex];
    
    // Verificar si ya está pagado
    const nombreEstudiante = estudiante.nombre || `Estudiante ${parseInt(estudianteIndex) + 1}`;
    const yaPago = sector.cobros.some(cobro => 
        cobro.curso === curso && cobro.estudiante === nombreEstudiante
    );
    
    if (yaPago) {
        mostrarMensaje('Este estudiante ya está registrado como pagado en este sector', 'warning');
        return;
    }
    
    const nuevoCobro = {
        id: Date.now(),
        curso: curso,
        estudiante: nombreEstudiante,
        monto: sector.monto,
        fecha: fecha,
        observaciones: observaciones,
        timestamp: Date.now()
    };
    
    sector.cobros.push(nuevoCobro);
    datos.totalOtrosCobros += sector.monto;

    if (!datos.otrosCobrosIngresos) datos.otrosCobrosIngresos = 0;
datos.otrosCobrosIngresos += sector.monto;
    
    guardarDatos();
    actualizarSectoresCobro();
    actualizarTotalOtrosCobros();
    
    // Actualizar la vista de marcado si está activa
    if (document.getElementById('contenedorMarcarPagos') && 
        document.getElementById('contenedorMarcarPagos').style.display !== 'none') {
        cargarEstudiantesParaMarcarPagos();
    }
    
    document.getElementById('formOtroCobro').reset();
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaOtroCobro').value = hoy;
    
    mostrarMensaje('Cobro registrado exitosamente', 'success');
}

// VER REPORTE SECTOR
function verReporteSector(sectorId) {
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    if (!sector) return;
    
    // Generar PDF del sector
    generarReporteSectorPDF(sector);
}

// EDITAR SECTOR
function editarSector(sectorId) {
    if (!isAdmin) return;
    
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    if (!sector) return;
    
    const nuevoNombre = prompt('Nuevo nombre del sector:', sector.nombre);
    if (nuevoNombre !== null) {
        sector.nombre = nuevoNombre;
        
        const nuevoMonto = parseFloat(prompt('Nuevo monto por estudiante:', sector.monto));
        if (!isNaN(nuevoMonto) && nuevoMonto > 0) {
            sector.monto = nuevoMonto;
        }
        
        guardarDatos();
        actualizarSectoresCobro();
        mostrarMensaje('Sector actualizado', 'success');
    }
}

// ELIMINAR SECTOR
function eliminarSector(sectorId) {
    if (!isAdmin) return;
    
    if (confirm('¿Está seguro de eliminar este sector? Todos los cobros asociados se perderán.')) {
        const index = datos.sectoresCobro.findIndex(s => s.id === sectorId);
        if (index !== -1) {
            datos.sectoresCobro.splice(index, 1);
            guardarDatos();
            actualizarSectoresCobro();
            mostrarMensaje('Sector eliminado', 'success');
        }
    }
}

// REGISTRAR EVENTO
function registrarEvento(e) {
    e.preventDefault();
    
    if (!isAdmin) return;
    
    const titulo = document.getElementById('tituloEvento').value;
    const descripcion = document.getElementById('descripcionEvento').value;
    const fecha = document.getElementById('fechaEvento').value;
    const lugar = document.getElementById('lugarEvento').value;
    const fotosInput = document.getElementById('fotosEvento');
    
    if (!titulo || !descripcion || !fecha) {
        mostrarMensaje('Complete todos los campos obligatorios', 'error');
        return;
    }
    
    const nuevoEvento = {
        id: Date.now(),
        titulo: titulo,
        descripcion: descripcion,
        fecha: fecha,
        lugar: lugar || 'No especificado',
        fotos: [],
        fechaPublicacion: new Date().toISOString().split('T')[0]
    };
    
    if (fotosInput.files && fotosInput.files.length > 0) {
        const promises = [];
        
        for (let i = 0; i < fotosInput.files.length; i++) {
            const file = fotosInput.files[i];
            const promise = new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    resolve({
                        nombre: file.name,
                        tipo: file.type,
                        datos: e.target.result.split(',')[1]
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            promises.push(promise);
        }
        
        Promise.all(promises).then(fotos => {
            nuevoEvento.fotos = fotos;
            datos.eventos.push(nuevoEvento);
            guardarDatos();
            actualizarEventos();
            
            document.getElementById('formEvento').reset();
            const hoy = new Date().toISOString().split('T')[0];
            document.getElementById('fechaEvento').value = hoy;
            
            mostrarMensaje('Evento publicado exitosamente con ' + fotos.length + ' fotos', 'success');
        }).catch(error => {
            console.error('Error al cargar fotos:', error);
            mostrarMensaje('Error al cargar algunas fotos', 'error');
        });
    } else {
        datos.eventos.push(nuevoEvento);
        guardarDatos();
        actualizarEventos();
        
        document.getElementById('formEvento').reset();
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaEvento').value = hoy;
        
        mostrarMensaje('Evento publicado exitosamente', 'success');
    }
}

// ACTUALIZAR EVENTOS MEJORADO
function actualizarEventos() {
    const listaEventos = document.getElementById('listaEventos');
    if (!listaEventos) return;
    
    if (datos.eventos.length === 0) {
        listaEventos.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-calendar-plus fa-3x mb-3"></i>
                <p>No hay eventos publicados aún</p>
                <p class="small">¡Sé el primero en publicar un evento!</p>
            </div>
        `;
        return;
    }
    
    listaEventos.innerHTML = '';
    
    const eventosOrdenados = [...datos.eventos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    eventosOrdenados.forEach(evento => {
        const eventoDiv = document.createElement('div');
        eventoDiv.className = 'evento-card-mejorado';
        
        let fotosHTML = '';
        if (evento.fotos && evento.fotos.length > 0) {
            fotosHTML = '<div class="evento-imagenes mt-2">';
            evento.fotos.forEach((foto, index) => {
                if (index < 3) { // Mostrar máximo 3 fotos
                    fotosHTML += `
                        <img src="data:${foto.tipo};base64,${foto.datos}" 
                             alt="${foto.nombre}" 
                             class="evento-imagen"
                             style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; margin-right: 5px; cursor: pointer;"
                             onclick="ampliarImagen('data:${foto.tipo};base64,${foto.datos}')">
                    `;
                }
            });
            fotosHTML += '</div>';
            if (evento.fotos.length > 3) {
                fotosHTML += `<p class="fotos-count mt-1"><i class="fas fa-camera"></i> ${evento.fotos.length} foto(s)</p>`;
            }
        }
        
        eventoDiv.innerHTML = `
            <div class="evento-fecha-mejorada">
                <i class="fas fa-calendar-alt"></i> ${evento.fecha}
                ${evento.lugar ? `<span class="ms-3"><i class="fas fa-map-marker-alt"></i> ${evento.lugar}</span>` : ''}
            </div>
            <div class="evento-titulo-mejorado">${evento.titulo}</div>
            <div class="evento-descripcion-mejorada">${evento.descripcion}</div>
            ${fotosHTML}
            <div class="text-end mt-3">
                <small class="text-muted"><i class="fas fa-clock"></i> Publicado: ${evento.fechaPublicacion || 'Hoy'}</small>
                ${isAdmin ? `
                <button class="btn btn-danger btn-sm ms-2" onclick="eliminarEvento(${evento.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
                ` : ''}
            </div>
        `;
        
        listaEventos.appendChild(eventoDiv);
    });
}

// FUNCIONES PARA ELIMINAR REGISTROS
function eliminarGasto(id) {
    if (!isAdmin) return;
    
    if (confirm('¿Está seguro de eliminar este gasto?')) {
        const index = datos.gastos.findIndex(gasto => gasto.id === id);
        if (index !== -1) {
            const gasto = datos.gastos[index];
            datos.gastos.splice(index, 1);
            
            actualizarDashboard();
            actualizarDetalleCajaFuerte();
            actualizarSeguimiento();
            
            guardarDatos();
            actualizarTablaGastos();
            mostrarMensaje('Gasto eliminado y dashboard actualizado', 'success');
        }
    }
}

function eliminarMovimientoCaja(id) {
    if (!isAdmin) return;
    
    if (confirm('¿Está seguro de eliminar este movimiento?')) {
        const index = datos.movimientosCaja.findIndex(mov => mov.id === id);
        if (index !== -1) {
            const movimiento = datos.movimientosCaja[index];
            
            if (movimiento.tipo === 'ingreso') {
                datos.totalIngresosCaja -= movimiento.monto || 0;
            } else {
                datos.totalEgresosCaja -= movimiento.monto || 0;
            }
            
            datos.movimientosCaja.splice(index, 1);
            
            actualizarDashboard();
            actualizarDetalleCajaFuerte();
            actualizarSeguimiento();
            
            guardarDatos();
            actualizarTablaMovimientosCaja();
            mostrarMensaje('Movimiento eliminado y dashboard actualizado', 'success');
        }
    }
}

function eliminarEvento(id) {
    if (!isAdmin) return;
    
    if (confirm('¿Está seguro de eliminar este evento?')) {
        const index = datos.eventos.findIndex(evento => evento.id === id);
        if (index !== -1) {
            datos.eventos.splice(index, 1);
            guardarDatos();
            actualizarEventos();
            mostrarMensaje('Evento eliminado', 'success');
        }
    }
}

// ACTUALIZAR TOTAL DE OTROS COBROS
function actualizarTotalOtrosCobros() {
    let total = 0;
    datos.sectoresCobro.forEach(sector => {
        total += sector.cobros.reduce((sum, cobro) => sum + (cobro.monto || 0), 0);
    });
    datos.totalOtrosCobros = total;
    
    if (document.getElementById('totalOtrosCobros')) {
        document.getElementById('totalOtrosCobros').textContent = `Bs ${total.toFixed(2)}`;
    }
}

// INICIALIZACIÓN DE GRÁFICOS
let graficoGastos = null;
let graficoComparativo = null;
let graficoEvolucionAnual = null;

function inicializarGraficos() {
    if (graficoGastos) graficoGastos.destroy();
    if (graficoComparativo) graficoComparativo.destroy();
    if (graficoEvolucionAnual) graficoEvolucionAnual.destroy();
    
    const ctxGastos = document.getElementById('graficoGastos');
    if (ctxGastos) {
        graficoGastos = new Chart(ctxGastos.getContext('2d'), {
            type: 'pie',
            data: obtenerDatosGraficoGastos(),
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { 
                            color: '#ffffff', 
                            font: { size: 11, weight: 'bold' },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: Bs ${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    const ctxComparativo = document.getElementById('graficoComparativo');
    if (ctxComparativo) {
        graficoComparativo = new Chart(ctxComparativo.getContext('2d'), {
            type: 'bar',
            data: obtenerDatosGraficoComparativo(),
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                }
            }
        });
    }
    
    const ctxEvolucionAnual = document.getElementById('graficoEvolucionAnual');
    if (ctxEvolucionAnual) {
        graficoEvolucionAnual = new Chart(ctxEvolucionAnual.getContext('2d'), {
            type: 'line',
            data: obtenerDatosGraficoEvolucionAnual(),
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                }
            }
        });
    }
}

function obtenerDatosGraficoGastos() {
    const filtroAnio = document.getElementById('filtroAnio') ? document.getElementById('filtroAnio').value : 'todos';
    const filtroMes = document.getElementById('filtroMes') ? document.getElementById('filtroMes').value : 'todos';
    
    const categorias = ['viajes', 'compras', 'cefom', 'inscripciones', 'talleres', 'otros'];
    const nombresCategorias = {
        'viajes': 'Viajes',
        'compras': 'Compras',
        'cefom': 'CEFOM',
        'inscripciones': 'Inscripciones',
        'talleres': 'Talleres',
        'otros': 'Otros'
    };
    
    const datosCategorias = {};
    categorias.forEach(cat => datosCategorias[cat] = 0);
    
    datos.gastos.forEach(gasto => {
        // Filtrar por año
        if (filtroAnio !== 'todos') {
            try {
                const fecha = new Date(gasto.fecha);
                const anioGasto = fecha.getFullYear().toString();
                if (anioGasto !== filtroAnio) return;
            } catch (e) {
                return;
            }
        }
        
        // Filtrar por mes
        if (filtroMes !== 'todos') {
            try {
                const fecha = new Date(gasto.fecha);
                const mesGasto = (fecha.getMonth() + 1).toString();
                if (mesGasto !== filtroMes) return;
            } catch (e) {
                return;
            }
        }
        
        if (datosCategorias.hasOwnProperty(gasto.categoria)) {
            datosCategorias[gasto.categoria] += gasto.monto || 0;
        }
    });
    
    return {
        labels: categorias.map(cat => nombresCategorias[cat]),
        datasets: [{
            data: categorias.map(cat => datosCategorias[cat]),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ],
            borderColor: '#fff',
            borderWidth: 2
        }]
    };
}

function obtenerDatosGraficoComparativo() {
    const filtroAnio = document.getElementById('filtroAnio') ? document.getElementById('filtroAnio').value : 'todos';
    
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const datosAportes = new Array(12).fill(0);
    const datosGastos = new Array(12).fill(0);
    
    // Calcular aportes por mes (de la pestaña Cursos)
    for (const curso of Object.values(datos.cursos)) {
        if (curso.estudiantes) {
            for (const estudiante of curso.estudiantes) {
                if (estudiante.pagos) {
                    ['2026', '2027'].forEach(anio => {
                        const pago = estudiante.pagos[anio];
                        if (pago && pago.pagado && pago.fecha && pago.monto > 0) {
                            try {
                                const fecha = new Date(pago.fecha);
                                if (!isNaN(fecha)) {
                                    const anioPago = fecha.getFullYear().toString();
                                    const mes = fecha.getMonth();
                                    
                                    if (filtroAnio === 'todos' || anioPago === filtroAnio) {
                                        if (mes >= 0 && mes < 12) {
                                            datosAportes[mes] += pago.monto || 0;
                                        }
                                    }
                                }
                            } catch (e) {}
                        }
                    });
                }
            }
        }
    }
    
    // Calcular gastos por mes
    datos.gastos.forEach(gasto => {
        try {
            const fecha = new Date(gasto.fecha);
            if (!isNaN(fecha)) {
                const anio = fecha.getFullYear().toString();
                const mes = fecha.getMonth();
                
                if (filtroAnio === 'todos' || anio === filtroAnio) {
                    if (mes >= 0 && mes < 12) {
                        datosGastos[mes] += gasto.monto || 0;
                    }
                }
            }
        } catch (e) {}
    });
    
    return {
        labels: meses,
        datasets: [
            {
                label: 'Aportes (Bs)',
                data: datosAportes,
                backgroundColor: 'rgba(0, 255, 0, 0.6)',
                borderColor: 'rgba(0, 255, 0, 1)',
                borderWidth: 1
            },
            {
                label: 'Gastos (Bs)',
                data: datosGastos,
                backgroundColor: 'rgba(255, 0, 0, 0.6)',
                borderColor: 'rgba(255, 0, 0, 1)',
                borderWidth: 1
            }
        ]
    };
}

function obtenerDatosGraficoEvolucionAnual() {
    const años = ['2025', '2026', '2027'];
    const datosAportes = [0, 0, 0];
    const datosGastos = [0, 0, 0];
    
    // Calcular aportes por año
    for (const curso of Object.values(datos.cursos)) {
        if (curso.estudiantes) {
            for (const estudiante of curso.estudiantes) {
                if (estudiante.pagos) {
                    ['2026', '2027'].forEach(anio => {
                        const pago = estudiante.pagos[anio];
                        if (pago && pago.pagado && pago.monto > 0) {
                            const index = años.indexOf(anio);
                            if (index !== -1) {
                                datosAportes[index] += pago.monto || 0;
                            }
                        }
                    });
                }
            }
        }
    }
    
    // Calcular gastos por año
    datos.gastos.forEach(gasto => {
        try {
            const fecha = new Date(gasto.fecha);
            if (!isNaN(fecha)) {
                const anio = fecha.getFullYear().toString();
                const index = años.indexOf(anio);
                if (index !== -1) {
                    datosGastos[index] += gasto.monto || 0;
                }
            }
        } catch (e) {}
    });
    
    return {
        labels: años,
        datasets: [
            {
                label: 'Aportes (Bs)',
                data: datosAportes,
                borderColor: 'rgba(0, 255, 0, 0.8)',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Gastos (Bs)',
                data: datosGastos,
                borderColor: 'rgba(255, 0, 0, 0.8)',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };
}

function actualizarGraficos() {
    if (graficoGastos) {
        graficoGastos.data = obtenerDatosGraficoGastos();
        graficoGastos.update();
    }
    
    if (graficoComparativo) {
        graficoComparativo.data = obtenerDatosGraficoComparativo();
        graficoComparativo.update();
    }
    
    if (graficoEvolucionAnual) {
        graficoEvolucionAnual.data = obtenerDatosGraficoEvolucionAnual();
        graficoEvolucionAnual.update();
    }
}

function actualizarReportes() {
    actualizarGraficos();
    actualizarReporteMensual();
}

// ACTUALIZAR REPORTE MENSUAL
function actualizarReporteMensual() {
    actualizarReporteMensualPorAnio('2025', 'tablaReporteMensual2025');
    actualizarReporteMensualPorAnio('2026', 'tablaReporteMensual2026');
    actualizarReporteMensualPorAnio('2027', 'tablaReporteMensual2027');
}

function actualizarReporteMensualPorAnio(anio, tablaId) {
    const tabla = document.getElementById(tablaId);
    if (!tabla) return;
    
    tabla.innerHTML = '';
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    let totalAportes = 0;
    let totalGastos = 0;
    
    meses.forEach((mes, index) => {
        const mesNum = index + 1;
        
        let aportesMes = 0;
        // Calcular aportes del mes (de la pestaña Cursos)
        for (const curso of Object.values(datos.cursos)) {
            if (curso.estudiantes) {
                for (const estudiante of curso.estudiantes) {
                    if (estudiante.pagos) {
                        const pago = estudiante.pagos[anio];
                        if (pago && pago.pagado && pago.fecha && pago.monto > 0) {
                            try {
                                const fecha = new Date(pago.fecha);
                                if (!isNaN(fecha)) {
                                    const anioPago = fecha.getFullYear().toString();
                                    const mesPago = fecha.getMonth() + 1;
                                    if (anioPago === anio && mesPago === mesNum) {
                                        aportesMes += pago.monto || 0;
                                    }
                                }
                            } catch (e) {}
                        }
                    }
                }
            }
        }
        
        let gastosMes = 0;
        datos.gastos.forEach(gasto => {
            try {
                const fecha = new Date(gasto.fecha);
                if (!isNaN(fecha)) {
                    const anioGasto = fecha.getFullYear().toString();
                    const mesGasto = fecha.getMonth() + 1;
                    if (anioGasto === anio && mesGasto === mesNum) {
                        gastosMes += gasto.monto || 0;
                    }
                }
            } catch (e) {}
        });
        
        totalAportes += aportesMes;
        totalGastos += gastosMes;
        
        const fila = document.createElement('tr');
        
        if (anio === '2025') {
            // Solo gastos para 2025
            fila.innerHTML = `
                <td><strong>${mes}</strong></td>
                <td class="text-danger">Bs ${gastosMes.toFixed(2)}</td>
                <td class="text-danger">Bs ${gastosMes.toFixed(2)}</td>
            `;
        } else {
            // Aportes y gastos para 2026 y 2027
            const balanceMes = aportesMes - gastosMes;
            fila.innerHTML = `
                <td><strong>${mes}</strong></td>
                <td class="text-success">Bs ${aportesMes.toFixed(2)}</td>
                <td class="text-danger">Bs ${gastosMes.toFixed(2)}</td>
                <td class="${balanceMes >= 0 ? 'text-success' : 'text-danger'}"><strong>Bs ${balanceMes.toFixed(2)}</strong></td>
            `;
        }
        
        tabla.appendChild(fila);
    });
    
    // Agregar fila de total
    const filaTotal = document.createElement('tr');
    filaTotal.className = 'table-primary';
    
    if (anio === '2025') {
        filaTotal.innerHTML = `
            <td><strong>TOTAL ${anio}</strong></td>
            <td><strong class="text-danger">Bs ${totalGastos.toFixed(2)}</strong></td>
            <td><strong class="text-danger">Bs ${totalGastos.toFixed(2)}</strong></td>
        `;
    } else {
        const balanceTotal = totalAportes - totalGastos;
        filaTotal.innerHTML = `
            <td><strong>TOTAL ${anio}</strong></td>
            <td><strong class="text-success">Bs ${totalAportes.toFixed(2)}</strong></td>
            <td><strong class="text-danger">Bs ${totalGastos.toFixed(2)}</strong></td>
            <td><strong class="${balanceTotal >= 0 ? 'text-success' : 'text-danger'}">Bs ${balanceTotal.toFixed(2)}</strong></td>
        `;
    }
    
    tabla.appendChild(filaTotal);
}

// ACTUALIZAR TABLA DE MOVIMIENTOS DE CAJA CON BOTÓN EDITAR
function actualizarTablaMovimientosCaja() {
    const tbody = document.getElementById('tablaMovimientosCaja');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    datos.movimientosCaja.forEach(movimiento => {
        const tipoClase = movimiento.tipo === 'ingreso' ? 'text-success' : 'text-danger';
        const tipoTexto = movimiento.tipo === 'ingreso' ? 'INGRESO' : 'EGRESO';
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${movimiento.fecha || 'Sin fecha'}</td>
            <td><span class="${tipoClase}">${tipoTexto}</span></td>
            <td>${movimiento.concepto || 'Sin concepto'}</td>
            <td class="${tipoClase}">Bs ${(movimiento.monto || 0).toFixed(2)}</td>
            <td>
                ${isAdmin ? `
                <button class="btn-editar-caja" onclick="abrirModalEditarCaja(${movimiento.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarMovimientoCaja(${movimiento.id})">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// ACTUALIZAR TABLA DE GASTOS
function actualizarTablaGastos() {
    const tbody = document.getElementById('tablaGastos');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    datos.gastos.forEach(gasto => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${gasto.categoria || 'Sin categoría'}</td>
            <td>${(gasto.descripcion || '').substring(0, 30)}${(gasto.descripcion || '').length > 30 ? '...' : ''}</td>
            <td>Bs ${(gasto.monto || 0).toFixed(2)}</td>
            <td>${gasto.fecha || 'Sin fecha'}</td>
            <td>
                ${gasto.comprobante ? `
                <button class="btn btn-comprobante btn-sm" onclick="verComprobante(${gasto.id})">
                    <i class="fas fa-eye"></i> Ver
                </button>
                ` : 'Sin comprobante'}
            </td>
            <td>
                ${isAdmin ? `
                <button class="btn btn-danger btn-sm" onclick="eliminarGasto(${gasto.id})">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// VER COMPROBANTE
function verComprobante(id) {
    const gasto = datos.gastos.find(g => g.id === id);
    if (!gasto || !gasto.comprobante) {
        mostrarMensaje('No hay comprobante disponible', 'error');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalComprobante'));
    const imagen = document.getElementById('imagenComprobante');
    const pdfDiv = document.getElementById('pdfComprobante');
    
    if (gasto.comprobante.tipo.includes('pdf')) {
        imagen.style.display = 'none';
        pdfDiv.style.display = 'block';
        
        pdfDiv.innerHTML = `
            <div class="alert alert-info">
                <p>Comprobante PDF: ${gasto.comprobante.nombre}</p>
                <a href="data:application/pdf;base64,${gasto.comprobante.datos}" 
                   download="${gasto.comprobante.name}"
                   class="btn btn-primary">
                    <i class="fas fa-download"></i> Descargar PDF
                </a>
            </div>
        `;
    } else {
        imagen.style.display = 'block';
        pdfDiv.style.display = 'none';
        imagen.src = `data:${gasto.comprobante.tipo};base64,${gasto.comprobante.datos}`;
        imagen.alt = `Comprobante ${gasto.comprobante.nombre}`;
    }
    
    modal.show();
}

// ACTUALIZAR ÚLTIMOS REGISTROS
function actualizarUltimosRegistros() {
    const tbodyGastos = document.getElementById('ultimosGastos');
    if (tbodyGastos) {
        tbodyGastos.innerHTML = '';
        const ultimosGastos = datos.gastos.slice(-5).reverse();
        
        ultimosGastos.forEach(gasto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${gasto.categoria || 'Sin categoría'}</td>
                <td>${(gasto.descripcion || '').substring(0, 20)}${(gasto.descripcion || '').length > 20 ? '...' : ''}</td>
                <td>Bs ${(gasto.monto || 0).toFixed(2)}</td>
                <td>${gasto.fecha || 'Sin fecha'}</td>
            `;
            tbodyGastos.appendChild(fila);
        });
    }
}

// ACTUALIZAR RESUMEN DE APORTES POR CURSO ORDENADO
function actualizarResumenAportesCursos() {
    const tabla = document.getElementById('resumenAportesCursos');
    if (!tabla) return;
    
    tabla.innerHTML = '';
    
    let total2026 = 0;
    let total2027 = 0;
    let totalGeneral = 0;
    
    // Ordenar cursos según el orden definido
    ordenCursos.forEach(cursoNombre => {
        const datosCurso = datos.cursos[cursoNombre];
        if (datosCurso.estudiantes) {
            let aporte2026 = 0;
            let aporte2027 = 0;
            
            datosCurso.estudiantes.forEach(estudiante => {
                if (estudiante.pagos) {
                    if (estudiante.pagos[2026] && estudiante.pagos[2026].pagado) aporte2026 += estudiante.pagos[2026].monto || 0;
                    if (estudiante.pagos[2027] && estudiante.pagos[2027].pagado) aporte2027 += estudiante.pagos[2027].monto || 0;
                }
            });
            
            const totalCurso = aporte2026 + aporte2027;
            
            total2026 += aporte2026;
            total2027 += aporte2027;
            totalGeneral += totalCurso;
            
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${cursoNombre}</td>
                <td>Bs ${aporte2026.toFixed(2)}</td>
                <td>Bs ${aporte2027.toFixed(2)}</td>
                <td>Bs ${totalCurso.toFixed(2)}</td>
            `;
            tabla.appendChild(fila);
        }
    });
    
    if (document.getElementById('total2026')) document.getElementById('total2026').textContent = `Bs ${total2026.toFixed(2)}`;
    if (document.getElementById('total2027')) document.getElementById('total2027').textContent = `Bs ${total2027.toFixed(2)}`;
    if (document.getElementById('totalGeneral')) document.getElementById('totalGeneral').textContent = `Bs ${totalGeneral.toFixed(2)}`;
}

// FUNCIÓN AUXILIAR PARA AMPLIAR IMAGEN
function ampliarImagen(src) {
    const imagen = document.createElement('img');
    imagen.src = src;
    imagen.style.maxWidth = '90vw';
    imagen.style.maxHeight = '90vh';
    imagen.style.position = 'fixed';
    imagen.style.top = '50%';
    imagen.style.left = '50%';
    imagen.style.transform = 'translate(-50%, -50%)';
    imagen.style.zIndex = '9999';
    imagen.style.cursor = 'pointer';
    imagen.style.boxShadow = '0 0 30px rgba(0,0,0,0.5)';
    imagen.style.borderRadius = '10px';
    
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
    overlay.style.zIndex = '9998';
    
    overlay.onclick = function() {
        document.body.removeChild(overlay);
        document.body.removeChild(imagen);
    };
    
    document.body.appendChild(overlay);
    document.body.appendChild(imagen);
}

// FUNCIÓN AUXILIAR PARA DETERMINAR ESTADO DE PAGO
function determinarEstadoPago(pago, montoRequerido) {
    if (!pago.pagado && pago.monto === 0) {
        return 'deuda';
    } else if (pago.pagado && pago.monto >= montoRequerido) {
        return 'pagado';
    } else if (pago.pagado && pago.monto > 0 && pago.monto < montoRequerido) {
        return 'parcial';
    } else if (!pago.pagado && pago.monto > 0) {
        return 'parcial';
    }
    return 'deuda';
}

// RESETEAR DATOS
function resetearDatos() {
    if (!isAdmin) return;
    
    if (confirm('¿Está seguro de que desea resetear todos los datos a 0? Esta acción no se puede deshacer.')) {
        const cursosEstructura = {};
        ordenCursos.forEach(curso => {
            cursosEstructura[curso] = { estudiantes: [] };
        });
        
        datos = {
            totalAportesEstudiantes: 0,
            totalGastos: 0,
            dineroInicial: 0,
            dineroFinal: 0,
            totalIngresosCaja: 0,
            totalEgresosCaja: 0,
            totalOtrosCobros: 0,
            aportes: [],
            gastos: [],
            movimientosCaja: [],
            otrosCobros: [],
            eventos: [],
            sectoresCobro: [],
            gastosCasilleros: [],
            casilleros: {},
            cursos: cursosEstructura
        };
        
        for (const curso in datos.cursos) {
            datos.cursos[curso].estudiantes = [];
        }
        inicializarEstudiantes();
        
        inicializarCasilleros();
        
        guardarDatos();
        actualizarDashboard();
        actualizarResumenAportesCursos();
        actualizarTablaGastos();
        actualizarTablaMovimientosCaja();
        actualizarUltimosRegistros();
        actualizarGraficos();
        actualizarReporteMensual();
        actualizarDetalleCajaFuerte();
        actualizarSeguimiento();
        actualizarVistaCasilleros();
        actualizarEventos();
        actualizarSectoresCobro();
        actualizarTablaGastosCasilleros();
        
        mostrarMensaje('Todos los datos han sido reseteados a 0', 'success');
    }
}

// MOSTRAR MENSAJE
function mostrarMensaje(mensaje, tipo) {
    console.log(`Mensaje [${tipo}]: ${mensaje}`);
    
    let mensajesContainer = document.getElementById('mensajes-container');
    if (!mensajesContainer) {
        mensajesContainer = document.createElement('div');
        mensajesContainer.id = 'mensajes-container';
        mensajesContainer.style.position = 'fixed';
        mensajesContainer.style.top = '20px';
        mensajesContainer.style.right = '20px';
        mensajesContainer.style.zIndex = '9999';
        document.body.appendChild(mensajesContainer);
    }
    
    const mensajeDiv = document.createElement('div');
    
    let color = '#00ffff';
    if (tipo === 'success') color = '#00ff00';
    if (tipo === 'error') color = '#ff4444';
    if (tipo === 'info') color = '#00ffff';
    
    mensajeDiv.style.minWidth = '300px';
    mensajeDiv.style.marginBottom = '10px';
    mensajeDiv.style.padding = '15px';
    mensajeDiv.style.borderRadius = '10px';
    mensajeDiv.style.border = `2px solid ${color}`;
    mensajeDiv.style.background = 'rgba(10, 8, 35, 0.95)';
    mensajeDiv.style.backdropFilter = 'blur(10px)';
    mensajeDiv.style.color = color;
    mensajeDiv.style.boxShadow = `0 0 15px ${color}`;
    mensajeDiv.style.fontWeight = '600';
    
    mensajeDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span><strong>${mensaje}</strong></span>
            <button type="button" class="btn-close" style="filter: invert(1); font-weight: bold;" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    mensajesContainer.appendChild(mensajeDiv);
    
    setTimeout(() => {
        if (mensajeDiv.parentElement) {
            mensajeDiv.remove();
        }
    }, 5000);
}

// FUNCIONES PARA REPORTES PDF

// GENERAR PDF LISTA VACÍA
// GENERAR PDF LISTA VACÍA - SOLO NOMBRES
function generarPDFListaVacia() {
    const cursoSeleccionado = document.getElementById('selectorCurso').value;
    
    if (!cursoSeleccionado) {
        mostrarMensaje('Seleccione un curso primero', 'error');
        return;
    }
    
    const datosCurso = datos.cursos[cursoSeleccionado];
    const montoReq2026 = obtenerMontoCurso(cursoSeleccionado, '2026');
    const montoReq2027 = obtenerMontoCurso(cursoSeleccionado, '2027');
    
    let contenidoPDF = `
        <html>
        <head>
            <title>Lista de Estudiantes Vacía - ${cursoSeleccionado}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 10px; font-size: 11px; }
                .reporte { max-width: 700px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
                .header h2 { color: #333; margin-bottom: 3px; font-size: 16px; }
                .header h3 { color: #666; margin-top: 0; font-size: 14px; }
                .info-montos { background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 8px 0; text-align: center; font-size: 10px; }
                .tabla { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
                .tabla th, .tabla td { border: 1px solid #000; padding: 6px; text-align: left; }
                .tabla th { background-color: #f2f2f2; font-weight: bold; }
                .instrucciones { margin-top: 15px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 9px; }
                .footer { margin-top: 15px; text-align: center; font-size: 8px; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
                .nombre-col { width: 60%; }
                .pago-col { width: 20%; text-align: center; }
                .fecha-col { width: 20%; text-align: center; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 5px; }
                }
            </style>
        </head>
        <body>
            <div class="reporte">
                <div class="header">
                    <h2>FEDERACIÓN ESTUDIANTIL</h2>
                    <h3>LISTA DE ESTUDIANTES PARA ANOTAR PAGOS - ${cursoSeleccionado}</h3>
                    <p>Fecha: ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="info-montos">
                    <strong>Montos Requeridos:</strong> 2026: Bs ${montoReq2026} | 2027: Bs ${montoReq2027}
                </div>
                
                <!-- TABLA PARA 2026 -->
                <h4 style="margin-top: 20px; color: #007bff;">AÑO 2026 - MONTO: Bs ${montoReq2026}</h4>
                <table class="tabla">
                    <tr>
                        <th class="nombre-col">NOMBRE DEL ESTUDIANTE</th>
                        <th class="pago-col">PAGÓ (✓)</th>
                        <th class="fecha-col">FECHA</th>
                    </tr>
    `;
    
    // Mostrar nombres reales de estudiantes para 2026
    if (datosCurso.estudiantes && datosCurso.estudiantes.length > 0) {
        datosCurso.estudiantes.forEach((estudiante, index) => {
            contenidoPDF += `
                <tr>
                    <td>${estudiante.nombre || `Estudiante ${index + 1}`}</td>
                    <td style="text-align: center;">_____</td>
                    <td style="text-align: center;">_____</td>
                </tr>
            `;
        });
    } else {
        // Si no hay estudiantes, crear filas vacías
        for (let i = 1; i <= 30; i++) {
            contenidoPDF += `
                <tr>
                    <td>___________________________</td>
                    <td style="text-align: center;">_____</td>
                    <td style="text-align: center;">_____</td>
                </tr>
            `;
        }
    }
    
    contenidoPDF += `
                </table>
                
                <!-- TABLA PARA 2027 -->
                <h4 style="margin-top: 30px; color: #28a745;">AÑO 2027 - MONTO: Bs ${montoReq2027}</h4>
                <table class="tabla">
                    <tr>
                        <th class="nombre-col">NOMBRE DEL ESTUDIANTE</th>
                        <th class="pago-col">PAGÓ (✓)</th>
                        <th class="fecha-col">FECHA</th>
                    </tr>
    `;
    
    // Mostrar nombres reales de estudiantes para 2027
    if (datosCurso.estudiantes && datosCurso.estudiantes.length > 0) {
        datosCurso.estudiantes.forEach((estudiante, index) => {
            contenidoPDF += `
                <tr>
                    <td>${estudiante.nombre || `Estudiante ${index + 1}`}</td>
                    <td style="text-align: center;">_____</td>
                    <td style="text-align: center;">_____</td>
                </tr>
            `;
        });
    } else {
        // Si no hay estudiantes, crear filas vacías
        for (let i = 1; i <= 30; i++) {
            contenidoPDF += `
                <tr>
                    <td>___________________________</td>
                    <td style="text-align: center;">_____</td>
                    <td style="text-align: center;">_____</td>
                </tr>
            `;
        }
    }
    
    contenidoPDF += `
                </table>
                
                <div class="instrucciones">
                    <p><strong>Instrucciones:</strong></p>
                    <p>1. Anote el nombre del estudiante si no aparece en la lista</p>
                    <p>2. Marque con ✓ en la columna "PAGÓ" cuando el estudiante pague</p>
                    <p>3. Anote la fecha de pago en la columna "FECHA"</p>
                    <p>4. Esta hoja es para registro manual de pagos por año</p>
                    <p><strong>Nota:</strong> Los nombres mostrados son los registrados en el sistema. Si falta algún estudiante, anótelo manualmente.</p>
                </div>
                
                <div class="footer">
                    <p>Este documento es para control manual de pagos - Federación Estudiantil</p>
                    <p>Montos: 2026: Bs ${montoReq2026} | 2027: Bs ${montoReq2027}</p>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 15px;">
                    <button onclick="window.print()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">
                        <i class="fas fa-print"></i> Imprimir Lista Vacía
                    </button>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const ventanaPDF = window.open('', '_blank');
    if (ventanaPDF) {
        ventanaPDF.document.write(contenidoPDF);
        ventanaPDF.document.close();
    }
}

// GENERAR PDF DEL CURSO (COMPACTO)
function generarPDFCurso() {
    const cursoSeleccionado = document.getElementById('selectorCurso').value;
    
    if (!cursoSeleccionado) {
        mostrarMensaje('Seleccione un curso primero', 'error');
        return;
    }
    
    const datosCurso = datos.cursos[cursoSeleccionado];
    const montoReq2026 = obtenerMontoCurso(cursoSeleccionado, '2026');
    const montoReq2027 = obtenerMontoCurso(cursoSeleccionado, '2027');
    
    let contenidoPDF = `
        <html>
        <head>
            <title>Lista de Estudiantes - ${cursoSeleccionado}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; }
                .reporte { max-width: 700px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 12px; border-bottom: 1px solid #000; padding-bottom: 6px; }
                .header h2 { color: #333; margin-bottom: 2px; font-size: 14px; }
                .header h3 { color: #666; margin-top: 0; font-size: 12px; }
                .info-montos { background: #f5f5f5; padding: 6px; border-radius: 3px; margin: 6px 0; text-align: center; font-size: 9px; }
                .tabla { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 8px; }
                .tabla th, .tabla td { border: 1px solid #000; padding: 4px; text-align: left; }
                .tabla th { background-color: #f2f2f2; font-weight: bold; font-size: 7px; }
                .pagado { color: green; }
                .deuda { color: red; }
                .parcial { color: orange; }
                .footer { margin-top: 12px; text-align: center; font-size: 7px; color: #666; border-top: 1px solid #ccc; padding-top: 6px; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 5px; }
                }
            </style>
        </head>
        <body>
            <div class="reporte">
                <div class="header">
                    <h2>FEDERACIÓN ESTUDIANTIL</h2>
                    <h3>LISTA DE ESTUDIANTES - ${cursoSeleccionado}</h3>
                    <p>Fecha: ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="info-montos">
                    <strong>Montos:</strong> 2026: Bs ${montoReq2026} | 2027: Bs ${montoReq2027}
                </div>
                <table class="tabla">
                    <tr>
                        <th width="5%">N°</th>
                        <th width="25%">Estudiante</th>
                        <th width="12%">2026</th>
                        <th width="10%">Fec. 2026</th>
                        <th width="8%">Est.</th>
                        <th width="12%">2027</th>
                        <th width="10%">Fec. 2027</th>
                        <th width="8%">Est.</th>
                        <th width="10%">Total</th>
                    </tr>
    `;
    
    let totalPagado = 0;
    let estudiantesAlDia = 0;
    let estudiantesConDeuda = 0;
    
    datosCurso.estudiantes.forEach((estudiante, index) => {
        const pago2026 = estudiante.pagos ? estudiante.pagos['2026'] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false };
        const pago2027 = estudiante.pagos ? estudiante.pagos['2027'] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false };
        
        const pagado2026 = pago2026.pagado ? pago2026.monto : 0;
        const pagado2027 = pago2027.pagado ? pago2027.monto : 0;
        const totalEstudiante = pagado2026 + pagado2027;
        totalPagado += totalEstudiante;
        
        const estado2026 = determinarEstadoPago(pago2026, montoReq2026);
        const estado2027 = determinarEstadoPago(pago2027, montoReq2027);
        
        let estadoGeneral = 'al-dia';
        const deudaTotal = (montoReq2026 + montoReq2027) - totalEstudiante;
        
        if (deudaTotal === (montoReq2026 + montoReq2027)) {
            estadoGeneral = 'con-deuda';
            estudiantesConDeuda++;
        } else if (deudaTotal > 0) {
            estadoGeneral = 'parcial';
            estudiantesConDeuda++;
        } else {
            estudiantesAlDia++;
        }
        
        contenidoPDF += `
            <tr>
                <td>${index + 1}</td>
                <td>${estudiante.nombre || `Est. ${index + 1}`}</td>
                <td class="${pago2026.pagado ? 'pagado' : 'deuda'}">${pago2026.pagado ? 'Bs ' + pagado2026.toFixed(2) : '-'}</td>
                <td>${pago2026.fecha || '-'}</td>
                <td class="${estado2026}">${estado2026 === 'pagado' ? 'C' : estado2026 === 'deuda' ? 'D' : 'P'}</td>
                <td class="${pago2027.pagado ? 'pagado' : 'deuda'}">${pago2027.pagado ? 'Bs ' + pagado2027.toFixed(2) : '-'}</td>
                <td>${pago2027.fecha || '-'}</td>
                <td class="${estado2027}">${estado2027 === 'pagado' ? 'C' : estado2027 === 'deuda' ? 'D' : 'P'}</td>
                <td class="${totalEstudiante > 0 ? 'pagado' : 'deuda'}">Bs ${totalEstudiante.toFixed(2)}</td>
            </tr>
        `;
    });
    
    const totalEsperado = datosCurso.estudiantes.length * (montoReq2026 + montoReq2027);
    const porcentaje = totalEsperado > 0 ? Math.round((totalPagado / totalEsperado) * 100) : 0;
    
    contenidoPDF += `
                </table>
                
                <div style="margin-top: 10px; padding: 6px; background: #f8f9fa; border-radius: 3px; font-size: 9px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <strong>Resumen:</strong><br>
                            Estudiantes al día: ${estudiantesAlDia}<br>
                            Estudiantes con deuda: ${estudiantesConDeuda}<br>
                            Total estudiantes: ${datosCurso.estudiantes.length}
                        </div>
                        <div style="text-align: right;">
                            <strong>Financiero:</strong><br>
                            Total pagado: Bs ${totalPagado.toFixed(2)}<br>
                            Total esperado: Bs ${totalEsperado.toFixed(2)}<br>
                            Porcentaje: ${porcentaje}%
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Federación Estudiantil - Control de Pagos</p>
                    <p>Legenda: C=Completo, D=Deuda, P=Parcial</p>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 10px;">
                    <button onclick="window.print()" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: bold; font-size: 10px;">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const ventanaPDF = window.open('', '_blank');
    if (ventanaPDF) {
        ventanaPDF.document.write(contenidoPDF);
        ventanaPDF.document.close();
    }
}

// EXPORTAR A EXCEL
function exportarExcel() {
    const cursoSeleccionado = document.getElementById('selectorCurso').value;
    
    if (!cursoSeleccionado) {
        mostrarMensaje('Seleccione un curso primero', 'error');
        return;
    }
    
    const datosCurso = datos.cursos[cursoSeleccionado];
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += "N°;Nombre del Estudiante;2026;Fecha 2026;Estado 2026;2027;Fecha 2027;Estado 2027;Total Pagado;Estado General\n";
    
    datosCurso.estudiantes.forEach((estudiante, index) => {
        const totalPagado = Object.values(estudiante.pagos || {}).reduce((total, pago) => total + (pago.pagado ? (pago.monto || 0) : 0), 0);
        
        const fila = [
            index + 1,
            estudiante.nombre || `Estudiante ${index + 1}`,
            estudiante.pagos && estudiante.pagos[2026] && estudiante.pagos[2026].pagado ? 'Bs ' + (estudiante.pagos[2026].monto || 0).toFixed(2) : 'Pendiente',
            estudiante.pagos && estudiante.pagos[2026] ? (estudiante.pagos[2026].fecha || '-') : '-',
            estudiante.pagos && estudiante.pagos[2026] && estudiante.pagos[2026].pagado ? 'AL DÍA' : 'CON DEUDA',
            estudiante.pagos && estudiante.pagos[2027] && estudiante.pagos[2027].pagado ? 'Bs ' + (estudiante.pagos[2027].monto || 0).toFixed(2) : 'Pendiente',
            estudiante.pagos && estudiante.pagos[2027] ? (estudiante.pagos[2027].fecha || '-') : '-',
            estudiante.pagos && estudiante.pagos[2027] && estudiante.pagos[2027].pagado ? 'AL DÍA' : 'CON DEUDA',
            'Bs ' + totalPagado.toFixed(2),
            totalPagado > 0 ? 'AL DÍA' : 'CON DEUDA'
        ].join(";");
        
        csvContent += fila + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pagos_${cursoSeleccionado.replace(/[^a-z0-9]/gi, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarMensaje('Archivo Excel generado exitosamente', 'success');
}

// EXPORTAR EXCEL COMPLETO (todos los cursos)
function exportarExcelCompleto() {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Encabezados
    csvContent += "Curso;Estudiante;2026;Fecha 2026;Estado 2026;2027;Fecha 2027;Estado 2027;Total Pagado;Estado\n";
    
    // Datos de todos los cursos
    for (const cursoNombre of ordenCursos) {
        const datosCurso = datos.cursos[cursoNombre];
        if (datosCurso.estudiantes) {
            datosCurso.estudiantes.forEach((estudiante, index) => {
                const totalPagado = Object.values(estudiante.pagos || {}).reduce((total, pago) => total + (pago.pagado ? (pago.monto || 0) : 0), 0);
                
                const fila = [
                    cursoNombre,
                    estudiante.nombre || `Estudiante ${index + 1}`,
                    estudiante.pagos && estudiante.pagos[2026] && estudiante.pagos[2026].pagado ? 'Bs ' + (estudiante.pagos[2026].monto || 0).toFixed(2) : 'Pendiente',
                    estudiante.pagos && estudiante.pagos[2026] ? (estudiante.pagos[2026].fecha || '-') : '-',
                    estudiante.pagos && estudiante.pagos[2026] && estudiante.pagos[2026].pagado ? 'AL DÍA' : 'CON DEUDA',
                    estudiante.pagos && estudiante.pagos[2027] && estudiante.pagos[2027].pagado ? 'Bs ' + (estudiante.pagos[2027].monto || 0).toFixed(2) : 'Pendiente',
                    estudiante.pagos && estudiante.pagos[2027] ? (estudiante.pagos[2027].fecha || '-') : '-',
                    estudiante.pagos && estudiante.pagos[2027] && estudiante.pagos[2027].pagado ? 'AL DÍA' : 'CON DEUDA',
                    'Bs ' + totalPagado.toFixed(2),
                    totalPagado > 0 ? 'AL DÍA' : 'CON DEUDA'
                ].join(";");
                
                csvContent += fila + "\n";
            });
        }
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_completo_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarMensaje('Archivo Excel completo generado exitosamente', 'success');
}

// GENERAR RECIBO DE PAGO
function generarRecibo(curso, index) {
    const estudiante = datos.cursos[curso].estudiantes[index];
    const pagos = estudiante.pagos || {};
    
    let contenidoRecibo = `
        <html>
        <head>
            <title>Recibo de Pago - ${estudiante.nombre || `Estudiante ${index + 1}`}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 15px; }
                .recibo { border: 2px solid #000; padding: 15px; max-width: 500px; margin: 0 auto; font-size: 12px; }
                .header { text-align: center; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 10px; }
                .detalles { margin: 15px 0; }
                .firma { margin-top: 30px; border-top: 1px solid #000; padding-top: 10px; }
                table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10px; }
                th, td { border: 1px solid #000; padding: 5px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; background-color: #e9ecef; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="recibo">
                <div class="header">
                    <h3 style="margin-bottom: 5px;">FEDERACIÓN ESTUDIANTIL</h3>
                    <h4 style="margin-top: 0; color: #666;">RECIBO DE PAGO DE APORTES</h4>
                </div>
                <div class="detalles">
                    <p><strong>Estudiante:</strong> ${estudiante.nombre || `Estudiante ${index + 1}`}</p>
                    <p><strong>Curso:</strong> ${curso}</p>
                    <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString()}</p>
                    <h5>Detalle de Pagos:</h5>
                    <table>
                        <tr>
                            <th>Año</th>
                            <th>Monto</th>
                            <th>Fecha de Pago</th>
                            <th>Estado</th>
                        </tr>
    `;
    
    let totalPagado = 0;
    ['2026', '2027'].forEach(anio => {
        const pago = pagos[anio] || { monto: 0, fecha: '', pagado: false };
        if (pago.pagado) {
            totalPagado += pago.monto || 0;
        }
        
        contenidoRecibo += `
            <tr>
                <td>${anio}</td>
                <td>${pago.pagado ? 'Bs ' + (pago.monto || 0).toFixed(2) : 'Pendiente'}</td>
                <td>${pago.fecha || '-'}</td>
                <td>${pago.pagado ? 'PAGADO' : 'PENDIENTE'}</td>
            </tr>
        `;
    });
    
    contenidoRecibo += `
                        <tr class="total">
                            <td colspan="3"><strong>Total Pagado:</strong></td>
                            <td><strong>Bs ${totalPagado.toFixed(2)}</strong></td>
                        </tr>
                    </table>
                </div>
                <div class="firma">
                    <div style="text-align: center;">
                        <p>_________________________</p>
                        <p><strong>Firma del Tesorero</strong></p>
                    </div>
                </div>
                <div class="no-print" style="text-align: center; margin-top: 15px;">
                    <button onclick="window.print()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">
                        <i class="fas fa-print"></i> Imprimir Recibo
                    </button>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const ventanaRecibo = window.open('', '_blank');
    if (ventanaRecibo) {
        ventanaRecibo.document.write(contenidoRecibo);
        ventanaRecibo.document.close();
        
        setTimeout(() => {
            ventanaRecibo.print();
        }, 500);
    }
}

// GENERAR PDF DE TODOS LOS ESTUDIANTES (COMPACTO)
function generarPDFTodosEstudiantes() {
    let contenidoPDF = `
        <html>
        <head>
            <title>Reporte Completo de Estudiantes</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; }
                .reporte { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
                .header h1 { color: #333; margin-bottom: 3px; font-size: 16px; }
                .header h2 { color: #666; margin-top: 0; font-size: 13px; }
                .tabla { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 8px; }
                .tabla th, .tabla td { border: 1px solid #000; padding: 4px; text-align: left; }
                .tabla th { background-color: #e9ecef; font-weight: bold; }
                .pagado { color: green; }
                .deuda { color: red; }
                .parcial { color: orange; }
                .resumen { margin-top: 15px; padding: 8px; background: #f8f9fa; border-radius: 4px; }
                .resumen-item { display: flex; justify-content: space-between; margin: 3px 0; }
                .page-break { page-break-before: always; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 5px; }
                }
            </style>
        </head>
        <body>
            <div class="reporte">
                <div class="header">
                    <h1>FEDERACIÓN ESTUDIANTIL</h1>
                    <h2>REPORTE COMPLETO DE ESTUDIANTES</h2>
                    <p>Fecha: ${new Date().toLocaleDateString()}</p>
                </div>
                
                <table class="tabla">
                    <thead>
                        <tr>
                            <th width="4%">#</th>
                            <th width="20%">Curso</th>
                            <th width="18%">Estudiante</th>
                            <th width="8%">Req. 2026</th>
                            <th width="8%">Pag. 2026</th>
                            <th width="6%">Est. 2026</th>
                            <th width="8%">Req. 2027</th>
                            <th width="8%">Pag. 2027</th>
                            <th width="6%">Est. 2027</th>
                            <th width="7%">Total Pag.</th>
                            <th width="7%">Deuda</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    let contador = 1;
    let totalEstudiantes = 0;
    let totalPagadoGeneral = 0;
    let totalDeudaGeneral = 0;
    let estudiantesAlDia = 0;
    let estudiantesConDeuda = 0;
    let estudiantesParcial = 0;
    
    for (const cursoNombre of ordenCursos) {
        const datosCurso = datos.cursos[cursoNombre];
        if (datosCurso.estudiantes) {
            datosCurso.estudiantes.forEach((estudiante, index) => {
                totalEstudiantes++;
                
                const montoReq2026 = obtenerMontoCurso(cursoNombre, '2026');
                const montoReq2027 = obtenerMontoCurso(cursoNombre, '2027');
                
                const pago2026 = estudiante.pagos ? estudiante.pagos['2026'] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false };
                const pago2027 = estudiante.pagos ? estudiante.pagos['2027'] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false };
                
                const pagado2026 = pago2026.pagado ? pago2026.monto || 0 : 0;
                const pagado2027 = pago2027.pagado ? pago2027.monto || 0 : 0;
                const totalPagado = pagado2026 + pagado2027;
                
                let deuda2026 = 0;
                let deuda2027 = 0;
                
                if (!pago2026.pagado || pago2026.monto < montoReq2026) {
                    deuda2026 = montoReq2026 - (pago2026.pagado ? pago2026.monto : 0);
                }
                
                if (!pago2027.pagado || pago2027.monto < montoReq2027) {
                    deuda2027 = montoReq2027 - (pago2027.pagado ? pago2027.monto : 0);
                }
                
                const totalDeuda = deuda2026 + deuda2027;
                totalPagadoGeneral += totalPagado;
                totalDeudaGeneral += totalDeuda;
                
                const estado2026 = determinarEstadoPago(pago2026, montoReq2026);
                const estado2027 = determinarEstadoPago(pago2027, montoReq2027);
                
                let estadoGeneral = 'al-dia';
                
                if (totalDeuda === (montoReq2026 + montoReq2027)) {
                    estadoGeneral = 'con-deuda';
                    estudiantesConDeuda++;
                } else if (totalDeuda > 0) {
                    estadoGeneral = 'parcial';
                    estudiantesParcial++;
                } else {
                    estudiantesAlDia++;
                }
                
                contenidoPDF += `
                    <tr>
                        <td>${contador}</td>
                        <td><strong>${cursoNombre}</strong></td>
                        <td>${estudiante.nombre || `Est. ${index + 1}`}</td>
                        <td>${montoReq2026}</td>
                        <td class="${pagado2026 > 0 ? 'pagado' : 'deuda'}">${pagado2026 > 0 ? pagado2026.toFixed(0) : '0'}</td>
                        <td class="${estado2026}">${estado2026 === 'pagado' ? 'C' : estado2026 === 'deuda' ? 'D' : 'P'}</td>
                        <td>${montoReq2027}</td>
                        <td class="${pagado2027 > 0 ? 'pagado' : 'deuda'}">${pagado2027 > 0 ? pagado2027.toFixed(0) : '0'}</td>
                        <td class="${estado2027}">${estado2027 === 'pagado' ? 'C' : estado2027 === 'deuda' ? 'D' : 'P'}</td>
                        <td class="${totalPagado > 0 ? 'pagado' : 'deuda'}">${totalPagado.toFixed(0)}</td>
                        <td class="${totalDeuda > 0 ? 'deuda' : 'pagado'}">${totalDeuda > 0 ? totalDeuda.toFixed(0) : '0'}</td>
                    </tr>
                `;
                
                contador++;
            });
        }
    }
    
    contenidoPDF += `
                    </tbody>
                </table>
                
                <div class="resumen">
                    <h4>RESUMEN GENERAL</h4>
                    <div class="resumen-item">
                        <span>Total Estudiantes:</span>
                        <span><strong>${totalEstudiantes}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Estudiantes al Día:</span>
                        <span class="pagado"><strong>${estudiantesAlDia}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Estudiantes Parciales:</span>
                        <span class="parcial"><strong>${estudiantesParcial}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Estudiantes con Deuda:</span>
                        <span class="deuda"><strong>${estudiantesConDeuda}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Total Pagado:</span>
                        <span class="pagado"><strong>Bs ${totalPagadoGeneral.toFixed(2)}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Total Deudas:</span>
                        <span class="deuda"><strong>Bs ${totalDeudaGeneral.toFixed(2)}</strong></span>
                    </div>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 15px;">
                    <button onclick="window.print()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">
                        <i class="fas fa-print"></i> Imprimir Reporte
                    </button>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const ventanaPDF = window.open('', '_blank');
    if (ventanaPDF) {
        ventanaPDF.document.write(contenidoPDF);
        ventanaPDF.document.close();
    }
}

// GENERAR REPORTE PDF DE CASILLEROS (COMPACTO)
function generarReporteCasillerosPDF() {
    let contenidoPDF = `
        <html>
        <head>
            <title>Reporte de Casilleros</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; }
                .reporte { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 6px; }
                .header h1 { color: #333; margin-bottom: 3px; font-size: 16px; }
                .resumen { background: #f8f9fa; padding: 8px; border-radius: 4px; margin: 8px 0; }
                .resumen-item { display: flex; justify-content: space-between; margin: 3px 0; }
                .tabla { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 8px; }
                .tabla th, .tabla td { border: 1px solid #000; padding: 4px; text-align: left; }
                .tabla th { background-color: #e9ecef; font-weight: bold; }
                .pagado { color: green; }
                .libre { color: #666; }
                .sector { margin-top: 15px; padding: 8px; border: 1px solid #000; border-radius: 4px; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 5px; }
                }
            </style>
        </head>
        <body>
            <div class="reporte">
                <div class="header">
                    <h1>FEDERACIÓN ESTUDIANTIL</h1>
                    <h2>REPORTE DE CASILLEROS 2026-2027</h2>
                    <p>Fecha: ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="resumen">
                    <h4>RESUMEN GENERAL</h4>
    `;
    
    let totalPagado = 0;
    let casillerosOcupados = 0;
    let casillerosLibres = 0;
    let total2026 = 0;
    let total2027 = 0;
    let totalGastosCasilleros = 0;
    
    // Calcular totales
    for (let i = 1; i <= 36; i++) {
        const casillero = datos.casilleros[i] || {
            numero: i,
            estudiante: '',
            montoMensual: 10.00,
            mesesPagados2026: [],
            mesesPagados2027: [],
            historial: [],
            totalPagado: 0
        };
        
        totalPagado += casillero.totalPagado || 0;
        
        if (casillero.estudiante && casillero.estudiante.trim() !== '') {
            casillerosOcupados++;
        } else {
            casillerosLibres++;
        }
        
        // Calcular por año
        if (casillero.historial) {
            casillero.historial.forEach(pago => {
                if (pago.anio === 2026) total2026 += pago.monto || 0;
                if (pago.anio === 2027) total2027 += pago.monto || 0;
            });
        }
    }
    
    // Calcular gastos de casilleros
    datos.gastosCasilleros.forEach(gasto => {
        totalGastosCasilleros += gasto.monto || 0;
    });
    
    contenidoPDF += `
                    <div class="resumen-item">
                        <span>Total Recaudado:</span>
                        <span><strong>Bs ${totalPagado.toFixed(2)}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Casilleros Ocupados:</span>
                        <span><strong>${casillerosOcupados}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Casilleros Libres:</span>
                        <span><strong>${casillerosLibres}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Recaudado 2026:</span>
                        <span><strong>Bs ${total2026.toFixed(2)}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Recaudado 2027:</span>
                        <span><strong>Bs ${total2027.toFixed(2)}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Gastos Casilleros:</span>
                        <span class="${totalGastosCasilleros > 0 ? 'deuda' : ''}"><strong>Bs ${totalGastosCasilleros.toFixed(2)}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Saldo Disponible:</span>
                        <span class="pagado"><strong>Bs ${(totalPagado - totalGastosCasilleros).toFixed(2)}</strong></span>
                    </div>
                </div>
                
                <div class="sector">
                    <h4>CASILLEROS OCUPADOS (${casillerosOcupados})</h4>
                    <table class="tabla">
                        <thead>
                            <tr>
                                <th width="8%">Casillero</th>
                                <th width="25%">Estudiante</th>
                                <th width="10%">Mensual</th>
                                <th width="10%">Meses 2026</th>
                                <th width="10%">Meses 2027</th>
                                <th width="12%">Total Pagado</th>
                                <th width="25%">Último Pago</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Solo casilleros ocupados
    for (let i = 1; i <= 36; i++) {
        const casillero = datos.casilleros[i] || {
            numero: i,
            estudiante: '',
            montoMensual: 10.00,
            mesesPagados2026: [],
            mesesPagados2027: [],
            historial: [],
            totalPagado: 0
        };
        
        if (casillero.estudiante && casillero.estudiante.trim() !== '') {
            const meses2026 = casillero.mesesPagados2026.length;
            const meses2027 = casillero.mesesPagados2027.length;
            
            let ultimoPago = '-';
            if (casillero.historial && casillero.historial.length > 0) {
                const ultimo = casillero.historial[casillero.historial.length - 1];
                ultimoPago = `${ultimo.mes}/${ultimo.anio} - Bs ${ultimo.monto || 0}`;
            }
            
            contenidoPDF += `
                <tr>
                    <td><strong>${i}</strong></td>
                    <td>${casillero.estudiante}</td>
                    <td>Bs ${casillero.montoMensual ? casillero.montoMensual.toFixed(2) : '10.00'}</td>
                    <td>${meses2026}</td>
                    <td>${meses2027}</td>
                    <td class="pagado">Bs ${casillero.totalPagado ? casillero.totalPagado.toFixed(2) : '0.00'}</td>
                    <td>${ultimoPago}</td>
                </tr>
            `;
        }
    }
    
    contenidoPDF += `
                        </tbody>
                    </table>
                </div>
                
                <div class="sector">
                    <h4>GASTOS DE CASILLEROS</h4>
    `;
    
    if (datos.gastosCasilleros.length === 0) {
        contenidoPDF += `<p>No hay gastos registrados</p>`;
    } else {
        contenidoPDF += `
            <table class="tabla">
                <thead>
                    <tr>
                        <th width="15%">Fecha</th>
                        <th width="25%">Concepto</th>
                        <th width="40%">Descripción</th>
                        <th width="20%">Monto</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        datos.gastosCasilleros.forEach(gasto => {
            contenidoPDF += `
                <tr>
                    <td>${gasto.fecha || '-'}</td>
                    <td>${gasto.concepto || '-'}</td>
                    <td>${gasto.descripcion || '-'}</td>
                    <td class="deuda">Bs ${(gasto.monto || 0).toFixed(2)}</td>
                </tr>
            `;
        });
        
        contenidoPDF += `
                </tbody>
            </table>
        `;
    }
    
    contenidoPDF += `
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 15px;">
                    <button onclick="window.print()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">
                        <i class="fas fa-print"></i> Imprimir Reporte
                    </button>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const ventanaPDF = window.open('', '_blank');
    if (ventanaPDF) {
        ventanaPDF.document.write(contenidoPDF);
        ventanaPDF.document.close();
    }
}

// GENERAR REPORTE SECTOR DE COBRO PDF
function generarReporteSectorPDF(sector) {
    let contenidoPDF = `
        <html>
        <head>
            <title>Reporte de Sector - ${sector.nombre}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; }
                .reporte { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 6px; }
                .header h1 { color: #333; margin-bottom: 3px; font-size: 16px; }
                .info-sector { background: #f0f8ff; padding: 8px; border-radius: 4px; margin: 8px 0; }
                .tabla { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 8px; }
                .tabla th, .tabla td { border: 1px solid #000; padding: 4px; text-align: left; }
                .tabla th { background-color: #e9ecef; font-weight: bold; }
                .resumen { margin-top: 15px; padding: 8px; background: #f8f9fa; border-radius: 4px; }
                .resumen-item { display: flex; justify-content: space-between; margin: 3px 0; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 5px; }
                }
            </style>
        </head>
        <body>
            <div class="reporte">
                <div class="header">
                    <h1>FEDERACIÓN ESTUDIANTIL</h1>
                    <h2>REPORTE DE SECTOR DE COBRO</h2>
                    <p>${sector.nombre}</p>
                </div>
                
                <div class="info-sector">
                    <p><strong>Descripción:</strong> ${sector.descripcion}</p>
                    <p><strong>Monto por estudiante:</strong> Bs ${sector.monto.toFixed(2)}</p>
                    <p><strong>Fecha límite:</strong> ${sector.fechaLimite}</p>
                    <p><strong>Fecha de creación:</strong> ${sector.fechaCreacion}</p>
                </div>
    `;
    
    // Calcular estadísticas
    const totalCobrado = sector.cobros.reduce((total, cobro) => total + (cobro.monto || 0), 0);
    const totalEstudiantes = Object.values(datos.cursos).reduce((total, curso) => total + (curso.estudiantes?.length || 0), 0);
    const totalEsperado = totalEstudiantes * sector.monto;
    const porcentaje = totalEsperado > 0 ? Math.round((totalCobrado / totalEsperado) * 100) : 0;
    
    contenidoPDF += `
                <div class="resumen">
                    <h4>ESTADÍSTICAS DEL SECTOR</h4>
                    <div class="resumen-item">
                        <span>Total recaudado:</span>
                        <span><strong>Bs ${totalCobrado.toFixed(2)}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Total esperado:</span>
                        <span><strong>Bs ${totalEsperado.toFixed(2)}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Porcentaje completado:</span>
                        <span><strong>${porcentaje}%</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Falta recaudar:</span>
                        <span><strong>Bs ${(totalEsperado - totalCobrado).toFixed(2)}</strong></span>
                    </div>
                </div>
    `;
    
    if (sector.cobros.length === 0) {
        contenidoPDF += `
            <div style="text-align: center; padding: 20px;">
                <p>No hay cobros registrados en este sector</p>
            </div>
        `;
    } else {
        contenidoPDF += `
                <h4>COBROS REGISTRADOS (${sector.cobros.length})</h4>
                <table class="tabla">
                    <thead>
                        <tr>
                            <th width="10%">#</th>
                            <th width="15%">Fecha</th>
                            <th width="25%">Curso</th>
                            <th width="30%">Estudiante</th>
                            <th width="20%">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        sector.cobros.forEach((cobro, index) => {
            contenidoPDF += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${cobro.fecha}</td>
                    <td>${cobro.curso}</td>
                    <td>${cobro.estudiante}</td>
                    <td>Bs ${cobro.monto.toFixed(2)}</td>
                </tr>
            `;
        });
        
        contenidoPDF += `
                    </tbody>
                </table>
        `;
    }
    
    // Lista de estudiantes que NO han pagado (por curso)
    contenidoPDF += `
                <div class="page-break">
                    <h4>ESTUDIANTES PENDIENTES POR CURSO</h4>
    `;
    
    let hayPendientes = false;
    
    for (const cursoNombre of ordenCursos) {
        const datosCurso = datos.cursos[cursoNombre];
        if (datosCurso.estudiantes) {
            const estudiantesPendientes = datosCurso.estudiantes.filter(estudiante => {
                // Verificar si el estudiante ya pagó en este sector
                const yaPago = sector.cobros.some(cobro => 
                    cobro.curso === cursoNombre && 
                    cobro.estudiante === (estudiante.nombre || '')
                );
                return !yaPago;
            });
            
            if (estudiantesPendientes.length > 0) {
                hayPendientes = true;
                contenidoPDF += `
                    <div style="margin-top: 10px;">
                        <h5>${cursoNombre} (${estudiantesPendientes.length} pendientes)</h5>
                        <table class="tabla">
                            <thead>
                                <tr>
                                    <th width="10%">#</th>
                                    <th width="90%">Estudiante</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                estudiantesPendientes.forEach((estudiante, index) => {
                    contenidoPDF += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${estudiante.nombre || `Estudiante ${index + 1}`}</td>
                        </tr>
                    `;
                });
                
                contenidoPDF += `
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
    }
    
    if (!hayPendientes) {
        contenidoPDF += `<p>Todos los estudiantes han pagado en este sector</p>`;
    }
    
    contenidoPDF += `
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 15px;">
                    <button onclick="window.print()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">
                        <i class="fas fa-print"></i> Imprimir Reporte
                    </button>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const ventanaPDF = window.open('', '_blank');
    if (ventanaPDF) {
        ventanaPDF.document.write(contenidoPDF);
        ventanaPDF.document.close();
    }
}

// GENERAR REPORTE COMPLETO PDF MEJORADO
// GENERAR REPORTE COMPLETO PDF MEJORADO CON LÍNEA DE TIEMPO
// GENERAR REPORTE COMPLETO PDF - VERSIÓN MEJORADA Y SIMPLIFICADA
function generarReporteCompleto() {
    // ============= 1. CALCULAR DATOS BÁSICOS =============
    // A) APORTES DE ESTUDIANTES (2026 + 2027)
    let totalAportesEstudiantes = 0;
    let recaudado2026 = 0;
    let recaudado2027 = 0;
    
    // B) INGRESOS DE CAJA (movimientos de caja tipo ingreso)
    let ingresosCaja = 0;
    for (const movimiento of datos.movimientosCaja) {
        if (movimiento.tipo === 'ingreso') {
            ingresosCaja += movimiento.monto || 0;
        }
    }
    
    // C) EGRESOS DE CAJA (movimientos de caja tipo egreso)
    let egresosCaja = 0;
    for (const movimiento of datos.movimientosCaja) {
        if (movimiento.tipo === 'egreso') {
            egresosCaja += movimiento.monto || 0;
        }
    }
    
    // D) GASTOS OPERATIVOS
    let gastosOperativos = 0;
    for (const gasto of datos.gastos) {
        gastosOperativos += gasto.monto || 0;
    }
    
    // E) DINERO INICIAL
    let dineroInicial = 0;
    if (datos.movimientosCaja.length > 0) {
        const primerosIngresos = datos.movimientosCaja
            .filter(mov => mov.tipo === 'ingreso')
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        
        if (primerosIngresos.length > 0) {
            dineroInicial = primerosIngresos[0].monto || 0;
        }
    }
    
    // F) CALCULAR APORTES POR CURSO Y AÑO (código original)
    const aportesPorCurso = {};
    
    for (const cursoNombre of ordenCursos) {
        const datosCurso = datos.cursos[cursoNombre];
        if (datosCurso.estudiantes) {
            // Inicializar estructura
            if (!aportesPorCurso[cursoNombre]) {
                aportesPorCurso[cursoNombre] = {
                    '2026': { total: 0, estudiantes: 0, faltan: 0, deuda: 0 },
                    '2027': { total: 0, estudiantes: 0, faltan: 0, deuda: 0 },
                    totalGeneral: 0,
                    estudiantesTotales: datosCurso.estudiantes.length,
                    estudiantesPagaron: 0,
                    estudiantesFaltan: 0,
                    totalDeuda: 0
                };
            }
            
            const montoReq2026 = obtenerMontoCurso(cursoNombre, '2026');
            const montoReq2027 = obtenerMontoCurso(cursoNombre, '2027');
            
            datosCurso.estudiantes.forEach(estudiante => {
                let pagoCompleto2026 = false;
                let pagoCompleto2027 = false;
                
                if (estudiante.pagos) {
                    // Aporte 2026
                    if (estudiante.pagos['2026'] && estudiante.pagos['2026'].pagado) {
                        const monto2026 = estudiante.pagos['2026'].monto || 0;
                        aportesPorCurso[cursoNombre]['2026'].total += monto2026;
                        aportesPorCurso[cursoNombre]['2026'].estudiantes++;
                        
                        if (monto2026 >= montoReq2026) {
                            pagoCompleto2026 = true;
                        } else {
                            aportesPorCurso[cursoNombre]['2026'].deuda += (montoReq2026 - monto2026);
                        }
                        
                        totalAportesEstudiantes += monto2026;
                        recaudado2026 += monto2026;
                        aportesPorCurso[cursoNombre].totalGeneral += monto2026;
                    } else {
                        aportesPorCurso[cursoNombre]['2026'].faltan++;
                        aportesPorCurso[cursoNombre]['2026'].deuda += montoReq2026;
                    }
                    
                    // Aporte 2027
                    if (estudiante.pagos['2027'] && estudiante.pagos['2027'].pagado) {
                        const monto2027 = estudiante.pagos['2027'].monto || 0;
                        aportesPorCurso[cursoNombre]['2027'].total += monto2027;
                        aportesPorCurso[cursoNombre]['2027'].estudiantes++;
                        
                        if (monto2027 >= montoReq2027) {
                            pagoCompleto2027 = true;
                        } else {
                            aportesPorCurso[cursoNombre]['2027'].deuda += (montoReq2027 - monto2027);
                        }
                        
                        totalAportesEstudiantes += monto2027;
                        recaudado2027 += monto2027;
                        aportesPorCurso[cursoNombre].totalGeneral += monto2027;
                    } else {
                        aportesPorCurso[cursoNombre]['2027'].faltan++;
                        aportesPorCurso[cursoNombre]['2027'].deuda += montoReq2027;
                    }
                } else {
                    // No tiene pagos registrados
                    aportesPorCurso[cursoNombre]['2026'].faltan++;
                    aportesPorCurso[cursoNombre]['2026'].deuda += montoReq2026;
                    aportesPorCurso[cursoNombre]['2027'].faltan++;
                    aportesPorCurso[cursoNombre]['2027'].deuda += montoReq2027;
                }
                
                if (pagoCompleto2026 && pagoCompleto2027) {
                    aportesPorCurso[cursoNombre].estudiantesPagaron++;
                } else {
                    aportesPorCurso[cursoNombre].estudiantesFaltan++;
                }
            });
            
            // Calcular deuda total del curso
            aportesPorCurso[cursoNombre].totalDeuda = 
                aportesPorCurso[cursoNombre]['2026'].deuda + 
                aportesPorCurso[cursoNombre]['2027'].deuda;
        }
    }
    
    // G) Calcular otros ingresos (excluyendo dinero inicial)
    let otrosIngresos = 0;
    if (datos.movimientosCaja.length > 0) {
        const ingresosSinInicial = datos.movimientosCaja
            .filter(mov => mov.tipo === 'ingreso')
            .slice(1);
        
        for (const ingreso of ingresosSinInicial) {
            otrosIngresos += ingreso.monto || 0;
        }
    }
    
    // H) Total ingresos reales (sin contar dinero inicial duplicado)
    const totalIngresosReales = otrosIngresos + totalAportesEstudiantes;
    
    // I) Calcular gastos totales
    const totalEgresosTotales = egresosCaja + gastosOperativos;
    
    // J) Saldo final
    const saldoFinal = dineroInicial + totalIngresosReales - totalEgresosTotales;
    
    // ============= 2. CREAR LÍNEA DE TIEMPO EXACTA =============
    let todosLosEventos = [];
    
    // A) DINERO INICIAL (como primer evento)
    if (dineroInicial > 0) {
        todosLosEventos.push({
            fecha: datos.movimientosCaja.length > 0 ? datos.movimientosCaja[0].fecha : new Date().toISOString().split('T')[0],
            timestamp: datos.movimientosCaja.length > 0 ? new Date(datos.movimientosCaja[0].fecha).getTime() : Date.now(),
            tipo: 'DINERO INICIAL',
            descripcion: 'Fondo inicial de caja',
            detalle: 'Dinero inicial registrado',
            monto: dineroInicial,
            color: 'info',
            esIngreso: true,
            origen: 'inicial'
        });
    }
    
    // B) APORTES DE ESTUDIANTES
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
        if (datosCurso.estudiantes) {
            for (const estudiante of datosCurso.estudiantes) {
                if (estudiante.pagos) {
                    // 2026
                    const pago2026 = estudiante.pagos['2026'];
                    if (pago2026 && pago2026.pagado && pago2026.fecha && pago2026.monto > 0) {
                        todosLosEventos.push({
                            fecha: pago2026.fecha,
                            timestamp: new Date(pago2026.fecha).getTime(),
                            tipo: 'APORTE ESTUDIANTE',
                            descripcion: `${cursoNombre}`,
                            detalle: `${estudiante.nombre || 'Estudiante'} - Aporte 2026`,
                            monto: pago2026.monto || 0,
                            color: 'warning',
                            esIngreso: true,
                            origen: 'aporte_estudiante_2026'
                        });
                    }
                    
                    // 2027
                    const pago2027 = estudiante.pagos['2027'];
                    if (pago2027 && pago2027.pagado && pago2027.fecha && pago2027.monto > 0) {
                        todosLosEventos.push({
                            fecha: pago2027.fecha,
                            timestamp: new Date(pago2027.fecha).getTime(),
                            tipo: 'APORTE ESTUDIANTE',
                            descripcion: `${cursoNombre}`,
                            detalle: `${estudiante.nombre || 'Estudiante'} - Aporte 2027`,
                            monto: pago2027.monto || 0,
                            color: 'warning',
                            esIngreso: true,
                            origen: 'aporte_estudiante_2027'
                        });
                    }
                }
            }
        }
    }
    
    // C) MOVIMIENTOS DE CAJA - INGRESOS (excluyendo el primero que ya es dinero inicial)
    let primerIngresoContado = false;
    for (const movimiento of datos.movimientosCaja) {
        if (movimiento.fecha) {
            const esIngreso = movimiento.tipo === 'ingreso';
            
            // Saltar el primer ingreso si ya lo contamos como dinero inicial
            if (esIngreso && !primerIngresoContado && movimiento.monto === dineroInicial) {
                primerIngresoContado = true;
                continue;
            }
            
            todosLosEventos.push({
                fecha: movimiento.fecha,
                timestamp: new Date(movimiento.fecha).getTime(),
                tipo: esIngreso ? 'INGRESO CAJA' : 'EGRESO CAJA',
                descripcion: movimiento.concepto || 'Movimiento de caja',
                detalle: esIngreso ? 'Ingreso de dinero en caja' : 'Egreso de dinero de caja',
                monto: movimiento.monto || 0,
                color: esIngreso ? 'success' : 'danger',
                esIngreso: esIngreso,
                origen: 'caja'
            });
        }
    }
    
    // D) GASTOS OPERATIVOS
    for (const gasto of datos.gastos) {
        if (gasto.fecha) {
            todosLosEventos.push({
                fecha: gasto.fecha,
                timestamp: new Date(gasto.fecha).getTime(),
                tipo: 'GASTO OPERATIVO',
                descripcion: gasto.categoria || 'Gasto',
                detalle: gasto.descripcion || 'Sin descripción',
                monto: gasto.monto || 0,
                color: 'danger',
                esIngreso: false,
                origen: 'gasto'
            });
        }
    }
    
    // ============= 3. ORDENAR POR FECHA CRONOLÓGICA =============
    todosLosEventos.sort((a, b) => a.timestamp - b.timestamp);
    
    // ============= 4. CALCULAR SALDO ACUMULADO PARA LÍNEA DE TIEMPO =============
    let saldoAcumulado = 0;
    const lineaDeTiempo = [];
    
    // Procesar todos los eventos en orden cronológico
    for (let i = 0; i < todosLosEventos.length; i++) {
        const evento = todosLosEventos[i];
        
        if (evento.esIngreso) {
            saldoAcumulado += evento.monto;
        } else {
            saldoAcumulado -= evento.monto;
        }
        
        lineaDeTiempo.push({
            fecha: evento.fecha,
            tipo: evento.tipo,
            descripcion: evento.descripcion,
            detalle: evento.detalle,
            monto: evento.monto,
            color: evento.color,
            esIngreso: evento.esIngreso,
            saldoAcumulado: saldoAcumulado
        });
    }
    
    // Ordenar para mostrar (más reciente primero)
    const eventosParaMostrar = [...lineaDeTiempo].reverse();
    
    // ============= 5. GENERAR HTML DEL REPORTE =============
    let contenidoPDF = `
        <html>
        <head>
            <title>Reporte Financiero Completo - Solo Caja</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; }
                .reporte { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 6px; }
                .header h1 { color: #333; margin-bottom: 3px; font-size: 16px; }
                .header h2 { color: #666; margin-top: 0; font-size: 13px; }
                .seccion { margin-top: 15px; padding: 8px; border: 1px solid #000; border-radius: 4px; }
                .seccion h3 { margin-top: 0; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 3px; font-size: 12px; }
                .resumen-item { display: flex; justify-content: space-between; margin: 3px 0; }
                .resumen-item.total { background: #f8f9fa; font-weight: bold; border-top: 1px solid #000; }
                .ingreso { color: green; }
                .egreso { color: red; }
                .tabla { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 8px; }
                .tabla th, .tabla td { border: 1px solid #000; padding: 3px; text-align: left; }
                .tabla th { background-color: #e9ecef; font-weight: bold; }
                .tabla-aportes { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 8px; }
                .tabla-aportes th, .tabla-aportes td { border: 1px solid #000; padding: 3px; text-align: center; }
                .tabla-aportes th { background-color: #d4edda; }
                .caja-fuerte { background: #f0f8ff; padding: 8px; border-radius: 4px; }
                .estado-caja { text-align: center; padding: 10px; background: #28a745; color: white; border-radius: 4px; margin: 10px 0; }
                .estado-caja h2 { margin: 0; font-size: 18px; }
                .subtotal { background: #f8f9fa; font-weight: bold; }
                .page-break { page-break-before: always; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 5px; }
                }
            </style>
        </head>
        <body>
            <div class="reporte">
                <div class="header">
                    <h1>FEDERACIÓN ESTUDIANTIL</h1>
                    <h2>REPORTE FINANCIERO COMPLETO - SOLO CAJA</h2>
                    <p>Fecha: ${new Date().toLocaleDateString()}</p>
                </div>
                
                <!-- ESTADO DE CAJA -->
                <div class="estado-caja">
                    <h2>SALDO ACTUAL EN CAJA</h2>
                    <h1>Bs ${saldoFinal.toFixed(2)}</h1>
                    <p>Disponible para operaciones</p>
                </div>
                
                <!-- APORTES POR CURSO Y AÑO -->
                <div class="seccion">
                    <h3>APORTES POR CURSO Y AÑO</h3>
                    <table class="tabla-aportes">
                        <thead>
                            <tr>
                                <th rowspan="2">Curso</th>
                                <th rowspan="2">Total Est.</th>
                                <th colspan="4">AÑO 2026</th>
                                <th colspan="4">AÑO 2027</th>
                                <th rowspan="2">Total Curso</th>
                                <th rowspan="2">Deuda</th>
                            </tr>
                            <tr>
                                <th>Pagaron</th>
                                <th>Faltan</th>
                                <th>Recaudado</th>
                                <th>Falta</th>
                                <th>Pagaron</th>
                                <th>Faltan</th>
                                <th>Recaudado</th>
                                <th>Falta</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    let totalEstudiantesPagaron2026 = 0;
    let totalEstudiantesFaltan2026 = 0;
    let totalRecaudado2026 = 0;
    let totalFalta2026 = 0;
    let totalEstudiantesPagaron2027 = 0;
    let totalEstudiantesFaltan2027 = 0;
    let totalRecaudado2027 = 0;
    let totalFalta2027 = 0;
    let totalGeneralCursos = 0;
    let totalDeudaCursos = 0;
    
    // Ordenar cursos
    const cursosOrdenados = Object.keys(aportesPorCurso).sort();
    
    if (cursosOrdenados.length === 0) {
        contenidoPDF += `
            <tr>
                <td colspan="13" style="text-align: center; padding: 10px;">
                    No hay aportes registrados
                </td>
            </tr>
        `;
    } else {
        cursosOrdenados.forEach(cursoNombre => {
            const curso = aportesPorCurso[cursoNombre];
            const montoReq2026 = obtenerMontoCurso(cursoNombre, '2026');
            const montoReq2027 = obtenerMontoCurso(cursoNombre, '2027');
            
            totalEstudiantesPagaron2026 += curso['2026'].estudiantes;
            totalEstudiantesFaltan2026 += curso['2026'].faltan;
            totalRecaudado2026 += curso['2026'].total;
            totalFalta2026 += curso['2026'].deuda;
            
            totalEstudiantesPagaron2027 += curso['2027'].estudiantes;
            totalEstudiantesFaltan2027 += curso['2027'].faltan;
            totalRecaudado2027 += curso['2027'].total;
            totalFalta2027 += curso['2027'].deuda;
            
            totalGeneralCursos += curso.totalGeneral;
            totalDeudaCursos += curso.totalDeuda;
            
            contenidoPDF += `
                <tr>
                    <td><strong>${cursoNombre}</strong></td>
                    <td>${curso.estudiantesTotales}</td>
                    <td>${curso['2026'].estudiantes}</td>
                    <td>${curso['2026'].faltan}</td>
                    <td class="ingreso">${curso['2026'].total > 0 ? 'Bs ' + curso['2026'].total.toFixed(0) : '-'}</td>
                    <td class="${curso['2026'].deuda > 0 ? 'egreso' : ''}">${curso['2026'].deuda > 0 ? 'Bs ' + curso['2026'].deuda.toFixed(0) : '-'}</td>
                    <td>${curso['2027'].estudiantes}</td>
                    <td>${curso['2027'].faltan}</td>
                    <td class="ingreso">${curso['2027'].total > 0 ? 'Bs ' + curso['2027'].total.toFixed(0) : '-'}</td>
                    <td class="${curso['2027'].deuda > 0 ? 'egreso' : ''}">${curso['2027'].deuda > 0 ? 'Bs ' + curso['2027'].deuda.toFixed(0) : '-'}</td>
                    <td class="ingreso"><strong>Bs ${curso.totalGeneral.toFixed(0)}</strong></td>
                    <td class="${curso.totalDeuda > 0 ? 'egreso' : ''}"><strong>${curso.totalDeuda > 0 ? 'Bs ' + curso.totalDeuda.toFixed(0) : '-'}</strong></td>
                </tr>
            `;
        });
        
        // Totales
        contenidoPDF += `
            <tr class="subtotal">
                <td colspan="2"><strong>TOTALES:</strong></td>
                <td><strong>${totalEstudiantesPagaron2026}</strong></td>
                <td><strong>${totalEstudiantesFaltan2026}</strong></td>
                <td class="ingreso"><strong>Bs ${totalRecaudado2026.toFixed(0)}</strong></td>
                <td class="egreso"><strong>Bs ${totalFalta2026.toFixed(0)}</strong></td>
                <td><strong>${totalEstudiantesPagaron2027}</strong></td>
                <td><strong>${totalEstudiantesFaltan2027}</strong></td>
                <td class="ingreso"><strong>Bs ${totalRecaudado2027.toFixed(0)}</strong></td>
                <td class="egreso"><strong>Bs ${totalFalta2027.toFixed(0)}</strong></td>
                <td class="ingreso"><strong>Bs ${totalGeneralCursos.toFixed(0)}</strong></td>
                <td class="egreso"><strong>Bs ${totalDeudaCursos.toFixed(0)}</strong></td>
            </tr>
        `;
    }
    
    contenidoPDF += `
                        </tbody>
                    </table>
                </div>
                
                <!-- RESUMEN DE INGRESOS -->
                <div class="seccion">
                    <h3>INGRESOS TOTALES</h3>
                    <div class="resumen-item">
                        <span>Dinero Inicial:</span>
                        <span>Bs ${dineroInicial.toFixed(2)}</span>
                    </div>
                    <div class="resumen-item">
                        <span>Aportes Estudiantes:</span>
                        <span class="ingreso">Bs ${totalAportesEstudiantes.toFixed(2)}</span>
                    </div>
                    <div class="resumen-item">
                        <span>Otros Ingresos de Caja:</span>
                        <span class="ingreso">Bs ${otrosIngresos.toFixed(2)}</span>
                    </div>
                    <div class="resumen-item total">
                        <span><strong>TOTAL INGRESOS REALES:</strong></span>
                        <span class="ingreso"><strong>Bs ${totalIngresosReales.toFixed(2)}</strong></span>
                    </div>
                </div>
                
                <!-- RESUMEN DE EGRESOS -->
                <div class="seccion">
                    <h3>EGRESOS TOTALES</h3>
                    <div class="resumen-item">
                        <span>Gastos Operativos:</span>
                        <span class="egreso">Bs ${gastosOperativos.toFixed(2)}</span>
                    </div>
                    <div class="resumen-item">
                        <span>Egresos de Caja:</span>
                        <span class="egreso">Bs ${egresosCaja.toFixed(2)}</span>
                    </div>
                    <div class="resumen-item total">
                        <span><strong>TOTAL EGRESOS:</strong></span>
                        <span class="egreso"><strong>Bs ${totalEgresosTotales.toFixed(2)}</strong></span>
                    </div>
                </div>
                
                <!-- CAJA FUERTE DETALLADA -->
                <div class="seccion caja-fuerte">
                    <h3>DETALLE DE CAJA FUERTE</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <h4>ORÍGENES DEL DINERO</h4>
                            <div class="resumen-item">
                                <span>Dinero Inicial:</span>
                                <span>Bs ${dineroInicial.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Aportes Estudiantes:</span>
                                <span class="ingreso">Bs ${totalAportesEstudiantes.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Otros Ingresos:</span>
                                <span class="ingreso">Bs ${otrosIngresos.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div>
                            <h4>DESTINO DEL DINERO</h4>
                            <div class="resumen-item">
                                <span>Gastos Operativos:</span>
                                <span class="egreso">Bs ${gastosOperativos.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Egresos Varios:</span>
                                <span class="egreso">Bs ${egresosCaja.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Dinero Disponible:</span>
                                <span class="ingreso"><strong>Bs ${saldoFinal.toFixed(2)}</strong></span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- ECUACIÓN FINANCIERA -->
                    <div style="text-align: center; margin-top: 10px; padding: 8px; background: #fffacd; border-radius: 3px; font-size: 9px;">
                        <h4>ECUACIÓN FINANCIERA</h4>
                        <p>
                            <strong>Dinero Inicial (Bs ${dineroInicial.toFixed(2)}) + 
                            Ingresos Reales (Bs ${totalIngresosReales.toFixed(2)}) - 
                            Total Egresos (Bs ${totalEgresosTotales.toFixed(2)}) = 
                            Saldo Final (Bs ${saldoFinal.toFixed(2)})</strong>
                        </p>
                    </div>
                </div>
                
                <!-- RESUMEN EJECUTIVO -->
                <div class="seccion page-break">
                    <h3 style="color: #0056b3;">RESUMEN EJECUTIVO COMPLETO</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 15px;">
                        <div style="text-align: center; padding: 8px; background: white; border-radius: 3px; border: 1px solid #28a745;">
                            <h4 style="color: #28a745; font-size: 11px;">DINERO INICIAL</h4>
                            <h3 style="margin: 5px 0;">Bs ${dineroInicial.toFixed(2)}</h3>
                            <small>Fondo inicial en caja</small>
                        </div>
                        <div style="text-align: center; padding: 8px; background: white; border-radius: 3px; border: 1px solid #17a2b8;">
                            <h4 style="color: #17a2b8; font-size: 11px;">TOTAL RECAUDADO</h4>
                            <h3 style="margin: 5px 0;">Bs ${totalIngresosReales.toFixed(2)}</h3>
                            <small>Ingresos reales</small>
                        </div>
                        <div style="text-align: center; padding: 8px; background: white; border-radius: 3px; border: 1px solid #dc3545;">
                            <h4 style="color: #dc3545; font-size: 11px;">TOTAL GASTADO</h4>
                            <h3 style="margin: 5px 0;">Bs ${totalEgresosTotales.toFixed(2)}</h3>
                            <small>Todos los gastos</small>
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 12px; background: #28a745; color: white; border-radius: 4px;">
                        <h2 style="margin: 5px 0; font-size: 14px;">SALDO FINAL DISPONIBLE</h2>
                        <h1 style="font-size: 24px; margin: 5px 0;">Bs ${saldoFinal.toFixed(2)}</h1>
                        <p style="margin: 5px 0; font-size: 9px;">Este es el dinero actualmente disponible en caja para la Federación Estudiantil</p>
                    </div>
                </div>
                
                <!-- LÍNEA DE TIEMPO COMPLETA Y EXACTA -->
                <div class="seccion">
                    <h3>HISTORIAL CRONOLÓGICO COMPLETO DE CAJA</h3>
                    <p><small>Ordenado por fecha de registro (${lineaDeTiempo.length} eventos totales)</small></p>
                    
                    <table class="tabla" style="font-size: 7px;">
                        <thead>
                            <tr>
                                <th width="12%">Fecha</th>
                                <th width="15%">Tipo</th>
                                <th width="23%">Descripción</th>
                                <th width="25%">Detalle</th>
                                <th width="15%" class="text-end">Monto</th>
                                <th width="10%" class="text-end">Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Mostrar eventos (máximo 100 para el PDF)
    const eventosParaPDF = eventosParaMostrar.length > 100 ? eventosParaMostrar.slice(0, 100) : eventosParaMostrar;
    
    eventosParaPDF.forEach(evento => {
        const claseMonto = evento.esIngreso ? 'ingreso' : 'egreso';
        const signoMonto = evento.esIngreso ? '+' : '-';
        const claseSaldo = evento.saldoAcumulado >= 0 ? 'ingreso' : 'egreso';
        
        contenidoPDF += `
            <tr>
                <td>${evento.fecha}</td>
                <td><small>${evento.tipo}</small></td>
                <td>${evento.descripcion}</td>
                <td><small>${evento.detalle}</small></td>
                <td class="${claseMonto} text-end">
                    ${signoMonto}Bs ${evento.monto.toFixed(2)}
                </td>
                <td class="${claseSaldo} text-end">
                    Bs ${evento.saldoAcumulado.toFixed(2)}
                </td>
            </tr>
        `;
    });
    
    if (eventosParaMostrar.length > 100) {
        contenidoPDF += `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    <small>... y ${eventosParaMostrar.length - 100} eventos más</small>
                </td>
            </tr>
        `;
    }
    
    // Fila final con resumen
    const ultimoSaldo = lineaDeTiempo.length > 0 ? lineaDeTiempo[lineaDeTiempo.length-1].saldoAcumulado : dineroInicial;
    
    contenidoPDF += `
                <tr class="subtotal">
                    <td colspan="4" class="text-end"><strong>Resumen final:</strong></td>
                    <td class="text-end">
                        <small>Ingresos: <span class="ingreso">Bs ${totalIngresosReales.toFixed(2)}</span><br>
                        Egresos: <span class="egreso">Bs ${totalEgresosTotales.toFixed(2)}</span></small>
                    </td>
                    <td class="${ultimoSaldo >= 0 ? 'ingreso' : 'egreso'} text-end">
                        <strong>Bs ${ultimoSaldo.toFixed(2)}</strong>
                    </td>
                </tr>
            </tbody>
        </table>
        
        <div style="margin-top: 10px; font-size: 8px; color: #666;">
            <p><strong>Análisis del historial:</strong></p>
            <p>• Total eventos registrados: ${lineaDeTiempo.length}</p>
            <p>• Primer evento: ${lineaDeTiempo.length > 0 ? lineaDeTiempo[0].fecha : 'N/A'}</p>
            <p>• Último evento: ${lineaDeTiempo.length > 0 ? lineaDeTiempo[lineaDeTiempo.length-1].fecha : 'N/A'}</p>
            <p>• Saldo más alto: Bs ${Math.max(...lineaDeTiempo.map(e => e.saldoAcumulado)).toFixed(2)}</p>
            <p>• Saldo más bajo: Bs ${Math.min(...lineaDeTiempo.map(e => e.saldoAcumulado)).toFixed(2)}</p>
        </div>
        
        <!-- RESUMEN POR TIPO -->
        <div style="margin-top: 15px;">
            <h4 style="font-size: 10px; color: #333;">RESUMEN POR TIPO DE MOVIMIENTO</h4>
            <table class="tabla" style="font-size: 7px;">
                <thead>
                    <tr>
                        <th>Tipo de Movimiento</th>
                        <th>Cantidad</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Agrupar por tipo
    const resumenPorTipo = {};
    lineaDeTiempo.forEach(evento => {
        if (!resumenPorTipo[evento.tipo]) {
            resumenPorTipo[evento.tipo] = {
                cantidad: 0,
                total: 0
            };
        }
        resumenPorTipo[evento.tipo].cantidad++;
        resumenPorTipo[evento.tipo].total += evento.monto;
    });
    
    Object.entries(resumenPorTipo).forEach(([tipo, datos]) => {
        const esIngreso = tipo.includes('INGRESO') || tipo.includes('APORTE') || tipo.includes('DINERO INICIAL');
        const clase = esIngreso ? 'ingreso' : 'egreso';
        
        contenidoPDF += `
            <tr>
                <td>${tipo}</td>
                <td>${datos.cantidad}</td>
                <td class="${clase}">${esIngreso ? '+' : '-'}Bs ${datos.total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    contenidoPDF += `
                </tbody>
            </table>
        </div>
    </div>
                
    <div class="no-print" style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #ccc;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">
            <i class="fas fa-print"></i> Imprimir Reporte Completo
        </button>
        <p style="margin-top: 8px; color: #666; font-size: 9px;">
            <strong>Nota:</strong> Este reporte incluye SOLO información de caja (aportes, ingresos/egresos de caja y gastos)<br>
            Generado automáticamente por el Sistema de Gestión Financiera
        </p>
    </div>
</div>
</body>
</html>
`;
    
    const ventanaPDF = window.open('', '_blank');
    if (ventanaPDF) {
        ventanaPDF.document.write(contenidoPDF);
        ventanaPDF.document.close();
    }
}

// FUNCIÓN PARA PROBAR SINCRONIZACIÓN
function probarSincronizacion() {
    console.log('🧪 Probando sincronización...');
    
    if (!window.sincronizador) {
        console.error('❌ Sincronizador no disponible');
        mostrarMensaje('Sincronizador no cargado', 'error');
        return;
    }
    
    const estado = window.sincronizador.getEstado();
    console.log('Estado:', estado);
    
    // Crear un cambio de prueba
    const datosPrueba = {
        ...datos,
        prueba: new Date().toISOString(),
        numero_prueba: Math.random()
    };
    
    // Guardar en la nube
    window.sincronizador.guardarEnNube(datosPrueba)
        .then(exito => {
            if (exito) {
                mostrarMensaje('✅ Prueba enviada a la nube', 'success');
                console.log('✅ Prueba exitosa');
            } else {
                mostrarMensaje('❌ Error en prueba', 'error');
            }
        });
}

// AGREGAR BOTÓN DE PRUEBA EN EL NAVBAR
function agregarBotonPrueba() {
    const navbar = document.querySelector('nav');
    if (!navbar) return;
    
    const boton = document.createElement('button');
    boton.className = 'btn btn-outline-info btn-sm ms-2';
    boton.innerHTML = '<i class="fas fa-vial"></i> Probar Sync';
    boton.onclick = probarSincronizacion;
    boton.title = 'Probar sincronización';
    
    navbar.appendChild(boton);
}

// GUARDAR DATOS AUTOMÁTICAMENTE
setInterval(() => {
    if (isAdmin || isViewer) {
        guardarDatos();
        console.log('Datos guardados automáticamente');
    }
}, 30000);

// LLAMAR DESPUÉS DE CARGAR
setTimeout(agregarBotonPrueba, 2000);

// INICIALIZAR SELECTOR DE CURSOS
function inicializarSelectorCursos() {
    const selectorCurso = document.getElementById('selectorCurso');
    if (selectorCurso) {
        selectorCurso.innerHTML = '<option value="">Seleccione un curso</option>';
        ordenCursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.textContent = curso;
            selectorCurso.appendChild(option);
        });
    }
    
    // Inicializar también filtros de seguimiento
    const filtroCursoSeguimiento = document.getElementById('filtroCursoSeguimiento');
    if (filtroCursoSeguimiento) {
        filtroCursoSeguimiento.innerHTML = '<option value="todos">Todos los cursos</option>';
        ordenCursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.textContent = curso;
            filtroCursoSeguimiento.appendChild(option);
        });
    }
    
    // Inicializar también selector de curso para otros cobros
    const cursoOtroCobro = document.getElementById('cursoOtroCobro');
    if (cursoOtroCobro) {
        cursoOtroCobro.innerHTML = '<option value="">Seleccione curso</option>';
        ordenCursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.textContent = curso;
            cursoOtroCobro.appendChild(option);
        });
    }
}


function actualizarSeguimiento() {
    console.log("🔄 Actualizando seguimiento...");
    
    // ============================================
    // 1. CONTADORES PARA AMBAS GESTIONES JUNTAS (los 4 cuadros grandes)
    // ============================================
    let totalPagosCompletos = 0;        // Pagos completos (ambos años)
    let totalPagosFaltantes = 0;        // Pagos que faltan (ambos años)
    let totalAportes = 0;               // Dinero recaudado (ambos años)
    let totalDeudas = 0;                // Dinero faltante (ambos años)
    
    // ============================================
    // 2. CONTADORES POR AÑO SEPARADO (para los cuadros pequeños)
    // ============================================
    let pagos2026Completos = 0;         // 2026 completos
    let pagos2026Faltantes = 0;         // 2026 que faltan
    let aportes2026 = 0;                // Dinero 2026
    let deudas2026 = 0;                 // Deuda 2026
    
    let pagos2027Completos = 0;         // 2027 completos
    let pagos2027Faltantes = 0;         // 2027 que faltan
    let aportes2027 = 0;                // Dinero 2027
    let deudas2027 = 0;                 // Deuda 2027
    
    // ============================================
    // 3. RECORRER TODOS LOS ESTUDIANTES
    // ============================================
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
        if (!datosCurso.estudiantes) continue;
        
        const montoReq2026 = obtenerMontoCurso(cursoNombre, '2026');
        const montoReq2027 = obtenerMontoCurso(cursoNombre, '2027');
        
        datosCurso.estudiantes.forEach(estudiante => {
            const pago2026 = estudiante.pagos?.['2026'] || { monto: 0, pagado: false };
            const pago2027 = estudiante.pagos?.['2027'] || { monto: 0, pagado: false };
            
            // ====== PARA 2026 (AÑO ESPECÍFICO) ======
            if (pago2026.pagado) {
                aportes2026 += pago2026.monto || 0;
                totalAportes += pago2026.monto || 0;
                
                if (pago2026.monto >= montoReq2026) {
                    pagos2026Completos++;
                    totalPagosCompletos++;
                } else {
                    pagos2026Faltantes++;
                    totalPagosFaltantes++;
                    const deuda2026 = montoReq2026 - pago2026.monto;
                    deudas2026 += deuda2026;
                    totalDeudas += deuda2026;
                }
            } else {
                pagos2026Faltantes++;
                totalPagosFaltantes++;
                deudas2026 += montoReq2026;
                totalDeudas += montoReq2026;
            }
            
            // ====== PARA 2027 (AÑO ESPECÍFICO) ======
            if (pago2027.pagado) {
                aportes2027 += pago2027.monto || 0;
                totalAportes += pago2027.monto || 0;
                
                if (pago2027.monto >= montoReq2027) {
                    pagos2027Completos++;
                    totalPagosCompletos++;
                } else {
                    pagos2027Faltantes++;
                    totalPagosFaltantes++;
                    const deuda2027 = montoReq2027 - pago2027.monto;
                    deudas2027 += deuda2027;
                    totalDeudas += deuda2027;
                }
            } else {
                pagos2027Faltantes++;
                totalPagosFaltantes++;
                deudas2027 += montoReq2027;
                totalDeudas += montoReq2027;
            }
        });
    }
    
    console.log("📊 RESULTADOS CALCULADOS:");
    console.log(`AMBOS AÑOS: ${totalPagosCompletos} completos, ${totalPagosFaltantes} faltantes`);
    console.log(`AMBOS AÑOS: Bs ${totalAportes.toFixed(2)} recaudado, Bs ${totalDeudas.toFixed(2)} faltante`);
    console.log(`2026: ${pagos2026Completos} completos, ${pagos2026Faltantes} faltantes, Bs ${aportes2026.toFixed(2)} recaudado, Bs ${deudas2026.toFixed(2)} faltante`);
    console.log(`2027: ${pagos2027Completos} completos, ${pagos2027Faltantes} faltantes, Bs ${aportes2027.toFixed(2)} recaudado, Bs ${deudas2027.toFixed(2)} faltante`);
    
    // ============================================
    // 4. ACTUALIZAR LOS 4 CUADROS GRANDES (AMBOS AÑOS)
    // ============================================
    
    // CUADRO 1: "Estudiantes al Día" → Pagos completos (2026 + 2027)
    const cuadro1 = document.getElementById('estudiantesAlDia');
    if (cuadro1) {
        cuadro1.textContent = totalPagosCompletos;
        console.log(`✅ estudiantesAlDia: ${totalPagosCompletos} pagos completos (2026 + 2027)`);
    }
    
    // CUADRO 2: "Estudiantes que Faltan" → Pagos faltantes (2026 + 2027)
    const cuadro2 = document.getElementById('estudiantesFaltan');
    if (cuadro2) {
        cuadro2.textContent = totalPagosFaltantes;
        console.log(`✅ estudiantesFaltan: ${totalPagosFaltantes} pagos faltantes (2026 + 2027)`);
    }
    
    // CUADRO 3: "Total Aportes" → Dinero recaudado (2026 + 2027)
    const cuadro3 = document.getElementById('totalAportesSeguimiento');
    if (cuadro3) {
        cuadro3.textContent = `Bs ${totalAportes.toFixed(2)}`;
        console.log(`✅ totalAportesSeguimiento: Bs ${totalAportes.toFixed(2)} (2026 + 2027)`);
    }
    
    // CUADRO 4: "Total Deudas" → Dinero faltante (2026 + 2027)
    const cuadro4 = document.getElementById('totalDeudasSeguimiento');
    if (cuadro4) {
        cuadro4.textContent = `Bs ${totalDeudas.toFixed(2)}`;
        console.log(`✅ totalDeudasSeguimiento: Bs ${totalDeudas.toFixed(2)} (2026 + 2027)`);
    }
    
    // ============================================
    // 5. ACTUALIZAR CUADROS POR AÑO (si existen)
    // ============================================
    
    // Para 2026
    try {
        if (document.getElementById('estudiantesAlDia2026')) {
            document.getElementById('estudiantesAlDia2026').textContent = pagos2026Completos;
            console.log(`✅ estudiantesAlDia2026: ${pagos2026Completos}`);
        }
        if (document.getElementById('estudiantesFaltan2026')) {
            document.getElementById('estudiantesFaltan2026').textContent = pagos2026Faltantes;
            console.log(`✅ estudiantesFaltan2026: ${pagos2026Faltantes}`);
        }
        if (document.getElementById('deudaTotal2026')) {
            document.getElementById('deudaTotal2026').textContent = `Bs ${deudas2026.toFixed(2)}`;
            console.log(`✅ deudaTotal2026: Bs ${deudas2026.toFixed(2)}`);
        }
    } catch (e) {
        console.log("Elementos 2026 no disponibles");
    }
    
    // Para 2027
    try {
        if (document.getElementById('estudiantesAlDia2027')) {
            document.getElementById('estudiantesAlDia2027').textContent = pagos2027Completos;
            console.log(`✅ estudiantesAlDia2027: ${pagos2027Completos}`);
        }
        if (document.getElementById('estudiantesFaltan2027')) {
            document.getElementById('estudiantesFaltan2027').textContent = pagos2027Faltantes;
            console.log(`✅ estudiantesFaltan2027: ${pagos2027Faltantes}`);
        }
        if (document.getElementById('deudaTotal2027')) {
            document.getElementById('deudaTotal2027').textContent = `Bs ${deudas2027.toFixed(2)}`;
            console.log(`✅ deudaTotal2027: Bs ${deudas2027.toFixed(2)}`);
        }
    } catch (e) {
        console.log("Elementos 2027 no disponibles");
    }
    
    // ============================================
    // 6. ACTUALIZAR EL RESTO DE LA PÁGINA
    // ============================================
    actualizarTablaSeguimientoEstudiantes();
    actualizarUltimosGastosSeguimiento();
actualizarHistorialGeneral();
    
    console.log("✅ Seguimiento actualizado completamente");
    
    // Actualizar dashboards adicionales (gastos e historial)
    actualizarDashboardsAdicionales();
}
// NUEVA FUNCIÓN: Mostrar gastos en el seguimiento
function actualizarGastosEnSeguimiento() {
    const contenedorGastos = document.getElementById('gastosEnSeguimiento');
    if (!contenedorGastos) return;
    
    contenedorGastos.innerHTML = '';
    
    // Tomar los últimos 10 gastos
    const ultimosGastos = [...datos.gastos]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 10);
    
    if (ultimosGastos.length === 0) {
        contenedorGastos.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-receipt fa-2x"></i>
                <p>No hay gastos registrados</p>
            </div>
        `;
        return;
    }
    
    const tabla = document.createElement('table');
    tabla.className = 'table table-sm table-dark table-hover';
    tabla.innerHTML = `
        <thead>
            <tr>
                <th width="20%">Fecha</th>
                <th width="25%">Categoría</th>
                <th width="35%">Descripción</th>
                <th width="20%" class="text-end">Monto</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    let totalGastos = 0;
    
    ultimosGastos.forEach(gasto => {
        totalGastos += gasto.monto || 0;
        
        tabla.innerHTML += `
            <tr>
                <td>${gasto.fecha || '-'}</td>
                <td>${gasto.categoria || '-'}</td>
                <td>${(gasto.descripcion || '').substring(0, 30)}${(gasto.descripcion || '').length > 30 ? '...' : ''}</td>
                <td class="text-danger text-end">Bs ${(gasto.monto || 0).toFixed(2)}</td>
            </tr>
        `;
    });
    
    // Fila de total
    tabla.innerHTML += `
        <tr class="table-danger">
            <td colspan="3" class="text-end"><strong>Total últimos 10 gastos:</strong></td>
            <td class="text-end"><strong>Bs ${totalGastos.toFixed(2)}</strong></td>
        </tr>
    `;
    
    contenedorGastos.appendChild(tabla);
}

// NUEVA FUNCIÓN: Resumen mensual de ingresos y egresos
function actualizarResumenMensualSeguimiento() {
    const contenedorResumen = document.getElementById('resumenMensualSeguimiento');
    if (!contenedorResumen) return;
    
    contenedorResumen.innerHTML = '';
    
    // Obtener el año actual
    const añoActual = new Date().getFullYear();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Crear estructura para los meses
    const resumenMeses = {};
    meses.forEach((mes, index) => {
        resumenMeses[index + 1] = {
            mes: mes,
            ingresos: 0,
            egresos: 0,
            balance: 0
        };
    });
    
    // Calcular ingresos por mes (aportes estudiantes)
    for (const curso of Object.values(datos.cursos)) {
        if (curso.estudiantes) {
            for (const estudiante of curso.estudiantes) {
                if (estudiante.pagos) {
                    ['2026', '2027'].forEach(anio => {
                        const pago = estudiante.pagos[anio];
                        if (pago && pago.pagado && pago.fecha && pago.monto > 0) {
                            try {
                                const fecha = new Date(pago.fecha);
                                if (fecha.getFullYear() === añoActual) {
                                    const mes = fecha.getMonth() + 1;
                                    resumenMeses[mes].ingresos += pago.monto || 0;
                                }
                            } catch (e) {}
                        }
                    });
                }
            }
        }
    }
    
    // Calcular ingresos por casilleros
    for (const casillero of Object.values(datos.casilleros)) {
        if (casillero.historialPagos) {
            casillero.historialPagos.forEach(pago => {
                if (pago.tipo === 'pago_mensual' && pago.fecha) {
                    try {
                        const fecha = new Date(pago.fecha);
                        if (fecha.getFullYear() === añoActual) {
                            const mes = fecha.getMonth() + 1;
                            resumenMeses[mes].ingresos += pago.monto || 0;
                        }
                    } catch (e) {}
                }
            });
        }
    }
    
    // Calcular egresos por mes (gastos)
    datos.gastos.forEach(gasto => {
        try {
            const fecha = new Date(gasto.fecha);
            if (fecha.getFullYear() === añoActual) {
                const mes = fecha.getMonth() + 1;
                resumenMeses[mes].egresos += gasto.monto || 0;
            }
        } catch (e) {}
    });
    
    // Calcular balance por mes
    Object.keys(resumenMeses).forEach(mesNum => {
        const mes = resumenMeses[mesNum];
        mes.balance = mes.ingresos - mes.egresos;
    });
    
    // Crear tabla de resumen
    const tabla = document.createElement('table');
    tabla.className = 'table table-sm table-dark table-hover';
    tabla.innerHTML = `
        <thead>
            <tr>
                <th width="15%">Mes</th>
                <th width="25%" class="text-end text-success">Ingresos</th>
                <th width="25%" class="text-end text-danger">Egresos</th>
                <th width="25%" class="text-end">Balance</th>
                <th width="10%">Estado</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    let totalIngresos = 0;
    let totalEgresos = 0;
    let totalBalance = 0;
    
    Object.keys(resumenMeses).forEach(mesNum => {
        const mes = resumenMeses[mesNum];
        totalIngresos += mes.ingresos;
        totalEgresos += mes.egresos;
        totalBalance += mes.balance;
        
        const estado = mes.balance > 0 ? 'positivo' : mes.balance < 0 ? 'negativo' : 'neutral';
        const icono = mes.balance > 0 ? '📈' : mes.balance < 0 ? '📉' : '➖';
        
        tabla.innerHTML += `
            <tr>
                <td><strong>${mes.mes}</strong></td>
                <td class="text-success text-end">Bs ${mes.ingresos.toFixed(2)}</td>
                <td class="text-danger text-end">Bs ${mes.egresos.toFixed(2)}</td>
                <td class="${mes.balance > 0 ? 'text-success' : mes.balance < 0 ? 'text-danger' : 'text-muted'} text-end">
                    <strong>Bs ${mes.balance.toFixed(2)}</strong>
                </td>
                <td class="text-center">${icono}</td>
            </tr>
        `;
    });
    
    // Fila de totales
    const estadoTotal = totalBalance > 0 ? 'positivo' : totalBalance < 0 ? 'negativo' : 'neutral';
    const iconoTotal = totalBalance > 0 ? '📈' : totalBalance < 0 ? '📉' : '➖';
    
    tabla.innerHTML += `
        <tr class="table-primary">
            <td><strong>TOTAL ${añoActual}</strong></td>
            <td class="text-success text-end"><strong>Bs ${totalIngresos.toFixed(2)}</strong></td>
            <td class="text-danger text-end"><strong>Bs ${totalEgresos.toFixed(2)}</strong></td>
            <td class="${totalBalance > 0 ? 'text-success' : totalBalance < 0 ? 'text-danger' : 'text-muted'} text-end">
                <strong>Bs ${totalBalance.toFixed(2)}</strong>
            </td>
            <td class="text-center"><strong>${iconoTotal}</strong></td>
        </tr>
    `;
    
    contenedorResumen.appendChild(tabla);
}



// NUEVA FUNCIÓN: Cargar estudiantes para marcar pagos en otros cobros
function cargarEstudiantesParaMarcarPagos() {
    console.log("🔄 Cargando estudiantes para marcar pagos...");
    
    const cursoSeleccionado = document.getElementById('cursoOtroCobro').value;
    const sectorId = parseInt(document.getElementById('sectorCobro').value);
    
    if (!cursoSeleccionado || !sectorId) {
        console.log("⚠️ Curso o sector no seleccionado");
        return;
    }
    
    // FORZAR recarga de datos desde localStorage para asegurar datos actualizados
    try {
        const datosActualizados = JSON.parse(localStorage.getItem('datosFederacion') || '{}');
        if (datosActualizados.sectoresCobro) {
            // Actualizar el sector en memoria con los datos más recientes
            const sectorActualizado = datosActualizados.sectoresCobro.find(s => s.id === sectorId);
            if (sectorActualizado) {
                const sectorIndex = datos.sectoresCobro.findIndex(s => s.id === sectorId);
                if (sectorIndex !== -1) {
                    datos.sectoresCobro[sectorIndex].cobros = sectorActualizado.cobros;
                }
            }
        }
    } catch (error) {
        console.error("Error cargando datos actualizados:", error);
    }
    
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    if (!sector) {
        mostrarMensaje('Sector no encontrado', 'error');
        return;
    }
    
    const datosCurso = datos.cursos[cursoSeleccionado];
    const contenedor = document.getElementById('contenedorMarcarPagos');
    
    // Si el contenedor no existe, crearlo
    if (!contenedor) {
        const form = document.getElementById('formOtroCobro');
        if (!form) return;
        
        const nuevoContenedor = document.createElement('div');
        nuevoContenedor.id = 'contenedorMarcarPagos';
        nuevoContenedor.className = 'contenedor-marcar-pagos mt-3';
        form.parentNode.insertBefore(nuevoContenedor, form.nextSibling);
    }
    
    const contenedorActual = document.getElementById('contenedorMarcarPagos');
    if (!contenedorActual) return;
    
    contenedorActual.style.display = 'block';
    
    // Generar contenido HTML DIRECTO (sin esperar)
    let contenidoHTML = `
        <h5 class="neon-text-blue mb-3">
            <i class="fas fa-check-circle"></i> Marcar Pagos - ${cursoSeleccionado}
            <small class="text-white">(Sector: ${sector.nombre})</small>
        </h5>
        <div class="table-responsive">
            <table class="table tabla-marcar-pagos">
                <thead>
                    <tr>
                        <th width="5%">#</th>
                        <th width="40%">Estudiante</th>
                        <th width="20%">Estado</th>
                        <th width="15%">Monto</th>
                        <th width="20%">Acción</th>
                    </tr>
                </thead>
                <tbody id="listaEstudiantesMarcar">
    `;
    
    // Generar filas de estudiantes INMEDIATAMENTE
    if (datosCurso.estudiantes) {
        datosCurso.estudiantes.forEach((estudiante, index) => {
            const nombreEstudiante = estudiante.nombre || `Estudiante ${index + 1}`;
            
            // Verificar si ya pagó en este sector (con datos actualizados)
            const cobroExistente = sector.cobros ? sector.cobros.find(cobro => 
                cobro.curso === cursoSeleccionado && 
                cobro.estudiante === nombreEstudiante
            ) : null;
            
            const yaPago = !!cobroExistente;
            
            contenidoHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${nombreEstudiante}</td>
                    <td>
                        <span class="${yaPago ? 'badge-estado-tabla badge-pagado' : 'badge-estado-tabla badge-deuda'}">
                            ${yaPago ? '<i class="fas fa-check-circle"></i> PAGADO' : '<i class="fas fa-times-circle"></i> PENDIENTE'}
                        </span>
                        ${yaPago ? `<br><small class="text-muted">Fecha: ${cobroExistente.fecha || 'No registrada'}</small>` : ''}
                    </td>
                    <td><strong>Bs ${sector.monto.toFixed(2)}</strong></td>
                    <td>
                        ${yaPago ? `
                        <button class="btn-desmarcar" onclick="desmarcarPago('${cursoSeleccionado}', ${index}, ${sectorId})">
                            <i class="fas fa-times"></i> Eliminar
                        </button>
                        ` : `
                        <button class="btn-marcar" onclick="marcarComoPagado('${cursoSeleccionado}', ${index}, ${sectorId})">
                            <i class="fas fa-check"></i> Marcar
                        </button>
                        `}
                    </td>
                </tr>
            `;
        });
    }
    
    contenidoHTML += `
                </tbody>
                <tfoot>
                    <tr class="table-primary">
                        <td colspan="3" class="text-end"><strong>Total del curso:</strong></td>
                        <td><strong class="monto-importante">Bs ${(datosCurso.estudiantes ? datosCurso.estudiantes.length * sector.monto : 0).toFixed(2)}</strong></td>
                        <td>
                            <button class="btn-marcar-todos" onclick="marcarTodosComoPagados('${cursoSeleccionado}', ${sectorId})">
                                <i class="fas fa-check-double"></i> Marcar todos
                            </button>
                            <button class="btn-limpiar-todos ms-2" onclick="limpiarTodosLosPagos('${cursoSeleccionado}', ${sectorId})">
                                <i class="fas fa-trash"></i> Limpiar todo
                            </button>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <!-- Botones de exportación -->
        <div class="mt-3 text-center">
            <div class="btn-group" role="group">
                <button class="btn btn-info btn-sm" onclick="exportarPagosSector(${sectorId}, '${cursoSeleccionado}')">
                    <i class="fas fa-file-export"></i> Exportar curso
                </button>
                <button class="btn btn-warning btn-sm" onclick="exportarPagosSector(${sectorId})">
                    <i class="fas fa-file-export"></i> Exportar todo
                </button>
                ${isAdmin ? `
                <button class="btn btn-danger btn-sm" onclick="limpiarTodosLosPagos('${cursoSeleccionado}', ${sectorId})">
                    <i class="fas fa-trash"></i> Limpiar curso
                </button>
                ` : ''}
            </div>
        </div>
        
        <!-- Estadísticas rápidas -->
        <div class="mt-3 p-2 bg-dark rounded">
            <div class="row text-center">
                <div class="col-6">
                    <small class="text-success">Pagados: <strong>${sector.cobros ? sector.cobros.filter(c => c.curso === cursoSeleccionado).length : 0}</strong></small>
                </div>
                <div class="col-6">
                    <small class="text-danger">Pendientes: <strong>${datosCurso.estudiantes ? datosCurso.estudiantes.length - (sector.cobros ? sector.cobros.filter(c => c.curso === cursoSeleccionado).length : 0) : 0}</strong></small>
                </div>
            </div>
        </div>
    `;
    
    // ASIGNAR CONTENIDO INMEDIATAMENTE
    contenedorActual.innerHTML = contenidoHTML;
    
    console.log(`✅ Tabla de marcado actualizada: ${cursoSeleccionado} - Sector ${sector.nombre}`);
    console.log(`📊 Estudiantes: ${datosCurso.estudiantes ? datosCurso.estudiantes.length : 0}, Pagados: ${sector.cobros ? sector.cobros.filter(c => c.curso === cursoSeleccionado).length : 0}`);
}


// NUEVA FUNCIÓN: Marcar estudiante como pagado
function marcarComoPagado(curso, indexEstudiante, sectorId) {
    if (!isAdmin) return;
    
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    const estudiante = datos.cursos[curso].estudiantes[indexEstudiante];
    const hoy = new Date().toISOString().split('T')[0];
    
    // Verificar si ya está pagado
    const nombreEstudiante = estudiante.nombre || `Estudiante ${indexEstudiante + 1}`;
    const yaPago = sector.cobros.some(cobro => 
        cobro.curso === curso && cobro.estudiante === nombreEstudiante
    );
    
    if (yaPago) {
        mostrarMensaje('Este estudiante ya está marcado como pagado', 'info');
        return;
    }
    
    const nuevoCobro = {
        id: Date.now(),
        curso: curso,
        estudiante: nombreEstudiante,
        monto: sector.monto,
        fecha: hoy,
        observaciones: 'Marcado desde sistema',
        timestamp: Date.now()
    };
    
    sector.cobros.push(nuevoCobro);
    datos.totalOtrosCobros += sector.monto;
    
    // SOLO guardarDatos() - ya actualiza todo automáticamente
    guardarDatos();
    
    // Actualizar la vista de marcado INMEDIATAMENTE
    setTimeout(() => {
        cargarEstudiantesParaMarcarPagos();
        mostrarMensaje('Estudiante marcado como pagado', 'success');
    }, 100);
}

// NUEVA FUNCIÓN: Desmarcar pago
function marcarComoPagado(curso, indexEstudiante, sectorId) {
    if (!isAdmin) return;
    
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    const estudiante = datos.cursos[curso].estudiantes[indexEstudiante];
    const hoy = new Date().toISOString().split('T')[0];
    
    // Verificar si ya está pagado
    const nombreEstudiante = estudiante.nombre || `Estudiante ${indexEstudiante + 1}`;
    const yaPago = sector.cobros.some(cobro => 
        cobro.curso === curso && cobro.estudiante === nombreEstudiante
    );
    
    if (yaPago) {
        mostrarMensaje('Este estudiante ya está marcado como pagado', 'info');
        return;
    }
    
    const nuevoCobro = {
        id: Date.now(),
        curso: curso,
        estudiante: nombreEstudiante,
        monto: sector.monto,
        fecha: hoy,
        observaciones: 'Marcado desde sistema',
        timestamp: Date.now()
    };
    
    sector.cobros.push(nuevoCobro);
    datos.totalOtrosCobros += sector.monto;
    
    // Guardar datos primero
    guardarDatos();
    
    // ACTUALIZAR LA FILA INMEDIATAMENTE SIN RECARGAR TODO
    const fila = document.querySelector(`tr:has(td:contains("${nombreEstudiante}"))`);
    if (fila) {
        // Actualizar estado
        const celdaEstado = fila.cells[2];
        celdaEstado.innerHTML = `
            <span class="badge-estado-tabla badge-pagado">
                <i class="fas fa-check-circle"></i> PAGADO
            </span>
            <br><small class="text-muted">Fecha: ${hoy}</small>
        `;
        
        // Actualizar botón
        const celdaAccion = fila.cells[4];
        celdaAccion.innerHTML = `
            <button class="btn-desmarcar" onclick="desmarcarPago('${curso}', ${indexEstudiante}, ${sectorId})">
                <i class="fas fa-times"></i> Eliminar
            </button>
        `;
        
        // Actualizar estadísticas
        actualizarEstadisticasRapidas(curso, sectorId);
        
        // Actualizar totales del pie de tabla
        actualizarTotalesTabla(curso, sectorId);
    }
    
    mostrarMensaje('Estudiante marcado como pagado', 'success');
}

function desmarcarPago(curso, indexEstudiante, sectorId) {
    if (!isAdmin) return;
    
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    const estudiante = datos.cursos[curso].estudiantes[indexEstudiante];
    const nombreEstudiante = estudiante.nombre || `Estudiante ${indexEstudiante + 1}`;
    
    // Encontrar y eliminar el cobro
    const indexCobro = sector.cobros.findIndex(cobro => 
        cobro.curso === curso && cobro.estudiante === nombreEstudiante
    );
    
    if (indexCobro !== -1) {
        const montoEliminado = sector.cobros[indexCobro].monto || 0;
        sector.cobros.splice(indexCobro, 1);
        datos.totalOtrosCobros -= montoEliminado;
        
        // Guardar datos primero
        guardarDatos();
        
        // ACTUALIZAR LA FILA INMEDIATAMENTE SIN RECARGAR TODO
        const fila = document.querySelector(`tr:has(td:contains("${nombreEstudiante}"))`);
        if (fila) {
            // Actualizar estado
            const celdaEstado = fila.cells[2];
            celdaEstado.innerHTML = `
                <span class="badge-estado-tabla badge-deuda">
                    <i class="fas fa-times-circle"></i> PENDIENTE
                </span>
            `;
            
            // Actualizar botón
            const celdaAccion = fila.cells[4];
            celdaAccion.innerHTML = `
                <button class="btn-marcar" onclick="marcarComoPagado('${curso}', ${indexEstudiante}, ${sectorId})">
                    <i class="fas fa-check"></i> Marcar
                </button>
            `;
            
            // Actualizar estadísticas
            actualizarEstadisticasRapidas(curso, sectorId);
            
            // Actualizar totales del pie de tabla
            actualizarTotalesTabla(curso, sectorId);
        }
        
        mostrarMensaje('Pago desmarcado', 'success');
    } else {
        mostrarMensaje('No se encontró el pago', 'error');
    }
}


function actualizarEstadisticasRapidas(curso, sectorId) {
    const contenedor = document.getElementById('contenedorMarcarPagos');
    if (!contenedor) return;
    
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    const datosCurso = datos.cursos[curso];
    
    if (!sector || !datosCurso) return;
    
    // Calcular nuevos valores
    const pagados = sector.cobros.filter(c => c.curso === curso).length;
    const totalEstudiantes = datosCurso.estudiantes ? datosCurso.estudiantes.length : 0;
    const pendientes = totalEstudiantes - pagados;
    
    // Actualizar el div de estadísticas
    const estadisticasDiv = contenedor.querySelector('.bg-dark.rounded');
    if (estadisticasDiv) {
        estadisticasDiv.innerHTML = `
            <div class="row text-center">
                <div class="col-6">
                    <small class="text-success">Pagados: <strong>${pagados}</strong></small>
                </div>
                <div class="col-6">
                    <small class="text-danger">Pendientes: <strong>${pendientes}</strong></small>
                </div>
            </div>
        `;
    }
}

// FUNCIÓN AUXILIAR: Actualizar totales en el pie de tabla
function actualizarTotalesTabla(curso, sectorId) {
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    const datosCurso = datos.cursos[curso];
    
    if (!sector || !datosCurso) return;
    
    const totalPagado = sector.cobros.filter(c => c.curso === curso).reduce((sum, cobro) => sum + (cobro.monto || 0), 0);
    const totalCurso = (datosCurso.estudiantes ? datosCurso.estudiantes.length * sector.monto : 0);
    
    // Actualizar la celda de totales
    const filaTotal = document.querySelector('.tabla-marcar-pagos tfoot tr');
    if (filaTotal) {
        const celdaTotal = filaTotal.cells[3];
        celdaTotal.innerHTML = `<strong class="monto-importante">Bs ${totalCurso.toFixed(2)}</strong>`;
    }
}

// MODIFICAR la función para marcar todos (opcional, puedes dejarla recargando)
function marcarTodosComoPagados(curso, sectorId) {
    if (!isAdmin) return;
    
    if (!confirm(`¿Marcar a TODOS los estudiantes de ${curso} como pagados en este sector?\n\nEsta acción no se puede deshacer fácilmente.`)) {
        return;
    }
    
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    const datosCurso = datos.cursos[curso];
    const hoy = new Date().toISOString().split('T')[0];
    
    let estudiantesMarcados = 0;
    let estudiantesYaPagados = 0;
    
    datosCurso.estudiantes.forEach((estudiante, index) => {
        const nombreEstudiante = estudiante.nombre || `Estudiante ${index + 1}`;
        
        // Verificar si ya está pagado
        const yaPago = sector.cobros.some(cobro => 
            cobro.curso === curso && cobro.estudiante === nombreEstudiante
        );
        
        if (!yaPago) {
            sector.cobros.push({
                id: Date.now() + index,
                curso: curso,
                estudiante: nombreEstudiante,
                monto: sector.monto,
                fecha: hoy,
                observaciones: 'Marcado masivamente desde sistema',
                timestamp: Date.now() + index
            });
            
            datos.totalOtrosCobros += sector.monto;
            estudiantesMarcados++;
            
            // ACTUALIZAR FILA SI ESTÁ VISIBLE
            const fila = document.querySelector(`tr:has(td:contains("${nombreEstudiante}"))`);
            if (fila) {
                // Actualizar estado
                const celdaEstado = fila.cells[2];
                celdaEstado.innerHTML = `
                    <span class="badge-estado-tabla badge-pagado">
                        <i class="fas fa-check-circle"></i> PAGADO
                    </span>
                    <br><small class="text-muted">Fecha: ${hoy}</small>
                `;
                
                // Actualizar botón
                const celdaAccion = fila.cells[4];
                celdaAccion.innerHTML = `
                    <button class="btn-desmarcar" onclick="desmarcarPago('${curso}', ${index}, ${sectorId})">
                        <i class="fas fa-times"></i> Eliminar
                    </button>
                `;
            }
        } else {
            estudiantesYaPagados++;
        }
    });
    
    // Guardar datos
    guardarDatos();
    
    // Actualizar estadísticas y totales
    actualizarEstadisticasRapidas(curso, sectorId);
    actualizarTotalesTabla(curso, sectorId);
    
    mostrarMensaje(`${estudiantesMarcados} estudiantes marcados como pagados (${estudiantesYaPagados} ya estaban pagados)`, 'success');
}

// MODIFICAR la función para limpiar todos (opcional, puedes dejarla recargando)
// NUEVA FUNCIÓN: Marcar todos como pagados
function marcarTodosComoPagados(curso, sectorId) {
    if (!isAdmin) return;
    
    if (!confirm(`¿Marcar a TODOS los estudiantes de ${curso} como pagados en este sector?\n\nEsta acción no se puede deshacer fácilmente.`)) {
        return;
    }
    
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    const datosCurso = datos.cursos[curso];
    const hoy = new Date().toISOString().split('T')[0];
    
    let estudiantesMarcados = 0;
    let estudiantesYaPagados = 0;
    
    datosCurso.estudiantes.forEach((estudiante, index) => {
        const nombreEstudiante = estudiante.nombre || `Estudiante ${index + 1}`;
        
        // Verificar si ya está pagado
        const yaPago = sector.cobros.some(cobro => 
            cobro.curso === curso && cobro.estudiante === nombreEstudiante
        );
        
        if (!yaPago) {
            sector.cobros.push({
                id: Date.now() + index,
                curso: curso,
                estudiante: nombreEstudiante,
                monto: sector.monto,
                fecha: hoy,
                observaciones: 'Marcado masivamente desde sistema',
                timestamp: Date.now() + index
            });
            
            datos.totalOtrosCobros += sector.monto;
            estudiantesMarcados++;
        } else {
            estudiantesYaPagados++;
        }
    });
    
    // SOLO guardarDatos() - ya actualiza todo automáticamente
    guardarDatos();
    
    // Actualizar la vista INMEDIATAMENTE
    setTimeout(() => {
        cargarEstudiantesParaMarcarPagos();
        mostrarMensaje(`${estudiantesMarcados} estudiantes marcados como pagados (${estudiantesYaPagados} ya estaban pagados)`, 'success');
    }, 100);
}

// NUEVA FUNCIÓN: Limpiar todos los pagos de un curso
function limpiarTodosLosPagos(curso, sectorId) {
    if (!isAdmin) return;
    
    if (!confirm(`¿Eliminar TODOS los pagos de ${curso} en este sector?\n\nEsta acción eliminará permanentemente todos los registros de pago de este curso en el sector seleccionado.`)) {
        return;
    }
    
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    const datosCurso = datos.cursos[curso];
    
    // Filtrar solo los cobros de este curso
    const cobrosAEliminar = sector.cobros.filter(cobro => cobro.curso === curso);
    const totalEliminado = cobrosAEliminar.reduce((sum, cobro) => sum + (cobro.monto || 0), 0);
    
    // Mantener solo los cobros de otros cursos
    sector.cobros = sector.cobros.filter(cobro => cobro.curso !== curso);
    datos.totalOtrosCobros -= totalEliminado;
    
    // Guardar datos
    guardarDatos();
    
    // ACTUALIZAR TODAS LAS FILAS INMEDIATAMENTE
    datosCurso.estudiantes.forEach((estudiante, index) => {
        const nombreEstudiante = estudiante.nombre || `Estudiante ${index + 1}`;
        const fila = document.querySelector(`tr:has(td:contains("${nombreEstudiante}"))`);
        
        if (fila) {
            // Actualizar estado
            const celdaEstado = fila.cells[2];
            celdaEstado.innerHTML = `
                <span class="badge-estado-tabla badge-deuda">
                    <i class="fas fa-times-circle"></i> PENDIENTE
                </span>
            `;
            
            // Actualizar botón
            const celdaAccion = fila.cells[4];
            celdaAccion.innerHTML = `
                <button class="btn-marcar" onclick="marcarComoPagado('${curso}', ${index}, ${sectorId})">
                    <i class="fas fa-check"></i> Marcar
                </button>
            `;
        }
    });
    
    // Actualizar estadísticas y totales
    actualizarEstadisticasRapidas(curso, sectorId);
    actualizarTotalesTabla(curso, sectorId);
    
    mostrarMensaje(`Se eliminaron ${cobrosAEliminar.length} pagos del curso (Total: Bs ${totalEliminado.toFixed(2)})`, 'success');
}

// NUEVA FUNCIÓN: Auto-marcar cuando se seleccione curso (Event Listener)
function configurarAutoMarcado() {
    const cursoSelect = document.getElementById('cursoOtroCobro');
    const sectorSelect = document.getElementById('sectorCobro');
    
    if (cursoSelect && sectorSelect) {
        // Auto-cargar cuando ambos estén seleccionados
        cursoSelect.addEventListener('change', function() {
            if (sectorSelect.value) {
                setTimeout(() => cargarEstudiantesParaMarcarPagos(), 100);
            }
        });
        
        sectorSelect.addEventListener('change', function() {
            if (cursoSelect.value) {
                setTimeout(() => cargarEstudiantesParaMarcarPagos(), 100);
            }
        });
    }
}

// NUEVA FUNCIÓN: Exportar lista de pagos del sector
function exportarPagosSector(sectorId, curso = null) {
    const sector = datos.sectoresCobro.find(s => s.id === sectorId);
    if (!sector) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    let cobrosFiltrados = sector.cobros;
    
    // Filtrar por curso si se especifica
    if (curso) {
        cobrosFiltrados = cobrosFiltrados.filter(cobro => cobro.curso === curso);
        csvContent += `Lista de Pagos - ${sector.nombre} - ${curso}\n\n`;
    } else {
        csvContent += `Lista de Pagos - ${sector.nombre}\n\n`;
    }
    
    csvContent += "Curso;Estudiante;Monto;Fecha;Observaciones\n";
    
    cobrosFiltrados.forEach(cobro => {
        const fila = [
            cobro.curso,
            cobro.estudiante,
            `Bs ${(cobro.monto || 0).toFixed(2)}`,
            cobro.fecha || '-',
            cobro.observaciones || '-'
        ].join(";");
        
        csvContent += fila + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const nombreArchivo = curso ? 
        `pagos_${sector.nombre.replace(/[^a-z0-9]/gi, '_')}_${curso.replace(/[^a-z0-9]/gi, '_')}.csv` :
        `pagos_${sector.nombre.replace(/[^a-z0-9]/gi, '_')}.csv`;
    
    link.setAttribute("download", nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarMensaje('Archivo CSV exportado exitosamente', 'success');
}

// NUEVA FUNCIÓN: Agregar botón de exportación al contenedor de marcado
function agregarBotonesExportacion(cursoSeleccionado, sectorId) {
    const contenedorActual = document.getElementById('contenedorMarcarPagos');
    if (!contenedorActual) return;
    
    const botonesDiv = document.createElement('div');
    botonesDiv.className = 'mt-3 text-center';
    botonesDiv.innerHTML = `
        <div class="btn-group" role="group">
            <button class="btn btn-info btn-sm" onclick="exportarPagosSector(${sectorId}, '${cursoSeleccionado}')">
                <i class="fas fa-file-export"></i> Exportar curso
            </button>
            <button class="btn btn-warning btn-sm" onclick="exportarPagosSector(${sectorId})">
                <i class="fas fa-file-export"></i> Exportar todo
            </button>
            ${isAdmin ? `
            <button class="btn btn-danger btn-sm" onclick="limpiarTodosLosPagos('${cursoSeleccionado}', ${sectorId})">
                <i class="fas fa-trash"></i> Limpiar curso
            </button>
            ` : ''}
        </div>
    `;
    
    // Agregar después de la tabla
    const tabla = contenedorActual.querySelector('table');
    if (tabla) {
        tabla.parentNode.appendChild(botonesDiv);
    }
}

// LLAMAR AL CARGAR
document.addEventListener('DOMContentLoaded', function() {
    inicializarSelectorCursos();
    configurarAutoMarcado();
});

// ================================================
// FUNCIONES NUEVAS PARA PAGOS DE CASILLEROS
// ================================================

// TOGGLE PAGO POR MES (marcar/desmarcar)
function togglePagoMes(numeroCasillero, anio, mes) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    const mesDiv = document.getElementById(`mes-${numeroCasillero}-${anio}-${mes}`);
    if (!mesDiv) return;
    
    const estaPagado = mesDiv.classList.contains('mes-pagado');
    
    if (estaPagado) {
        // Desmarcar pago
        mesDiv.classList.remove('mes-pagado');
        mesDiv.classList.add('mes-no-pagado');
        
        // Actualizar indicador
        const indicador = mesDiv.querySelector('.indicador-admin');
        if (indicador) indicador.textContent = '○';
        
        // Quitar del array de meses pagados
        if (anio === 2026) {
            const index = casillero.mesesPagados2026.indexOf(mes);
            if (index > -1) casillero.mesesPagados2026.splice(index, 1);
        } else if (anio === 2027) {
            const index = casillero.mesesPagados2027.indexOf(mes);
            if (index > -1) casillero.mesesPagados2027.splice(index, 1);
        }
    } else {
        // Marcar como pagado
        mesDiv.classList.remove('mes-no-pagado');
        mesDiv.classList.add('mes-pagado');
        
        // Actualizar indicador
        const indicador = mesDiv.querySelector('.indicador-admin');
        if (indicador) indicador.textContent = '✓';
        
        // Agregar al array de meses pagados
        if (anio === 2026) {
            if (!casillero.mesesPagados2026.includes(mes)) {
                casillero.mesesPagados2026.push(mes);
            }
        } else if (anio === 2027) {
            if (!casillero.mesesPagados2027.includes(mes)) {
                casillero.mesesPagados2027.push(mes);
            }
        }
    }
    
    // Actualizar contadores
    actualizarContadoresCasillero(numeroCasillero);
}

// MARCAR TODOS LOS MESES DE UN AÑO
function marcarTodosMeses(numeroCasillero, anio) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    // Resetear arrays
    if (anio === 2026) {
        casillero.mesesPagados2026 = [];
    } else if (anio === 2027) {
        casillero.mesesPagados2027 = [];
    }
    
    // Marcar todos los meses como pagados
    for (let mes = 1; mes <= 12; mes++) {
        const mesDiv = document.getElementById(`mes-${numeroCasillero}-${anio}-${mes}`);
        if (mesDiv) {
            mesDiv.classList.remove('mes-no-pagado');
            mesDiv.classList.add('mes-pagado');
            
            const indicador = mesDiv.querySelector('.indicador-admin');
            if (indicador) indicador.textContent = '✓';
            
            // Agregar al array
            if (anio === 2026) {
                if (!casillero.mesesPagados2026.includes(mes)) {
                    casillero.mesesPagados2026.push(mes);
                }
            } else if (anio === 2027) {
                if (!casillero.mesesPagados2027.includes(mes)) {
                    casillero.mesesPagados2027.push(mes);
                }
            }
        }
    }
    
    // Actualizar contadores
    actualizarContadoresCasillero(numeroCasillero);
}

// REGISTRAR PAGO MASIVO (guardar cambios de un año)
function registrarPagoMasivo(numeroCasillero, anio) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    const mesesPagados = anio === 2026 ? casillero.mesesPagados2026 : casillero.mesesPagados2027;
    const fechaActual = new Date().toISOString().split('T')[0];
    
    // Verificar si ya existe historial
    if (!casillero.historialPagos) {
        casillero.historialPagos = [];
    }
    
    // Eliminar pagos antiguos de este año
    casillero.historialPagos = casillero.historialPagos.filter(pago => 
        !(pago.anio === anio && pago.tipo === 'pago_mensual')
    );
    
    // Crear nuevos registros para cada mes pagado
    mesesPagados.forEach(mes => {
        casillero.historialPagos.push({
            fecha: fechaActual,
            anio: anio,
            mes: mes,
            nombreMes: obtenerNombreMesCompleto(mes),
            monto: casillero.montoMensual || 10.00,
            estudiante: casillero.estudiante,
            tipo: 'pago_mensual',
            timestamp: Date.now()
        });
    });
    
    // Calcular total pagado
    const totalMesesPagados = casillero.mesesPagados2026.length + casillero.mesesPagados2027.length;
    casillero.totalPagado = totalMesesPagados * (casillero.montoMensual || 10.00);
    
    // Guardar datos
    guardarDatos();
    actualizarVistaCasilleros();
    actualizarDetalleCajaFuerte();
    
    // Actualizar historial en el modal
    verHistorialCasillero(numeroCasillero);
    
    mostrarMensaje(`Pagos del ${anio} registrados exitosamente`, 'success');
}

// REGISTRAR PAGO MENSUAL (mes actual)
function registrarPagoMensual(numeroCasillero) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero || !casillero.estudiante) {
        mostrarMensaje('El casillero no tiene estudiante asignado', 'error');
        return;
    }
    
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth() + 1; // Enero = 1
    
    if (anioActual !== 2026 && anioActual !== 2027) {
        mostrarMensaje('Solo se pueden registrar pagos para 2026 o 2027', 'error');
        return;
    }
    
    // Verificar si ya está pagado este mes
    const mesesPagados = anioActual === 2026 ? casillero.mesesPagados2026 : casillero.mesesPagados2027;
    if (mesesPagados.includes(mesActual)) {
        mostrarMensaje('Este mes ya está pagado', 'info');
        return;
    }
    
    // Marcar como pagado
    if (anioActual === 2026) {
        casillero.mesesPagados2026.push(mesActual);
    } else {
        casillero.mesesPagados2027.push(mesActual);
    }
    
    // Agregar al historial
    if (!casillero.historialPagos) {
        casillero.historialPagos = [];
    }
    
    casillero.historialPagos.push({
        fecha: hoy.toISOString().split('T')[0],
        anio: anioActual,
        mes: mesActual,
        nombreMes: obtenerNombreMesCompleto(mesActual),
        monto: casillero.montoMensual || 10.00,
        estudiante: casillero.estudiante,
        tipo: 'pago_mensual',
        timestamp: Date.now()
    });
    
    // Calcular total pagado
    const totalMesesPagados = casillero.mesesPagados2026.length + casillero.mesesPagados2027.length;
    casillero.totalPagado = totalMesesPagados * (casillero.montoMensual || 10.00);
    
    // Guardar datos
    guardarDatos();
    actualizarVistaCasilleros();
    actualizarDetalleCajaFuerte();
    
    // Actualizar vista del modal
    verHistorialCasillero(numeroCasillero);
    
    mostrarMensaje(`Pago de ${obtenerNombreMesCompleto(mesActual)} ${anioActual} registrado exitosamente`, 'success');
}

// ACTUALIZAR CONTADORES EN EL MODAL
function actualizarContadoresCasillero(numeroCasillero) {
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    const meses2026 = casillero.mesesPagados2026.length;
    const meses2027 = casillero.mesesPagados2027.length;
    const totalMeses = meses2026 + meses2027;
    
    // Actualizar contadores en el modal
    const contador2026 = document.getElementById('contador2026');
    const contador2027 = document.getElementById('contador2027');
    const contadorTotal = document.getElementById('contadorTotal');
    
    if (contador2026) contador2026.textContent = `${meses2026}/12`;
    if (contador2027) contador2027.textContent = `${meses2027}/12`;
    if (contadorTotal) contadorTotal.textContent = `${totalMeses}/24`;
}

// ELIMINAR PAGO INDIVIDUAL
function eliminarPagoIndividual(numeroCasillero, anio, mes) {
    if (!isAdmin) return;
    
    if (!confirm(`¿Eliminar el pago de ${obtenerNombreMesCompleto(mes)} ${anio}?`)) {
        return;
    }
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    // Eliminar del historial
    if (casillero.historialPagos) {
        casillero.historialPagos = casillero.historialPagos.filter(pago => 
            !(pago.anio === anio && pago.mes === mes && pago.tipo === 'pago_mensual')
        );
    }
    
    // Eliminar del array de meses pagados
    if (anio === 2026) {
        const index = casillero.mesesPagados2026.indexOf(mes);
        if (index > -1) casillero.mesesPagados2026.splice(index, 1);
    } else if (anio === 2027) {
        const index = casillero.mesesPagados2027.indexOf(mes);
        if (index > -1) casillero.mesesPagados2027.splice(index, 1);
    }
    
    // Recalcular total pagado
    const totalMesesPagados = casillero.mesesPagados2026.length + casillero.mesesPagados2027.length;
    casillero.totalPagado = totalMesesPagados * (casillero.montoMensual || 10.00);
    
    // Guardar datos
    guardarDatos();
    actualizarVistaCasilleros();
    actualizarDetalleCajaFuerte();
    
    // Actualizar vista del modal
    verHistorialCasillero(numeroCasillero);
    
    mostrarMensaje('Pago eliminado exitosamente', 'success');
}

// ABRIR MODAL PARA LIBERAR CASILLERO
function abrirModalLiberarCasillero(numeroCasillero) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    if (!casillero.estudiante || casillero.estudiante.trim() === '') {
        mostrarMensaje('Este casillero ya está libre', 'info');
        return;
    }
    
    // Cerrar el modal actual
    const modalActual = bootstrap.Modal.getInstance(document.getElementById('modalHistorialCasilleroCompacto'));
    if (modalActual) modalActual.hide();
    
    // Mostrar modal de confirmación
    const modalConfirmacion = new bootstrap.Modal(document.getElementById('modalLiberarCasillero'));
    
    // Configurar contenido del modal
    document.getElementById('modalLiberarTitulo').textContent = `Liberar Casillero ${numeroCasillero}`;
    document.getElementById('modalLiberarInfo').innerHTML = `
        <p><strong>Estudiante actual:</strong> ${casillero.estudiante}</p>
        <p><strong>Total pagado:</strong> Bs ${casillero.totalPagado?.toFixed(2) || '0.00'}</p>
        <p><strong>Meses pagados 2026:</strong> ${casillero.mesesPagados2026?.length || 0}/12</p>
        <p><strong>Meses pagados 2027:</strong> ${casillero.mesesPagados2027?.length || 0}/12</p>
    `;
    
    // Configurar función de liberación
    document.getElementById('btnConfirmarLiberar').onclick = function() {
        liberarCasilleroConfirmado(numeroCasillero);
        modalConfirmacion.hide();
    };
    
    modalConfirmacion.show();
}

// LIBERAR CASILLERO CONFIRMADO
function liberarCasilleroConfirmado(numeroCasillero) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    // Registrar en historial antes de liberar
    const fechaActual = new Date().toISOString().split('T')[0];
    if (!casillero.historialPagos) casillero.historialPagos = [];
    
    casillero.historialPagos.push({
        fecha: fechaActual,
        anio: new Date().getFullYear(),
        mes: 0,
        nombreMes: 'Liberación',
        monto: 0,
        estudiante: '',
        tipo: 'liberacion',
        descripcion: `Casillero ${numeroCasillero} liberado. Estudiante anterior: ${casillero.estudiante}`,
        timestamp: Date.now()
    });
    
    // Liberar casillero
    datos.casilleros[numeroCasillero] = {
        numero: numeroCasillero,
        estudiante: '',
        montoMensual: 10.00,
        mesesPagados2026: [],
        mesesPagados2027: [],
        historialPagos: casillero.historialPagos, // Mantener historial
        totalPagado: 0,
        fechaAsignacion: '',
        estado: 'libre',
        ultimaActualizacion: fechaActual
    };
    
    // Guardar datos
    guardarDatos();
    actualizarVistaCasilleros();
    actualizarDetalleCajaFuerte();
    
    // Mostrar mensaje
    mostrarMensaje(`Casillero ${numeroCasillero} liberado exitosamente`, 'success');
    
    // Reabrir el modal de historial (ahora vacío)
    setTimeout(() => verHistorialCasillero(numeroCasillero), 500);
}

// ABRIR MODAL PARA CAMBIAR ESTUDIANTE
function abrirModalCambiarEstudiante(numeroCasillero) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    // Cerrar el modal actual
    const modalActual = bootstrap.Modal.getInstance(document.getElementById('modalHistorialCasilleroCompacto'));
    if (modalActual) modalActual.hide();
    
    // Mostrar modal de cambio de estudiante
    const modalCambio = new bootstrap.Modal(document.getElementById('modalCambiarEstudiante'));
    
    // Configurar contenido del modal
    document.getElementById('modalCambioTitulo').textContent = `Cambiar Estudiante - Casillero ${numeroCasillero}`;
    document.getElementById('modalCambioInfo').innerHTML = `
        <p><strong>Estudiante actual:</strong> ${casillero.estudiante || 'Sin asignar'}</p>
    `;
    
    // Limpiar y configurar input
    const inputNuevoEstudiante = document.getElementById('nuevoEstudiante');
    inputNuevoEstudiante.value = casillero.estudiante || '';
    inputNuevoEstudiante.focus();
    
    // Configurar función de cambio
    document.getElementById('btnConfirmarCambio').onclick = function() {
        cambiarEstudianteConfirmado(numeroCasillero, inputNuevoEstudiante.value);
        modalCambio.hide();
    };
    
    modalCambio.show();
}

// CAMBIAR ESTUDIANTE CONFIRMADO
function cambiarEstudianteConfirmado(numeroCasillero, nuevoEstudiante) {
    if (!isAdmin) return;
    
    if (!nuevoEstudiante.trim()) {
        mostrarMensaje('Ingrese el nombre del estudiante', 'error');
        return;
    }
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    const estudianteAnterior = casillero.estudiante || 'Sin asignar';
    
    // Registrar en historial
    const fechaActual = new Date().toISOString().split('T')[0];
    if (!casillero.historialPagos) casillero.historialPagos = [];
    
    casillero.historialPagos.push({
        fecha: fechaActual,
        anio: new Date().getFullYear(),
        mes: 0,
        nombreMes: 'Cambio',
        monto: 0,
        estudiante: nuevoEstudiante,
        tipo: 'cambio_estudiante',
        descripcion: `Cambio de estudiante: ${estudianteAnterior} → ${nuevoEstudiante}`,
        timestamp: Date.now()
    });
    
    // Actualizar casillero
    casillero.estudiante = nuevoEstudiante;
    casillero.estado = nuevoEstudiante.trim() ? 'ocupado' : 'libre';
    casillero.ultimaActualizacion = fechaActual;
    
    // Si no hay fecha de asignación, establecerla
    if (!casillero.fechaAsignacion) {
        casillero.fechaAsignacion = fechaActual;
    }
    
    // Guardar datos
    guardarDatos();
    actualizarVistaCasilleros();
    
    // Mostrar mensaje
    mostrarMensaje(`Estudiante cambiado exitosamente: ${estudianteAnterior} → ${nuevoEstudiante}`, 'success');
    
    // Reabrir el modal de historial
    setTimeout(() => verHistorialCasillero(numeroCasillero), 500);
}

// ================================================
// FUNCIONES NUEVAS PARA PAGOS DE CASILLEROS
// ================================================

// TOGGLE PAGO POR MES (marcar/desmarcar)
function togglePagoMes(numeroCasillero, anio, mes) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    const mesDiv = document.getElementById(`mes-${numeroCasillero}-${anio}-${mes}`);
    if (!mesDiv) return;
    
    const estaPagado = mesDiv.classList.contains('mes-pagado');
    
    if (estaPagado) {
        // Desmarcar pago
        mesDiv.classList.remove('mes-pagado');
        mesDiv.classList.add('mes-no-pagado');
        
        // Actualizar indicador
        const indicador = mesDiv.querySelector('.indicador-admin');
        if (indicador) indicador.textContent = '○';
        
        // Quitar del array de meses pagados
        if (anio === 2026) {
            const index = casillero.mesesPagados2026.indexOf(mes);
            if (index > -1) casillero.mesesPagados2026.splice(index, 1);
        } else if (anio === 2027) {
            const index = casillero.mesesPagados2027.indexOf(mes);
            if (index > -1) casillero.mesesPagados2027.splice(index, 1);
        }
    } else {
        // Marcar como pagado
        mesDiv.classList.remove('mes-no-pagado');
        mesDiv.classList.add('mes-pagado');
        
        // Actualizar indicador
        const indicador = mesDiv.querySelector('.indicador-admin');
        if (indicador) indicador.textContent = '✓';
        
        // Agregar al array de meses pagados
        if (anio === 2026) {
            if (!casillero.mesesPagados2026.includes(mes)) {
                casillero.mesesPagados2026.push(mes);
            }
        } else if (anio === 2027) {
            if (!casillero.mesesPagados2027.includes(mes)) {
                casillero.mesesPagados2027.push(mes);
            }
        }
    }
    
    // Actualizar contadores
    actualizarContadoresCasillero(numeroCasillero);
}

// MARCAR TODOS LOS MESES DE UN AÑO
function marcarTodosMeses(numeroCasillero, anio) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    // Resetear arrays
    if (anio === 2026) {
        casillero.mesesPagados2026 = [];
    } else if (anio === 2027) {
        casillero.mesesPagados2027 = [];
    }
    
    // Marcar todos los meses como pagados
    for (let mes = 1; mes <= 12; mes++) {
        const mesDiv = document.getElementById(`mes-${numeroCasillero}-${anio}-${mes}`);
        if (mesDiv) {
            mesDiv.classList.remove('mes-no-pagado');
            mesDiv.classList.add('mes-pagado');
            
            const indicador = mesDiv.querySelector('.indicador-admin');
            if (indicador) indicador.textContent = '✓';
            
            // Agregar al array
            if (anio === 2026) {
                if (!casillero.mesesPagados2026.includes(mes)) {
                    casillero.mesesPagados2026.push(mes);
                }
            } else if (anio === 2027) {
                if (!casillero.mesesPagados2027.includes(mes)) {
                    casillero.mesesPagados2027.push(mes);
                }
            }
        }
    }
    
    // Actualizar contadores
    actualizarContadoresCasillero(numeroCasillero);
}

// REGISTRAR PAGO MASIVO (guardar cambios de un año)
function registrarPagoMasivo(numeroCasillero, anio) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    const mesesPagados = anio === 2026 ? casillero.mesesPagados2026 : casillero.mesesPagados2027;
    const fechaActual = new Date().toISOString().split('T')[0];
    
    // Verificar si ya existe historial
    if (!casillero.historialPagos) {
        casillero.historialPagos = [];
    }
    
    // Eliminar pagos antiguos de este año
    casillero.historialPagos = casillero.historialPagos.filter(pago => 
        !(pago.anio === anio && pago.tipo === 'pago_mensual')
    );
    
    // Crear nuevos registros para cada mes pagado
    mesesPagados.forEach(mes => {
        casillero.historialPagos.push({
            fecha: fechaActual,
            anio: anio,
            mes: mes,
            nombreMes: obtenerNombreMesCompleto(mes),
            monto: casillero.montoMensual || 10.00,
            estudiante: casillero.estudiante,
            tipo: 'pago_mensual',
            timestamp: Date.now()
        });
    });
    
    // Calcular total pagado
    const totalMesesPagados = casillero.mesesPagados2026.length + casillero.mesesPagados2027.length;
    casillero.totalPagado = totalMesesPagados * (casillero.montoMensual || 10.00);
    
    // Guardar datos
    guardarDatos();
    actualizarVistaCasilleros();
    actualizarDetalleCajaFuerte();
    
    // Actualizar historial en el modal
    verHistorialCasillero(numeroCasillero);
    
    mostrarMensaje(`Pagos del ${anio} registrados exitosamente`, 'success');
}

// REGISTRAR PAGO MENSUAL (mes actual)
function registrarPagoMensual(numeroCasillero) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero || !casillero.estudiante) {
        mostrarMensaje('El casillero no tiene estudiante asignado', 'error');
        return;
    }
    
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth() + 1; // Enero = 1
    
    if (anioActual !== 2026 && anioActual !== 2027) {
        mostrarMensaje('Solo se pueden registrar pagos para 2026 o 2027', 'error');
        return;
    }
    
    // Verificar si ya está pagado este mes
    const mesesPagados = anioActual === 2026 ? casillero.mesesPagados2026 : casillero.mesesPagados2027;
    if (mesesPagados.includes(mesActual)) {
        mostrarMensaje('Este mes ya está pagado', 'info');
        return;
    }
    
    // Marcar como pagado
    if (anioActual === 2026) {
        casillero.mesesPagados2026.push(mesActual);
    } else {
        casillero.mesesPagados2027.push(mesActual);
    }
    
    // Agregar al historial
    if (!casillero.historialPagos) {
        casillero.historialPagos = [];
    }
    
    casillero.historialPagos.push({
        fecha: hoy.toISOString().split('T')[0],
        anio: anioActual,
        mes: mesActual,
        nombreMes: obtenerNombreMesCompleto(mesActual),
        monto: casillero.montoMensual || 10.00,
        estudiante: casillero.estudiante,
        tipo: 'pago_mensual',
        timestamp: Date.now()
    });
    
    // Calcular total pagado
    const totalMesesPagados = casillero.mesesPagados2026.length + casillero.mesesPagados2027.length;
    casillero.totalPagado = totalMesesPagados * (casillero.montoMensual || 10.00);
    
    // Guardar datos
    guardarDatos();
    actualizarVistaCasilleros();
    actualizarDetalleCajaFuerte();
    
    // Actualizar vista del modal
    verHistorialCasillero(numeroCasillero);
    
    mostrarMensaje(`Pago de ${obtenerNombreMesCompleto(mesActual)} ${anioActual} registrado exitosamente`, 'success');
}

// ACTUALIZAR CONTADORES EN EL MODAL
function actualizarContadoresCasillero(numeroCasillero) {
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    const meses2026 = casillero.mesesPagados2026.length;
    const meses2027 = casillero.mesesPagados2027.length;
    const totalMeses = meses2026 + meses2027;
    
    // Actualizar contadores en el modal
    const contador2026 = document.getElementById('contador2026');
    const contador2027 = document.getElementById('contador2027');
    const contadorTotal = document.getElementById('contadorTotal');
    
    if (contador2026) contador2026.textContent = `${meses2026}/12`;
    if (contador2027) contador2027.textContent = `${meses2027}/12`;
    if (contadorTotal) contadorTotal.textContent = `${totalMeses}/24`;
}

// ELIMINAR PAGO INDIVIDUAL
function eliminarPagoIndividual(numeroCasillero, anio, mes) {
    if (!isAdmin) return;
    
    if (!confirm(`¿Eliminar el pago de ${obtenerNombreMesCompleto(mes)} ${anio}?`)) {
        return;
    }
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    // Eliminar del historial
    if (casillero.historialPagos) {
        casillero.historialPagos = casillero.historialPagos.filter(pago => 
            !(pago.anio === anio && pago.mes === mes && pago.tipo === 'pago_mensual')
        );
    }
    
    // Eliminar del array de meses pagados
    if (anio === 2026) {
        const index = casillero.mesesPagados2026.indexOf(mes);
        if (index > -1) casillero.mesesPagados2026.splice(index, 1);
    } else if (anio === 2027) {
        const index = casillero.mesesPagados2027.indexOf(mes);
        if (index > -1) casillero.mesesPagados2027.splice(index, 1);
    }
    
    // Recalcular total pagado
    const totalMesesPagados = casillero.mesesPagados2026.length + casillero.mesesPagados2027.length;
    casillero.totalPagado = totalMesesPagados * (casillero.montoMensual || 10.00);
    
    // Guardar datos
    guardarDatos();
    actualizarVistaCasilleros();
    actualizarDetalleCajaFuerte();
    
    // Actualizar vista del modal
    verHistorialCasillero(numeroCasillero);
    
    mostrarMensaje('Pago eliminado exitosamente', 'success');
}

// ABRIR MODAL PARA LIBERAR CASILLERO
function abrirModalLiberarCasillero(numeroCasillero) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    if (!casillero.estudiante || casillero.estudiante.trim() === '') {
        mostrarMensaje('Este casillero ya está libre', 'info');
        return;
    }
    
    // Cerrar el modal actual
    const modalActual = bootstrap.Modal.getInstance(document.getElementById('modalHistorialCasilleroCompacto'));
    if (modalActual) modalActual.hide();
    
    // Mostrar modal de confirmación
    const modalConfirmacion = new bootstrap.Modal(document.getElementById('modalLiberarCasillero'));
    
    // Configurar contenido del modal
    document.getElementById('modalLiberarTitulo').textContent = `Liberar Casillero ${numeroCasillero}`;
    document.getElementById('modalLiberarInfo').innerHTML = `
        <p><strong>Estudiante actual:</strong> ${casillero.estudiante}</p>
        <p><strong>Total pagado:</strong> Bs ${casillero.totalPagado?.toFixed(2) || '0.00'}</p>
        <p><strong>Meses pagados 2026:</strong> ${casillero.mesesPagados2026?.length || 0}/12</p>
        <p><strong>Meses pagados 2027:</strong> ${casillero.mesesPagados2027?.length || 0}/12</p>
    `;
    
    // Configurar función de liberación
    document.getElementById('btnConfirmarLiberar').onclick = function() {
        liberarCasilleroConfirmado(numeroCasillero);
        modalConfirmacion.hide();
    };
    
    modalConfirmacion.show();
}

// LIBERAR CASILLERO CONFIRMADO
function liberarCasilleroConfirmado(numeroCasillero) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    // Registrar en historial antes de liberar
    const fechaActual = new Date().toISOString().split('T')[0];
    if (!casillero.historialPagos) casillero.historialPagos = [];
    
    casillero.historialPagos.push({
        fecha: fechaActual,
        anio: new Date().getFullYear(),
        mes: 0,
        nombreMes: 'Liberación',
        monto: 0,
        estudiante: '',
        tipo: 'liberacion',
        descripcion: `Casillero ${numeroCasillero} liberado. Estudiante anterior: ${casillero.estudiante}`,
        timestamp: Date.now()
    });
    
    // Liberar casillero
    datos.casilleros[numeroCasillero] = {
        numero: numeroCasillero,
        estudiante: '',
        montoMensual: 10.00,
        mesesPagados2026: [],
        mesesPagados2027: [],
        historialPagos: casillero.historialPagos, // Mantener historial
        totalPagado: 0,
        fechaAsignacion: '',
        estado: 'libre',
        ultimaActualizacion: fechaActual
    };
    
    // Guardar datos
    guardarDatos();
    actualizarVistaCasilleros();
    actualizarDetalleCajaFuerte();
    
    // Mostrar mensaje
    mostrarMensaje(`Casillero ${numeroCasillero} liberado exitosamente`, 'success');
    
    // Reabrir el modal de historial (ahora vacío)
    setTimeout(() => verHistorialCasillero(numeroCasillero), 500);
}

// ABRIR MODAL PARA CAMBIAR ESTUDIANTE
function abrirModalCambiarEstudiante(numeroCasillero) {
    if (!isAdmin) return;
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    // Cerrar el modal actual
    const modalActual = bootstrap.Modal.getInstance(document.getElementById('modalHistorialCasilleroCompacto'));
    if (modalActual) modalActual.hide();
    
    // Mostrar modal de cambio de estudiante
    const modalCambio = new bootstrap.Modal(document.getElementById('modalCambiarEstudiante'));
    
    // Configurar contenido del modal
    document.getElementById('modalCambioTitulo').textContent = `Cambiar Estudiante - Casillero ${numeroCasillero}`;
    document.getElementById('modalCambioInfo').innerHTML = `
        <p><strong>Estudiante actual:</strong> ${casillero.estudiante || 'Sin asignar'}</p>
    `;
    
    // Limpiar y configurar input
    const inputNuevoEstudiante = document.getElementById('nuevoEstudiante');
    inputNuevoEstudiante.value = casillero.estudiante || '';
    inputNuevoEstudiante.focus();
    
    // Configurar función de cambio
    document.getElementById('btnConfirmarCambio').onclick = function() {
        cambiarEstudianteConfirmado(numeroCasillero, inputNuevoEstudiante.value);
        modalCambio.hide();
    };
    
    modalCambio.show();
}

// CAMBIAR ESTUDIANTE CONFIRMADO
function cambiarEstudianteConfirmado(numeroCasillero, nuevoEstudiante) {
    if (!isAdmin) return;
    
    if (!nuevoEstudiante.trim()) {
        mostrarMensaje('Ingrese el nombre del estudiante', 'error');
        return;
    }
    
    const casillero = datos.casilleros[numeroCasillero];
    if (!casillero) return;
    
    const estudianteAnterior = casillero.estudiante || 'Sin asignar';
    
    // Registrar en historial
    const fechaActual = new Date().toISOString().split('T')[0];
    if (!casillero.historialPagos) casillero.historialPagos = [];
    
    casillero.historialPagos.push({
        fecha: fechaActual,
        anio: new Date().getFullYear(),
        mes: 0,
        nombreMes: 'Cambio',
        monto: 0,
        estudiante: nuevoEstudiante,
        tipo: 'cambio_estudiante',
        descripcion: `Cambio de estudiante: ${estudianteAnterior} → ${nuevoEstudiante}`,
        timestamp: Date.now()
    });
    
    // Actualizar casillero
    casillero.estudiante = nuevoEstudiante;
    casillero.estado = nuevoEstudiante.trim() ? 'ocupado' : 'libre';
    casillero.ultimaActualizacion = fechaActual;
    
    // Si no hay fecha de asignación, establecerla
    if (!casillero.fechaAsignacion) {
        casillero.fechaAsignacion = fechaActual;
    }
    
    // Guardar datos
    guardarDatos();
    actualizarVistaCasilleros();
    
    // Mostrar mensaje
    mostrarMensaje(`Estudiante cambiado exitosamente: ${estudianteAnterior} → ${nuevoEstudiante}`, 'success');
    
    // Reabrir el modal de historial
    setTimeout(() => verHistorialCasillero(numeroCasillero), 500);
}

// FUNCIÓN SIMPLE PARA FORZAR CIERRE DE MODALES
function forzarCierreModal() {
    // Remover el fondo oscuro que bloquea
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
    
    // Restaurar el body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0px';
    
    // Ocultar todos los modales visibles
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
}

// Agregar este evento al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Cuando se presiona ESC, cerrar todo
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            forzarCierreModal();
        }
    });
});


// ============================================
// FUNCIONES PARA MOSTRAR ÚLTIMOS GASTOS E HISTORIAL
// ============================================

// 1. MOSTRAR ÚLTIMOS GASTOS (solo visualización)
function mostrarUltimosGastos() {
    const tbody = document.getElementById('tablaUltimosGastosSeguimiento');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Tomar últimos 8 gastos ordenados por fecha
    const ultimosGastos = [...datos.gastos]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 8);
    
    if (ultimosGastos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-3">
                    <i class="fas fa-receipt"></i> No hay gastos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    ultimosGastos.forEach(gasto => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${gasto.fecha || 'Sin fecha'}</td>
            <td>${gasto.categoria || 'Sin categoría'}</td>
            <td>${(gasto.descripcion || '').substring(0, 25)}${(gasto.descripcion || '').length > 25 ? '...' : ''}</td>
            <td class="text-danger">Bs ${(gasto.monto || 0).toFixed(2)}</td>
            <td>
                ${gasto.comprobante ? 
                    `<button class="btn btn-sm btn-info" onclick="verComprobante(${gasto.id})">
                        <i class="fas fa-eye"></i>
                    </button>` : 
                    '<small class="text-muted">No</small>'
                }
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function actualizarUltimosGastosSeguimiento() {
    const tbody = document.getElementById('tablaUltimosGastosSeguimiento');
    if (!tbody) return;
    
    // Ordenar gastos por fecha (más reciente primero)
    const gastosOrdenados = [...datos.gastos].sort((a, b) => {
        return new Date(b.fecha) - new Date(a.fecha);
    });
    
    const ultimosGastos = gastosOrdenados.slice(0, 10);
    
    if (ultimosGastos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No hay gastos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    ultimosGastos.forEach(gasto => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${gasto.fecha || 'Sin fecha'}</td>
            <td>${gasto.categoria || 'Sin categoría'}</td>
            <td>${(gasto.descripcion || '').substring(0, 30)}${(gasto.descripcion || '').length > 30 ? '...' : ''}</td>
            <td class="text-danger">Bs ${(gasto.monto || 0).toFixed(2)}</td>
            <td>
                ${gasto.comprobante ? 
                    `<button class="btn btn-sm btn-info" onclick="verComprobante(${gasto.id})">
                        <i class="fas fa-eye"></i>
                    </button>` : 
                    '<span class="badge bg-secondary">No</span>'
                }
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function actualizarHistorialGeneral() {
    const tbody = document.getElementById('tablaHistorialGeneral');
    if (!tbody) return;
    
    // 1. Recopilar SOLO los eventos que queremos:
    let todosLosEventos = [];
    
    // A) APORTES DE ESTUDIANTES
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
        if (datosCurso.estudiantes) {
            for (let i = 0; i < datosCurso.estudiantes.length; i++) {
                const estudiante = datosCurso.estudiantes[i];
                const nombreEstudiante = estudiante.nombre || `Estudiante ${i + 1}`;
                
                if (estudiante.pagos) {
                    // 2026
                    if (estudiante.pagos['2026'] && estudiante.pagos['2026'].pagado && estudiante.pagos['2026'].fecha) {
                        const pago = estudiante.pagos['2026'];
                        todosLosEventos.push({
                            fecha: pago.fecha,
                            timestamp: new Date(pago.fecha).getTime(),
                            tipo: 'APORTE',
                            descripcion: `${cursoNombre} - 2026`,
                            detalle: `${nombreEstudiante}`,
                            monto: pago.monto || 0,
                            color: 'warning',
                            esIngreso: true,
                            origen: 'aporte_estudiante'
                        });
                    }
                    
                    // 2027
                    if (estudiante.pagos['2027'] && estudiante.pagos['2027'].pagado && estudiante.pagos['2027'].fecha) {
                        const pago = estudiante.pagos['2027'];
                        todosLosEventos.push({
                            fecha: pago.fecha,
                            timestamp: new Date(pago.fecha).getTime(),
                            tipo: 'APORTE',
                            descripcion: `${cursoNombre} - 2027`,
                            detalle: `${nombreEstudiante}`,
                            monto: pago.monto || 0,
                            color: 'warning',
                            esIngreso: true,
                            origen: 'aporte_estudiante'
                        });
                    }
                }
            }
        }
    }
    
    // B) MOVIMIENTOS DE CAJA - INGRESOS DE CAJA
    for (const movimiento of datos.movimientosCaja) {
        if (movimiento.fecha) {
            const esIngreso = movimiento.tipo === 'ingreso';
            todosLosEventos.push({
                fecha: movimiento.fecha,
                timestamp: new Date(movimiento.fecha).getTime(),
                tipo: esIngreso ? 'INGRESO DE CAJA' : 'EGRESO DE CAJA',
                descripcion: movimiento.concepto || 'Movimiento de caja',
                detalle: esIngreso ? 'Ingreso de caja' : 'Egreso de caja',
                monto: movimiento.monto || 0,
                color: esIngreso ? 'success' : 'danger',
                esIngreso: esIngreso,
                origen: 'caja'
            });
        }
    }
    
    // C) GASTOS OPERATIVOS
    for (const gasto of datos.gastos) {
        if (gasto.fecha) {
            todosLosEventos.push({
                fecha: gasto.fecha,
                timestamp: new Date(gasto.fecha).getTime(),
                tipo: 'GASTO',
                descripcion: gasto.categoria || 'Gasto',
                detalle: gasto.descripcion || 'Sin descripción',
                monto: gasto.monto || 0,
                color: 'danger',
                esIngreso: false,
                origen: 'gasto'
            });
        }
    }
    
    // 2. ORDENAR POR FECHA CRONOLÓGICA (más ANTIGUO primero para cálculo correcto)
    todosLosEventos.sort((a, b) => a.timestamp - b.timestamp);
    
    // 3. Calcular saldo acumulado DESDE EL INICIO
    let saldoAcumulado = 0;
    const eventosConSaldo = [];
    
    for (let i = 0; i < todosLosEventos.length; i++) {
        const evento = todosLosEventos[i];
        
        if (evento.esIngreso) {
            saldoAcumulado += evento.monto;
        } else {
            saldoAcumulado -= evento.monto;
        }
        
        eventosConSaldo.push({
            fecha: evento.fecha,
            tipo: evento.tipo,
            descripcion: evento.descripcion,
            detalle: evento.detalle,
            monto: evento.monto,
            color: evento.color,
            esIngreso: evento.esIngreso,
            saldoAcumulado: saldoAcumulado,
            origen: evento.origen
        });
    }
    
    // 4. Ordenar para mostrar en tabla (más RECIENTE primero)
    const eventosParaMostrar = [...eventosConSaldo].reverse();
    
    // 5. Mostrar en la tabla TODOS LOS EVENTOS (sin límite)
    tbody.innerHTML = '';
    
    if (eventosParaMostrar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-3">
                    <i class="fas fa-history"></i> No hay eventos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    // MOSTRAR TODOS LOS EVENTOS SIN LÍMITE
    eventosParaMostrar.forEach(evento => {
        const fila = document.createElement('tr');
        
        // Determinar clase CSS según tipo
        let claseMonto = '';
        let signoMonto = '';
        if (evento.esIngreso) {
            claseMonto = 'text-success';
            signoMonto = '+';
        } else {
            claseMonto = 'text-danger';
            signoMonto = '-';
        }
        
        // Determinar color de saldo
        let claseSaldo = evento.saldoAcumulado >= 0 ? 'text-primary' : 'text-danger';
        
        fila.innerHTML = `
            <td>${evento.fecha || 'Sin fecha'}</td>
            <td>
                <span class="badge bg-${evento.color}">
                    ${evento.tipo}
                </span>
            </td>
            <td>${evento.descripcion}</td>
            <td><small>${evento.detalle}</small></td>
            <td class="${claseMonto}">
                <strong>${signoMonto}Bs ${evento.monto.toFixed(2)}</strong>
            </td>
            <td class="${claseSaldo}">
                <strong>Bs ${evento.saldoAcumulado.toFixed(2)}</strong>
            </td>
        `;
        
        tbody.appendChild(fila);
    });
    
    // Mostrar información del cálculo
    if (eventosConSaldo.length > 0) {
        const ultimoSaldo = eventosConSaldo[eventosConSaldo.length - 1].saldoAcumulado;
        
        // Agregar fila con resumen
        const filaResumen = document.createElement('tr');
        filaResumen.className = 'table-info';
        filaResumen.innerHTML = `
            <td colspan="4" class="text-end">
                <small><strong>Resumen:</strong> ${eventosConSaldo.length} eventos registrados</small>
            </td>
            <td colspan="2" class="${ultimoSaldo >= 0 ? 'text-success' : 'text-danger'}">
                <small><strong>Saldo final: Bs ${ultimoSaldo.toFixed(2)}</strong></small>
            </td>
        `;
        tbody.appendChild(filaResumen);
    }
}

function filtrarHistorialGeneral(tipo) {
    const tbody = document.getElementById('tablaHistorialGeneral');
    if (!tbody) return;
    
    // Primero actualizar el historial completo
    actualizarHistorialGeneral();
    
    // Si es "todos", ya está actualizado
    if (tipo === 'todos') return;
    
    // Filtrar las filas visibles
    const filas = tbody.querySelectorAll('tr');
    const tipoUpper = tipo.toUpperCase();
    
    filas.forEach(fila => {
        // Obtener el tipo del badge
        const badge = fila.querySelector('.badge');
        if (badge) {
            const tipoFila = badge.textContent.trim();
            
            // Mostrar u ocultar según coincidencia
            if (tipoFila.includes(tipoUpper)) {
                fila.style.display = '';
            } else {
                fila.style.display = 'none';
            }
        }
    });
}

// ============================================
// FUNCIONES PARA ADMINISTRAR CURSOS ESPECIALES
// ============================================

// FUNCIÓN PARA AGREGAR CURSO ESPECIAL
function agregarCursoEspecial() {
    if (!isAdmin) {
        mostrarMensaje('Solo el administrador puede agregar cursos', 'error');
        return;
    }
    
    const nombre = prompt('Ingrese el nombre del nuevo curso especial (debe empezar con "0."):');
    
    if (!nombre || !nombre.startsWith('0.')) {
        mostrarMensaje('El nombre debe empezar con "0." (cero punto)', 'error');
        return;
    }
    
    if (ordenCursos.includes(nombre)) {
        mostrarMensaje('Este curso ya existe', 'error');
        return;
    }
    
    // Agregar a las listas
    ordenCursos.push(nombre);
    montosPorCurso2026[nombre] = 100; // Monto por defecto 100
    montosPorCurso2027[nombre] = 100; // Monto por defecto 100
    
    // Crear estructura de datos
    datos.cursos[nombre] = { estudiantes: [] };
    inicializarEstudiantesCurso(nombre);
    
    // Guardar y actualizar
    guardarDatos();
    actualizarSelectorCursos();
    mostrarMensaje(`Curso especial "${nombre}" agregado exitosamente`, 'success');
}

// FUNCIÓN PARA ELIMINAR CURSO ESPECIAL
function eliminarCursoEspecial() {
    if (!isAdmin) {
        mostrarMensaje('Solo el administrador puede eliminar cursos', 'error');
        return;
    }
    
    // Filtrar solo cursos especiales (que empiezan con "0.")
    const cursosEspeciales = ordenCursos.filter(curso => curso.startsWith('0.'));
    
    if (cursosEspeciales.length === 0) {
        mostrarMensaje('No hay cursos especiales para eliminar', 'info');
        return;
    }
    
    let opciones = '';
    cursosEspeciales.forEach((curso, index) => {
        opciones += `${index + 1}. ${curso}\n`;
    });
    
    const seleccion = prompt(`Seleccione el número del curso a eliminar:\n${opciones}`);
    const indice = parseInt(seleccion) - 1;
    
    if (isNaN(indice) || indice < 0 || indice >= cursosEspeciales.length) {
        mostrarMensaje('Selección inválida', 'error');
        return;
    }
    
    const cursoAEliminar = cursosEspeciales[indice];
    
    if (!confirm(`¿Está seguro de eliminar el curso "${cursoAEliminar}"?\n\nIMPORTANTE: Todos los estudiantes y pagos de este curso se perderán.`)) {
        return;
    }
    
    // Eliminar de las listas
    const indexEnOrden = ordenCursos.indexOf(cursoAEliminar);
    if (indexEnOrden !== -1) ordenCursos.splice(indexEnOrden, 1);
    
    delete montosPorCurso2026[cursoAEliminar];
    delete montosPorCurso2027[cursoAEliminar];
    delete datos.cursos[cursoAEliminar];
    
    // Guardar y actualizar
    guardarDatos();
    actualizarSelectorCursos();
    actualizarSeguimiento();
    
    mostrarMensaje(`Curso especial "${cursoAEliminar}" eliminado exitosamente`, 'success');
}

// FUNCIÓN PARA INICIALIZAR ESTUDIANTES EN UN CURSO NUEVO
function inicializarEstudiantesCurso(cursoNombre) {
    const datosCurso = datos.cursos[cursoNombre];
    if (!datosCurso.estudiantes || datosCurso.estudiantes.length === 0) {
        datosCurso.estudiantes = [];
        for (let i = 1; i <= 45; i++) {
            datosCurso.estudiantes.push({
                nombre: `Estudiante ${i}`,
                pagos: {
                    2026: { monto: 0, fecha: '', pagado: false },
                    2027: { monto: 0, fecha: '', pagado: false }
                }
            });
        }
    }
}


// ============================================
// FUNCIONES PARA ADMINISTRAR CURSOS ESPECIALES
// ============================================

// FUNCIÓN PARA CAMBIAR NOMBRE DE CURSO ESPECIAL
function cambiarNombreCursoEspecial() {
    if (!isAdmin) {
        mostrarMensaje('Solo el administrador puede cambiar nombres', 'error');
        return;
    }
    
    // Obtener solo cursos especiales
    const cursosEspeciales = ordenCursos.filter(curso => curso.startsWith('0.'));
    
    if (cursosEspeciales.length === 0) {
        mostrarMensaje('No hay cursos especiales para cambiar', 'info');
        return;
    }
    
    // Mostrar lista de cursos especiales
    let lista = 'Cursos especiales actuales:\n\n';
    cursosEspeciales.forEach((curso, index) => {
        lista += `${index + 1}. ${curso}\n`;
    });
    
    const seleccion = prompt(`${lista}\n\nIngrese el NÚMERO del curso que quiere cambiar:`);
    const indice = parseInt(seleccion) - 1;
    
    if (isNaN(indice) || indice < 0 || indice >= cursosEspeciales.length) {
        mostrarMensaje('Selección inválida', 'error');
        return;
    }
    
    const cursoViejo = cursosEspeciales[indice];
    const nuevoNombre = prompt(`Nombre actual: ${cursoViejo}\n\nIngrese el NUEVO nombre (debe empezar con "0."):`, cursoViejo);
    
    if (!nuevoNombre || !nuevoNombre.startsWith('0.')) {
        mostrarMensaje('El nombre debe empezar con "0."', 'error');
        return;
    }
    
    if (nuevoNombre === cursoViejo) {
        mostrarMensaje('El nombre es el mismo, no se realizó ningún cambio', 'info');
        return;
    }
    
    if (ordenCursos.includes(nuevoNombre)) {
        mostrarMensaje('Ya existe un curso con ese nombre', 'error');
        return;
    }
    
    // ACTUALIZAR TODO:
    // 1. Cambiar en ordenCursos
    const indexOrden = ordenCursos.indexOf(cursoViejo);
    ordenCursos[indexOrden] = nuevoNombre;
    
    // 2. Cambiar en montos 2026
    montosPorCurso2026[nuevoNombre] = montosPorCurso2026[cursoViejo] || 0;
    delete montosPorCurso2026[cursoViejo];
    
    // 3. Cambiar en montos 2027
    montosPorCurso2027[nuevoNombre] = montosPorCurso2027[cursoViejo] || 200;
    delete montosPorCurso2027[cursoViejo];
    
    // 4. Cambiar en datos.cursos
    datos.cursos[nuevoNombre] = datos.cursos[cursoViejo];
    delete datos.cursos[cursoViejo];
    
    // Guardar y actualizar
    guardarDatos();
    actualizarSelectorCursos();
    
    mostrarMensaje(`Curso cambiado: "${cursoViejo}" → "${nuevoNombre}"`, 'success');
}

// FUNCIÓN PARA ELIMINAR CURSO ESPECIAL
function eliminarCursoEspecial() {
    if (!isAdmin) {
        mostrarMensaje('Solo el administrador puede eliminar cursos', 'error');
        return;
    }
    
    // Obtener solo cursos especiales
    const cursosEspeciales = ordenCursos.filter(curso => curso.startsWith('0.'));
    
    if (cursosEspeciales.length === 0) {
        mostrarMensaje('No hay cursos especiales para eliminar', 'info');
        return;
    }
    
    // Mostrar lista
    let lista = 'Cursos especiales:\n\n';
    cursosEspeciales.forEach((curso, index) => {
        lista += `${index + 1}. ${curso}\n`;
    });
    
    const seleccion = prompt(`${lista}\n\nIngrese el NÚMERO del curso a ELIMINAR:`);
    const indice = parseInt(seleccion) - 1;
    
    if (isNaN(indice) || indice < 0 || indice >= cursosEspeciales.length) {
        mostrarMensaje('Selección inválida', 'error');
        return;
    }
    
    const cursoAEliminar = cursosEspeciales[indice];
    
    if (!confirm(`¿Está SEGURO de eliminar el curso "${cursoAEliminar}"?\n\nIMPORTANTE: Se perderán TODOS los estudiantes y pagos de este curso.`)) {
        return;
    }
    
    // ELIMINAR TODO:
    // 1. Eliminar de ordenCursos
    const indexEnOrden = ordenCursos.indexOf(cursoAEliminar);
    ordenCursos.splice(indexEnOrden, 1);
    
    // 2. Eliminar de montos
    delete montosPorCurso2026[cursoAEliminar];
    delete montosPorCurso2027[cursoAEliminar];
    
    // 3. Eliminar de datos.cursos
    delete datos.cursos[cursoAEliminar];
    
    // Guardar y actualizar
    guardarDatos();
    actualizarSelectorCursos();
    actualizarSeguimiento();
    
    mostrarMensaje(`Curso especial "${cursoAEliminar}" ELIMINADO`, 'success');
}

// FUNCIÓN PARA ACTUALIZAR SELECTOR DE CURSOS
function actualizarSelectorCursos() {
    // Actualizar selector principal
    const selectorCurso = document.getElementById('selectorCurso');
    if (selectorCurso) {
        selectorCurso.innerHTML = '<option value="">Seleccione un curso</option>';
        ordenCursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.textContent = curso;
            selectorCurso.appendChild(option);
        });
    }
    
    // Actualizar filtro de seguimiento
    const filtroCursoSeguimiento = document.getElementById('filtroCursoSeguimiento');
    if (filtroCursoSeguimiento) {
        filtroCursoSeguimiento.innerHTML = '<option value="todos">Todos los cursos</option>';
        ordenCursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.textContent = curso;
            filtroCursoSeguimiento.appendChild(option);
        });
    }
    
    // Actualizar selector de otros cobros
    const cursoOtroCobro = document.getElementById('cursoOtroCobro');
    if (cursoOtroCobro) {
        cursoOtroCobro.innerHTML = '<option value="">Seleccione curso</option>';
        ordenCursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.textContent = curso;
            cursoOtroCobro.appendChild(option);
        });
    }
}


// ============================================
// FUNCIONES PARA GASTOS DE OTROS COBROS
// ============================================

// FUNCIÓN PARA ACTUALIZAR RESUMEN DE OTROS COBROS
function actualizarResumenOtrosCobros() {
    // Calcular ingresos totales (suma de todos los cobros de todos los sectores)
    let ingresosTotales = 0;
    if (datos.sectoresCobro) {
        datos.sectoresCobro.forEach(sector => {
            if (sector.cobros) {
                sector.cobros.forEach(cobro => {
                    ingresosTotales += cobro.monto || 0;
                });
            }
        });
    }
    
    datos.otrosCobrosIngresos = ingresosTotales;
    
    // Calcular gastos totales
    let gastosTotales = 0;
    if (datos.otrosCobrosSaldos) {
        datos.otrosCobrosSaldos.forEach(gasto => {
            gastosTotales += gasto.monto || 0;
        });
    }
    datos.otrosCobrosGastos = gastosTotales;
    
    // Calcular saldo
    const saldo = ingresosTotales - gastosTotales;
    
    // Actualizar en la página
    if (document.getElementById('otrosCobrosIngresos')) {
        document.getElementById('otrosCobrosIngresos').textContent = `Bs ${ingresosTotales.toFixed(2)}`;
    }
    if (document.getElementById('otrosCobrosGastos')) {
        document.getElementById('otrosCobrosGastos').textContent = `Bs ${gastosTotales.toFixed(2)}`;
    }
    if (document.getElementById('otrosCobrosSaldo')) {
        document.getElementById('otrosCobrosSaldo').textContent = `Bs ${saldo.toFixed(2)}`;
    }
    if (document.getElementById('resumenIngresosOtrosCobros')) {
        document.getElementById('resumenIngresosOtrosCobros').textContent = `Bs ${ingresosTotales.toFixed(2)}`;
    }
    if (document.getElementById('resumenGastosOtrosCobros')) {
        document.getElementById('resumenGastosOtrosCobros').textContent = `Bs ${gastosTotales.toFixed(2)}`;
    }
    if (document.getElementById('resumenSaldoOtrosCobros')) {
        document.getElementById('resumenSaldoOtrosCobros').textContent = `Bs ${saldo.toFixed(2)}`;
    }
    
    // Actualizar también el total general de otros cobros (en el header)
    datos.totalOtrosCobros = ingresosTotales;
    if (document.getElementById('totalOtrosCobros')) {
        document.getElementById('totalOtrosCobros').textContent = `Bs ${ingresosTotales.toFixed(2)}`;
    }
}

// FUNCIÓN PARA REGISTRAR GASTO DE OTROS COBROS
function registrarGastoOtroCobro(e) {
    if (e) e.preventDefault();
    
    if (!isAdmin) {
        mostrarMensaje('Solo el administrador puede registrar gastos', 'error');
        return;
    }
    
    const concepto = document.getElementById('conceptoGastoOtroCobro').value;
    const monto = parseFloat(document.getElementById('montoGastoOtroCobro').value) || 0;
    const fecha = document.getElementById('fechaGastoOtroCobro').value;
    const descripcion = document.getElementById('descripcionGastoOtroCobro').value;
    
    if (!concepto || !monto || !fecha || !descripcion) {
        mostrarMensaje('Complete todos los campos', 'error');
        return;
    }
    
    if (monto <= 0) {
        mostrarMensaje('El monto debe ser mayor a 0', 'error');
        return;
    }
    
    // Verificar que hay saldo disponible
    const saldoActual = datos.otrosCobrosIngresos - datos.otrosCobrosGastos;
    if (monto > saldoActual) {
        mostrarMensaje(`No hay suficiente saldo. Disponible: Bs ${saldoActual.toFixed(2)}`, 'error');
        return;
    }
    
    // Crear objeto de gasto
    const nuevoGasto = {
        id: Date.now(),
        concepto: concepto,
        monto: monto,
        fecha: fecha,
        descripcion: descripcion,
        timestamp: Date.now()
    };
    
    // Guardar en datos
    if (!datos.otrosCobrosSaldos) datos.otrosCobrosSaldos = [];
    datos.otrosCobrosSaldos.push(nuevoGasto);
    
    // Guardar en historial
    if (!datos.otrosCobrosHistorial) datos.otrosCobrosHistorial = [];
    datos.otrosCobrosHistorial.push({
        ...nuevoGasto,
        tipo: 'gasto_otros_cobros'
    });
    
    // Actualizar total de gastos
    datos.otrosCobrosGastos += monto;
    
    // Guardar y actualizar
    guardarDatos();
    actualizarResumenOtrosCobros();
    actualizarTablaGastosOtrosCobros();
    
    // Limpiar formulario
    document.getElementById('formGastoOtroCobro').reset();
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaGastoOtroCobro').value = hoy;
    
    mostrarMensaje('Gasto registrado exitosamente (solo afecta otros cobros)', 'success');
}

// FUNCIÓN PARA ACTUALIZAR TABLA DE GASTOS
function actualizarTablaGastosOtrosCobros() {
    const tbody = document.getElementById('tablaGastosOtrosCobros');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!datos.otrosCobrosSaldos || datos.otrosCobrosSaldos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No hay gastos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar por fecha (más reciente primero)
    const gastosOrdenados = [...datos.otrosCobrosSaldos].sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
    );
    
    gastosOrdenados.forEach(gasto => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${gasto.fecha || 'Sin fecha'}</td>
            <td>${gasto.concepto || 'Sin concepto'}</td>
            <td>${gasto.descripcion || 'Sin descripción'}</td>
            <td class="text-danger">Bs ${(gasto.monto || 0).toFixed(2)}</td>
            <td>
                ${isAdmin ? `
                <button class="btn btn-danger btn-sm" onclick="eliminarGastoOtroCobro(${gasto.id})">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// FUNCIÓN PARA ELIMINAR GASTO
function eliminarGastoOtroCobro(id) {
    if (!isAdmin) return;
    
    if (!confirm('¿Está seguro de eliminar este gasto?')) {
        return;
    }
    
    const index = datos.otrosCobrosSaldos.findIndex(gasto => gasto.id === id);
    if (index !== -1) {
        const gasto = datos.otrosCobrosSaldos[index];
        
        // Restar del total de gastos
        datos.otrosCobrosGastos -= gasto.monto || 0;
        
        // Eliminar de la lista
        datos.otrosCobrosSaldos.splice(index, 1);
        
        // Eliminar del historial
        if (datos.otrosCobrosHistorial) {
            const histIndex = datos.otrosCobrosHistorial.findIndex(h => h.id === id);
            if (histIndex !== -1) datos.otrosCobrosHistorial.splice(histIndex, 1);
        }
        
        // Guardar y actualizar
        guardarDatos();
        actualizarResumenOtrosCobros();
        actualizarTablaGastosOtrosCobros();
        
        mostrarMensaje('Gasto eliminado', 'success');
    }
}

// FUNCIÓN PARA ACTUALIZAR CUANDO SE REGISTRE UN COBRO
function actualizarCuandoSeRegistreCobro(monto) {
    datos.otrosCobrosIngresos += monto;
    actualizarResumenOtrosCobros();
}

// ============================================
// FUNCIÓN PARA MOSTRAR NOTIFICACIÓN AL ADMIN
// ============================================
function mostrarNotificacionAdmin(mensaje) {
    if (!isAdmin) return;
    
    // Crear notificación
    const notificacion = document.createElement('div');
    notificacion.id = 'notificacion-admin-' + Date.now();
    notificacion.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 15px;
        border-radius: 10px;
        border-left: 5px solid gold;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 9999;
        max-width: 300px;
        animation: slideIn 0.5s ease;
    `;
    
    notificacion.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-crown" style="color: gold;"></i>
            <div>
                <strong>ADMIN:</strong>
                <div>${mensaje}</div>
                <small style="opacity: 0.8;">${new Date().toLocaleTimeString()}</small>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="margin-left: auto; background: transparent; border: none; color: white; cursor: pointer;">
                ✕
            </button>
        </div>
    `;
    
    document.body.appendChild(notificacion);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (notificacion.parentElement) {
            notificacion.remove();
        }
    }, 5000);
}

function establecerDineroInicialCasilleros() {
    const monto = prompt("Ingrese el dinero inicial para Casilleros:");

    if (monto === null) return;

    const montoNumero = parseFloat(monto);

    if (isNaN(montoNumero) || montoNumero < 0) {
        alert("Ingrese un monto válido");
        return;
    }

    datos.montoInicialCasilleros = montoNumero;
    guardarDatos();
    actualizarResumenFinanciero();
}


// Al final de tu script.js, agrega:
window.addEventListener('beforeunload', function(e) {
    if (isAdmin && datos && Object.keys(datos.cursos || {}).length > 0) {
        // Guardar automáticamente antes de cerrar
        localStorage.setItem('datosFederacion', JSON.stringify(datos));
        
        // Crear backup de emergencia
        const backupEmergencia = {
            datos: datos,
            fecha: new Date().toISOString(),
            tipo: 'emergencia'
        };
        localStorage.setItem('backup_emergencia_' + Date.now(), JSON.stringify(backupEmergencia));
    }
});


// Al final de tu script.js, agrega:
window.addEventListener('beforeunload', function(e) {
    if (isAdmin && datos && Object.keys(datos.cursos || {}).length > 0) {
        // Guardar automáticamente antes de cerrar
        localStorage.setItem('datosFederacion', JSON.stringify(datos));
        
        // Crear backup de emergencia
        const backupEmergencia = {
            datos: datos,
            fecha: new Date().toISOString(),
            tipo: 'emergencia'
        };
        localStorage.setItem('backup_emergencia_' + Date.now(), JSON.stringify(backupEmergencia));
    }
});

console.log('✅ Sistema de Gestión Financiera cargado completamente con todas las mejoras');

















