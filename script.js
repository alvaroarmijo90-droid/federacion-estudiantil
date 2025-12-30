// Variables globales MEJORADAS
// Variables globales - INICIALMENTE VACÍAS
let datos = {};

// Función para inicializar datos vacíos (solo si no existen)
function inicializarDatosVacios() {
    return {
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
        cursos: {
            '1. No se sabe': { estudiantes: [] },
            '1. No se sabe (2)': { estudiantes: [] },
            '1. No se sabe (3)': { estudiantes: [] },
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
}

// Variable para sincronización
let sincronizacionActiva = false;

// Configuración de montos por curso PARA 2026
const montosPorCurso2026 = {
    '1. No se sabe': 200,
    '1. No se sabe (2)': 200,
    '1. No se sabe (3)': 200,
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
    '1. No se sabe': 70,
    '1. No se sabe (2)': 70,
    '1. No se sabe (3)': 70,
    '2. INICIAL': 60,
    '2. PRIMARIA': 60,
    '2. CIENCIAS SOCIALES': 60,
    '3. INICIAL': 50,
    '3. PRIMARIA': 50,
    '3. INGLES': 50,
    '4. INICIAL': 50,
    '4. PRIMARIA': 50,
    '5. INICIAL': 50,
    '5. PRIMARIA': 50
};

// Función para obtener el monto requerido para un curso según el año
function obtenerMontoCurso(curso, anio) {
    if (anio === '2026') {
        return montosPorCurso2026[curso] || 50;
    } else if (anio === '2027') {
        return montosPorCurso2027[curso] || 50;
    }
    return 50;
}

// Variables para control de acceso
let isAdmin = false;
let isViewer = false;
const ADMIN_PASSWORD = "admin123";

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Sistema de Gestión Financiera - Inicializando...');
    
    // INICIAR SISTEMA DE SINCRONIZACIÓN
    if (window.sincronizador) {
        sincronizacionActiva = await window.sincronizador.conectar();
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
    
    // Configurar fecha actual en los formularios
    const hoy = new Date().toISOString().split('T')[0];
    ['fechaGasto', 'fechaCaja', 'fechaPago', 'fechaPagoCasillero', 'fechaOtroCobro', 'fechaEvento'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = hoy;
    });
    
    // Inicializar estudiantes si no existen
    inicializarEstudiantes();
    
    // Event listeners para formularios
    const cursoOtroCobro = document.getElementById('cursoOtroCobro');
    if (cursoOtroCobro) {
        cursoOtroCobro.addEventListener('change', cargarEstudiantesParaOtrosCobros);
    }
    
    // Event listeners para filtros
    const filtroEstudiante = document.getElementById('filtroEstudiante');
    if (filtroEstudiante) {
        filtroEstudiante.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') filtrarEstudiantesSeguimiento();
        });
    }
    
    // Event listener para meses múltiples en casilleros
    const multipleMesesCheckbox = document.getElementById('multipleMeses');
    if (multipleMesesCheckbox) {
        multipleMesesCheckbox.addEventListener('change', function() {
            const container = document.getElementById('mesesMultipleContainer');
            if (this.checked) {
                container.style.display = 'block';
                generarCheckboxesMeses();
            } else {
                container.style.display = 'none';
            }
        });
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
    
    // Actualizar interfaz según tipo de usuario
    actualizarInterfazPorUsuario();
    
    // Inicializar datos
    cargarDatos();
    inicializarGraficos();
    actualizarDashboard();
    actualizarResumenAportesCursos();
    actualizarReporteMensual();
    actualizarDetalleCajaFuerte();
    actualizarSeguimiento();
    actualizarEventos();
    actualizarTablaOtrosCobros();
    
    // Event listeners para formularios
    const formAporte = document.getElementById('formAporte');
    const formGasto = document.getElementById('formGasto');
    const formMovimientoCaja = document.getElementById('formMovimientoCaja');
    const formPagoCasillero = document.getElementById('formPagoCasillero');
    const formOtroCobro = document.getElementById('formOtroCobro');
    const formEvento = document.getElementById('formEvento');
    
    if (formAporte) formAporte.addEventListener('submit', registrarAporte);
    if (formGasto) formGasto.addEventListener('submit', registrarGasto);
    if (formMovimientoCaja) formMovimientoCaja.addEventListener('submit', registrarMovimientoCaja);
    if (formPagoCasillero) formPagoCasillero.addEventListener('submit', registrarPagoCasillero);
    if (formOtroCobro) formOtroCobro.addEventListener('submit', registrarOtroCobro);
    if (formEvento) formEvento.addEventListener('submit', registrarEvento);
    
    // Event listener para cambio de curso en aportes
    const cursoSelect = document.getElementById('curso');
    if (cursoSelect) cursoSelect.addEventListener('change', cargarEstudiantesParaAportes);
    
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
    const elementosEditables = document.querySelectorAll('#formAporte, #formGasto, #formMovimientoCaja, #formPagoCasillero, #formOtroCobro, #formEvento, #guardarPagosBtn, #agregarEstudianteBtn, #eliminarEstudianteBtn, #resetButton, .btn-editar, .btn-pago');
    
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
                    case 'aportes': actualizarTablaAportes(); break;
                    case 'gastos': actualizarTablaGastos(); break;
                    case 'caja': actualizarTablaMovimientosCaja(); break;
                    case 'reportes': actualizarReportes(); break;
                    case 'seguimiento': actualizarSeguimiento(); break;
                    case 'casilleros': actualizarVistaCasilleros(); break;
                    case 'otros-cobros': actualizarTablaOtrosCobros(); break;
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
    
    // 3. Si NO HAY DATOS EN ABSOLUTO, inicializar vacíos
    if (!datosCargados) {
        console.log('⚠️ No hay datos, inicializando nuevos...');
        datosCargados = inicializarDatosVacios();
    }
    
    // 4. ASIGNAR LOS DATOS CARGADOS A LA VARIABLE GLOBAL
    datos = datosCargados;
    
    // 5. Asegurar que todos los cursos tengan la estructura correcta
    if (!datos.cursos) {
        datos.cursos = inicializarDatosVacios().cursos;
    }
    
    // 6. Asegurar que cada curso tenga estudiantes
    for (const cursoNombre in datos.cursos) {
        if (!datos.cursos[cursoNombre].estudiantes) {
            datos.cursos[cursoNombre].estudiantes = [];
        }
    }
    
    // 7. Asegurar que casilleros exista
    if (!datos.casilleros) {
        datos.casilleros = {};
    }
    
    // 8. Inicializar estudiantes si no existen
    inicializarEstudiantes();
    
    // 9. Inicializar casilleros si no existen
    if (Object.keys(datos.casilleros).length === 0) {
        inicializarCasilleros();
    }
    
    console.log('📊 Datos cargados correctamente');
    console.log('- Total aportes:', datos.aportes?.length || 0);
    console.log('- Total gastos:', datos.gastos?.length || 0);
    console.log('- Total estudiantes:', Object.values(datos.cursos || {}).reduce((total, curso) => total + (curso.estudiantes?.length || 0), 0));
    
    // 10. Actualizar toda la interfaz
    actualizarDashboard();
    actualizarTablaAportes();
    actualizarTablaGastos();
    actualizarTablaMovimientosCaja();
    actualizarUltimosRegistros();
    actualizarTotalOtrosCobros();
    actualizarDetalleCajaFuerte();
    actualizarSeguimiento();
    actualizarVistaCasilleros();
    actualizarEventos();
    actualizarTablaOtrosCobros();
    
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
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
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
                pagos: [], // Ahora es un array para múltiples pagos
                historialMeses2026: [],
                historialMeses2027: [],
                totalPagado: 0
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
    
    actualizarVistaCasilleros();
}

// GENERAR CHECKBOXES PARA MESES MÚLTIPLES
function generarCheckboxesMeses() {
    const container = document.querySelector('.meses-multiple');
    if (!container) return;
    
    container.innerHTML = '';
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    mesesNombres.forEach((mes, index) => {
        const mesNum = index + 1;
        const div = document.createElement('div');
        div.className = 'form-check form-check-inline mes-checkbox';
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" id="mes${mesNum}" value="${mesNum}">
            <label class="form-check-label" for="mes${mesNum}">${mes.charAt(0)}</label>
        `;
        container.appendChild(div);
    });
}

// ACTUALIZAR VISTA DE CASILLEROS MEJORADA
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
            pagos: [],
            historialMeses2026: [],
            historialMeses2027: [],
            totalPagado: 0
        };
        
        // Calcular total pagado
        let totalPagadoCasillero = 0;
        if (casillero.pagos && casillero.pagos.length > 0) {
            totalPagadoCasillero = casillero.pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0);
        }
        
        const casilleroDiv = document.createElement('div');
        casilleroDiv.className = `col-4 col-md-2`;
        
        const tienePagos = totalPagadoCasillero > 0;
        const estadoClase = tienePagos ? 'pagado' : 'debe';
        const estadoTexto = tienePagos ? 'PAGADO' : 'LIBRE';
        
        // Generar calendario combinado de 2026 y 2027
        let calendarioHTML = '';
        const mesesPagados2026 = casillero.historialMeses2026 || [];
        const mesesPagados2027 = casillero.historialMeses2027 || [];
        
        if (mesesPagados2026.length > 0 || mesesPagados2027.length > 0) {
            calendarioHTML = '<div class="calendario-meses">';
            const mesesNombres = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
            
            // 2026
            calendarioHTML += '<div class="text-center"><small>2026</small></div>';
            mesesNombres.forEach((mes, index) => {
                const mesNum = index + 1;
                const pagado = mesesPagados2026.includes(mesNum);
                calendarioHTML += `
                    <div class="mes-calendario ${pagado ? 'mes-pagado' : 'mes-no-pagado'}" 
                         title="${mes} 2026 - ${pagado ? 'Pagado' : 'No pagado'}">
                        ${mes}
                    </div>
                `;
            });
            
            // 2027
            calendarioHTML += '<div class="text-center mt-1"><small>2027</small></div>';
            mesesNombres.forEach((mes, index) => {
                const mesNum = index + 1;
                const pagado = mesesPagados2027.includes(mesNum);
                calendarioHTML += `
                    <div class="mes-calendario ${pagado ? 'mes-pagado' : 'mes-no-pagado'}" 
                         title="${mes} 2027 - ${pagado ? 'Pagado' : 'No pagado'}">
                        ${mes}
                    </div>
                `;
            });
            
            calendarioHTML += '</div>';
        }
        
        casilleroDiv.innerHTML = `
            <div class="casillero ${estadoClase}">
                <div class="numero">${i}</div>
                <div class="estudiante">${casillero.estudiante || 'Sin asignar'}</div>
                ${calendarioHTML}
                <div class="estado">${estadoTexto}</div>
                <div class="mt-1"><small>Bs ${totalPagadoCasillero.toFixed(2)}</small></div>
                <button class="btn-historial mt-1" onclick="verHistorialCasillero(${i})">
                    <i class="fas fa-history"></i>
                </button>
            </div>
        `;
        
        if (i <= 18) {
            sectorA.appendChild(casilleroDiv);
            totalSectorA += totalPagadoCasillero;
        } else {
            sectorB.appendChild(casilleroDiv);
            totalSectorB += totalPagadoCasillero;
        }
        
        totalGeneral += totalPagadoCasillero;
    }
    
    if (document.getElementById('totalPagadoSectorA')) {
        document.getElementById('totalPagadoSectorA').textContent = `Bs ${totalSectorA.toFixed(2)}`;
    }
    if (document.getElementById('totalPagadoSectorB')) {
        document.getElementById('totalPagadoSectorB').textContent = `Bs ${totalSectorB.toFixed(2)}`;
    }
    if (document.getElementById('totalGeneralCasilleros')) {
        document.getElementById('totalGeneralCasilleros').textContent = `Bs ${totalGeneral.toFixed(2)}`;
    }
}

// VER HISTORIAL DE CASILLERO MEJORADO
function verHistorialCasillero(numero) {
    const casillero = datos.casilleros[numero] || {
        numero: numero,
        estudiante: '',
        pagos: [],
        historialMeses2026: [],
        historialMeses2027: [],
        totalPagado: 0
    };
    
    document.getElementById('numeroCasilleroHistorial').textContent = numero;
    document.getElementById('estudianteCasilleroHistorial').textContent = casillero.estudiante || 'Sin asignar';
    
    // Calcular total pagado
    let totalPagado = 0;
    let mesesPagados2026 = 0;
    let mesesPagados2027 = 0;
    
    if (casillero.pagos && casillero.pagos.length > 0) {
        totalPagado = casillero.pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0);
        mesesPagados2026 = casillero.historialMeses2026 ? casillero.historialMeses2026.length : 0;
        mesesPagados2027 = casillero.historialMeses2027 ? casillero.historialMeses2027.length : 0;
    }
    
    document.getElementById('totalPagadoCasillero').textContent = `Bs ${totalPagado.toFixed(2)}`;
    document.getElementById('mesesPagadosCasillero').textContent = `${mesesPagados2026 + mesesPagados2027} meses`;
    
    // Último pago
    let ultimoPago = 'Sin pagos';
    if (casillero.pagos && casillero.pagos.length > 0) {
        const ultimo = casillero.pagos[casillero.pagos.length - 1];
        ultimoPago = `${ultimo.fecha || 'Sin fecha'} - Bs ${ultimo.monto || 0}`;
    }
    document.getElementById('ultimoPagoCasillero').textContent = ultimoPago;
    
    // Generar calendario completo
    const calendarioDiv = document.getElementById('calendarioCasillero');
    let calendarioHTML = '<div class="text-center mb-2"><strong>Calendario de Pagos 2026-2027</strong></div>';
    
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // 2026
    calendarioHTML += '<div class="mb-2"><strong>2026</strong></div><div>';
    const mesesPagados2026Array = casillero.historialMeses2026 || [];
    
    mesesNombres.forEach((mes, index) => {
        const mesNum = index + 1;
        const pagado = mesesPagados2026Array.includes(mesNum);
        
        calendarioHTML += `
            <div class="mes-item ${pagado ? 'mes-pagado' : 'mes-no-pagado'}" 
                 title="${mes} 2026 - ${pagado ? 'Pagado' : 'No pagado'}">
                ${mes.charAt(0)}
            </div>
        `;
    });
    calendarioHTML += '</div>';
    
    // 2027
    calendarioHTML += '<div class="mb-2 mt-3"><strong>2027</strong></div><div>';
    const mesesPagados2027Array = casillero.historialMeses2027 || [];
    
    mesesNombres.forEach((mes, index) => {
        const mesNum = index + 1;
        const pagado = mesesPagados2027Array.includes(mesNum);
        
        calendarioHTML += `
            <div class="mes-item ${pagado ? 'mes-pagado' : 'mes-no-pagado'}" 
                 title="${mes} 2027 - ${pagado ? 'Pagado' : 'No pagado'}">
                ${mes.charAt(0)}
            </div>
        `;
    });
    calendarioHTML += '</div>';
    calendarioDiv.innerHTML = calendarioHTML;
    
    // Mostrar detalle de pagos
    const detalleDiv = document.getElementById('detallePagosCasillero');
    if (casillero.pagos && casillero.pagos.length > 0) {
        let detalleHTML = '<table class="table table-sm table-dark"><thead><tr><th>Fecha</th><th>Año</th><th>Mes</th><th>Monto</th></tr></thead><tbody>';
        
        casillero.pagos.forEach(pago => {
            detalleHTML += `
                <tr>
                    <td>${pago.fecha || 'Sin fecha'}</td>
                    <td>${pago.anio || '2026'}</td>
                    <td>${mesesNombres[(pago.mes || 1) - 1] || 'Enero'}</td>
                    <td>Bs ${(pago.monto || 0).toFixed(2)}</td>
                </tr>
            `;
        });
        
        detalleHTML += '</tbody></table>';
        detalleDiv.innerHTML = detalleHTML;
    } else {
        detalleDiv.innerHTML = '<p class="text-muted">No hay pagos registrados para este casillero</p>';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalHistorialCasillero'));
    modal.show();
}

// EDITAR CASILLERO DESDE HISTORIAL
function editarCasilleroDesdeHistorial() {
    const numero = parseInt(document.getElementById('numeroCasilleroHistorial').textContent);
    abrirModalEditarCasillero(numero);
}

// LIBERAR CASILLERO DESDE HISTORIAL
function liberarCasilleroDesdeHistorial() {
    const numero = parseInt(document.getElementById('numeroCasilleroHistorial').textContent);
    if (confirm(`¿Está seguro de liberar el casillero ${numero}?`)) {
        datos.casilleros[numero] = {
            numero: numero,
            estudiante: '',
            pagos: [],
            historialMeses2026: [],
            historialMeses2027: [],
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

// ABRIR MODAL PARA EDITAR CASILLERO
function abrirModalEditarCasillero(numero) {
    const casillero = datos.casilleros[numero] || {
        numero: numero,
        estudiante: '',
        pagos: [],
        historialMeses2026: [],
        historialMeses2027: [],
        totalPagado: 0
    };
    
    document.getElementById('editarNumeroCasillero').value = numero;
    document.getElementById('editarEstudianteCasillero').value = casillero.estudiante || '';
    
    // Generar checkboxes para meses 2026
    const meses2026Div = document.getElementById('meses2026');
    meses2026Div.innerHTML = '';
    const mesesPagados2026 = casillero.historialMeses2026 || [];
    
    for (let i = 1; i <= 12; i++) {
        const pagado = mesesPagados2026.includes(i);
        const mesDiv = document.createElement('div');
        mesDiv.className = 'mes-editar-item d-inline-block';
        mesDiv.innerHTML = `
            <div class="mes-editar-item ${pagado ? 'mes-editar-pagado' : 'mes-editar-no-pagado'}" 
                 onclick="toggleMesCasillero(${i}, 2026, this)">
                ${i}
            </div>
        `;
        meses2026Div.appendChild(mesDiv);
    }
    
    // Generar checkboxes para meses 2027
    const meses2027Div = document.getElementById('meses2027');
    meses2027Div.innerHTML = '';
    const mesesPagados2027 = casillero.historialMeses2027 || [];
    
    for (let i = 1; i <= 12; i++) {
        const pagado = mesesPagados2027.includes(i);
        const mesDiv = document.createElement('div');
        mesDiv.className = 'mes-editar-item d-inline-block';
        mesDiv.innerHTML = `
            <div class="mes-editar-item ${pagado ? 'mes-editar-pagado' : 'mes-editar-no-pagado'}" 
                 onclick="toggleMesCasillero(${i}, 2027, this)">
                ${i}
            </div>
        `;
        meses2027Div.appendChild(mesDiv);
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalEditarCasillero'));
    modal.show();
}

// TOGGLE MES CASILLERO (para edición)
function toggleMesCasillero(mes, anio, elemento) {
    elemento.classList.toggle('mes-editar-pagado');
    elemento.classList.toggle('mes-editar-no-pagado');
}

// GUARDAR EDICIÓN DE CASILLERO
function guardarEdicionCasillero() {
    const numero = parseInt(document.getElementById('editarNumeroCasillero').value);
    const estudiante = document.getElementById('editarEstudianteCasillero').value;
    
    if (!datos.casilleros[numero]) {
        datos.casilleros[numero] = {
            numero: numero,
            estudiante: '',
            pagos: [],
            historialMeses2026: [],
            historialMeses2027: [],
            totalPagado: 0
        };
    }
    
    // Obtener meses pagados 2026
    const meses2026Div = document.getElementById('meses2026');
    const mesesPagados2026 = [];
    meses2026Div.querySelectorAll('.mes-editar-item').forEach((item, index) => {
        if (item.classList.contains('mes-editar-pagado')) {
            mesesPagados2026.push(index + 1);
        }
    });
    
    // Obtener meses pagados 2027
    const meses2027Div = document.getElementById('meses2027');
    const mesesPagados2027 = [];
    meses2027Div.querySelectorAll('.mes-editar-item').forEach((item, index) => {
        if (item.classList.contains('mes-editar-pagado')) {
            mesesPagados2027.push(index + 1);
        }
    });
    
    // Recalcular pagos
    const pagos = [];
    let totalPagado = 0;
    
    // Agregar pagos para 2026
    mesesPagados2026.forEach(mes => {
        pagos.push({
            fecha: new Date().toISOString().split('T')[0],
            anio: '2026',
            mes: mes,
            monto: 50.00,
            estudiante: estudiante
        });
        totalPagado += 50.00;
    });
    
    // Agregar pagos para 2027
    mesesPagados2027.forEach(mes => {
        pagos.push({
            fecha: new Date().toISOString().split('T')[0],
            anio: '2027',
            mes: mes,
            monto: 50.00,
            estudiante: estudiante
        });
        totalPagado += 50.00;
    });
    
    datos.casilleros[numero] = {
        numero: numero,
        estudiante: estudiante,
        pagos: pagos,
        historialMeses2026: mesesPagados2026,
        historialMeses2027: mesesPagados2027,
        totalPagado: totalPagado
    };
    
    guardarDatos();
    actualizarVistaCasilleros();
    actualizarDetalleCajaFuerte();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarCasillero'));
    modal.hide();
    
    mostrarMensaje('Casillero actualizado exitosamente', 'success');
}

// REGISTRAR PAGO DE CASILLERO MEJORADO
function registrarPagoCasillero(e) {
    e.preventDefault();
    
    if (!isAdmin) return;
    
    const numero = parseInt(document.getElementById('numeroCasillero').value);
    const estudiante = document.getElementById('estudianteCasillero').value;
    const monto = parseFloat(document.getElementById('montoCasillero').value) || 0;
    const fecha = document.getElementById('fechaPagoCasillero').value;
    const mes = parseInt(document.getElementById('mesCasillero').value);
    const anio = document.getElementById('anioCasillero').value;
    const multipleMeses = document.getElementById('multipleMeses').checked;
    
    if (!numero || !estudiante || !monto || !fecha || !anio) {
        mostrarMensaje('Complete todos los campos', 'error');
        return;
    }
    
    if (!datos.casilleros[numero]) {
        datos.casilleros[numero] = {
            numero: numero,
            estudiante: '',
            pagos: [],
            historialMeses2026: [],
            historialMeses2027: [],
            totalPagado: 0
        };
    }
    
    // Si es pago múltiple
    if (multipleMeses) {
        const mesesSeleccionados = [];
        document.querySelectorAll('.meses-multiple input[type="checkbox"]:checked').forEach(checkbox => {
            mesesSeleccionados.push(parseInt(checkbox.value));
        });
        
        if (mesesSeleccionados.length === 0) {
            mostrarMensaje('Seleccione al menos un mes', 'error');
            return;
        }
        
        mesesSeleccionados.forEach(mesNum => {
            const nuevoPago = {
                fecha: fecha,
                anio: anio,
                mes: mesNum,
                monto: monto,
                estudiante: estudiante
            };
            
            datos.casilleros[numero].pagos.push(nuevoPago);
            
            // Agregar al historial del año correspondiente
            if (anio === '2026') {
                if (!datos.casilleros[numero].historialMeses2026.includes(mesNum)) {
                    datos.casilleros[numero].historialMeses2026.push(mesNum);
                }
            } else if (anio === '2027') {
                if (!datos.casilleros[numero].historialMeses2027.includes(mesNum)) {
                    datos.casilleros[numero].historialMeses2027.push(mesNum);
                }
            }
            
            datos.casilleros[numero].totalPagado += monto;
        });
        
    } else {
        // Pago único
        if (!mes) {
            mostrarMensaje('Seleccione un mes', 'error');
            return;
        }
        
        const nuevoPago = {
            fecha: fecha,
            anio: anio,
            mes: mes,
            monto: monto,
            estudiante: estudiante
        };
        
        datos.casilleros[numero].pagos.push(nuevoPago);
        datos.casilleros[numero].estudiante = estudiante;
        datos.casilleros[numero].totalPagado += monto;
        
        // Agregar al historial del año correspondiente
        if (anio === '2026') {
            if (!datos.casilleros[numero].historialMeses2026.includes(mes)) {
                datos.casilleros[numero].historialMeses2026.push(mes);
            }
        } else if (anio === '2027') {
            if (!datos.casilleros[numero].historialMeses2027.includes(mes)) {
                datos.casilleros[numero].historialMeses2027.push(mes);
            }
        }
    }
    
    guardarDatos();
    actualizarDashboard();
    actualizarVistaCasilleros();
    actualizarDetalleCajaFuerte();
    actualizarSeguimiento();
    
    document.getElementById('formPagoCasillero').reset();
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaPagoCasillero').value = hoy;
    document.getElementById('multipleMeses').checked = false;
    document.getElementById('mesesMultipleContainer').style.display = 'none';
    
    mostrarMensaje('Pago de casillero registrado exitosamente', 'success');
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
            pagos: [],
            historialMeses2026: [],
            historialMeses2027: [],
            totalPagado: 0
        };
        
        guardarDatos();
        actualizarVistaCasilleros();
        actualizarDetalleCajaFuerte();
        
        mostrarMensaje('Casillero liberado exitosamente', 'success');
    }
}

// EDITAR CASILLERO SELECCIONADO
function editarCasilleroSeleccionado() {
    if (!isAdmin) return;
    
    const numero = parseInt(document.getElementById('numeroCasillero').value);
    if (!numero) {
        mostrarMensaje('Seleccione un casillero primero', 'error');
        return;
    }
    
    abrirModalEditarCasillero(numero);
}

// FUNCIÓN ACTUALIZAR DASHBOARD
function actualizarDashboard() {
    // 1. DINERO INICIAL
    if (datos.dineroInicial === 0) {
        datos.dineroInicial = obtenerDineroInicial();
    }
    
    // 2. TOTAL APORTES ESTUDIANTES
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
    if (document.getElementById('saldoCaja')) {
        document.getElementById('saldoCaja').textContent = `Bs ${datos.dineroFinal.toFixed(2)}`;
    }
}

// Función para obtener el dinero inicial
function obtenerDineroInicial() {
    if (datos.movimientosCaja.length === 0) return 0;
    
    const movimientosIngreso = datos.movimientosCaja
        .filter(mov => mov.tipo === 'ingreso')
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    return movimientosIngreso.length > 0 ? (movimientosIngreso[0].monto || 0) : 0;
}

// ACTUALIZAR DETALLE DE CAJA FUERTE
function actualizarDetalleCajaFuerte() {
    // Calcular ingresos por aportes
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
    
    // Calcular otros ingresos
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
    
    // Calcular gastos por categoría
    let gastosOperativos = 0;
    let gastosInversiones = 0;
    
    for (const gasto of datos.gastos) {
        if (['viajes', 'compras', 'talleres', 'otros'].includes(gasto.categoria)) {
            gastosOperativos += gasto.monto || 0;
        } else if (['cefom', 'inscripciones'].includes(gasto.categoria)) {
            gastosInversiones += gasto.monto || 0;
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
    if (document.getElementById('gastosOperativos')) {
        document.getElementById('gastosOperativos').textContent = `Bs ${gastosOperativos.toFixed(2)}`;
    }
    if (document.getElementById('gastosInversiones')) {
        document.getElementById('gastosInversiones').textContent = `Bs ${gastosInversiones.toFixed(2)}`;
    }
}

// ACTUALIZAR TOTAL DE OTROS COBROS
function actualizarTotalOtrosCobros() {
    let total = 0;
    datos.otrosCobros.forEach(cobro => {
        total += cobro.monto || 0;
    });
    datos.totalOtrosCobros = total;
    
    if (document.getElementById('totalOtrosCobros')) {
        document.getElementById('totalOtrosCobros').textContent = `Bs ${total.toFixed(2)}`;
    }
}

// ACTUALIZAR SEGUIMIENTO
function actualizarSeguimiento() {
    if (document.getElementById('totalCajaSeguimiento')) {
        document.getElementById('totalCajaSeguimiento').textContent = `Bs ${datos.dineroFinal.toFixed(2)}`;
    }
    
    // Calcular total de aportes
    let totalAportes = 0;
    let totalDeudas = 0;
    let estudiantesAlDia = 0;
    
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
    
    if (document.getElementById('totalAportesSeguimiento')) {
        document.getElementById('totalAportesSeguimiento').textContent = `Bs ${totalAportes.toFixed(2)}`;
    }
    
    // Calcular total de deudas y estudiantes al día
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
        if (datosCurso.estudiantes) {
            datosCurso.estudiantes.forEach(estudiante => {
                let estaAlDia = true;
                
                if (estudiante.pagos) {
                    ['2026', '2027'].forEach(anio => {
                        const montoRequerido = obtenerMontoCurso(cursoNombre, anio);
                        const pago = estudiante.pagos[anio] || { monto: 0, fecha: '', pagado: false };
                        
                        if (!pago.pagado || pago.monto < montoRequerido) {
                            estaAlDia = false;
                            totalDeudas += (montoRequerido - (pago.pagado ? pago.monto : 0));
                        }
                    });
                } else {
                    estaAlDia = false;
                    totalDeudas += obtenerMontoCurso(cursoNombre, '2026') + obtenerMontoCurso(cursoNombre, '2027');
                }
                
                if (estaAlDia) {
                    estudiantesAlDia++;
                }
            });
        }
    }
    
    if (document.getElementById('totalDeudasSeguimiento')) {
        document.getElementById('totalDeudasSeguimiento').textContent = `Bs ${totalDeudas.toFixed(2)}`;
    }
    
    if (document.getElementById('estudiantesAlDia')) {
        document.getElementById('estudiantesAlDia').textContent = estudiantesAlDia;
    }
    
    actualizarTablaSeguimientoEstudiantes();
    actualizarResumenCursosSeguimiento();
    actualizarTablasMovimientosSeguimiento();
}

// ACTUALIZAR TABLA DE SEGUIMIENTO ESTUDIANTES - CORREGIDA
function actualizarTablaSeguimientoEstudiantes() {
    const tbody = document.getElementById('tablaSeguimientoEstudiantes');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let contador = 1;
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
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
                if (totalDeuda === 0) {
                    estadoGeneral = 'al-dia';
                } else if (totalPagado === 0) {
                    estadoGeneral = 'con-deuda';
                } else {
                    estadoGeneral = 'parcial';
                }
                
                const fila = document.createElement('tr');
                // AGREGAR DATA-ATTRIBUTES PARA FILTRAR
                fila.setAttribute('data-curso', cursoNombre);
                fila.setAttribute('data-estudiante', estudiante.nombre || `Estudiante ${index + 1}`);
                fila.setAttribute('data-estado', estadoGeneral);
                
                fila.innerHTML = `
                    <td>${contador}</td>
                    <td><strong>${cursoNombre}</strong></td>
                    <td>${estudiante.nombre || `Estudiante ${index + 1}`}</td>
                    <td>Bs ${montoReq2026.toFixed(2)}</td>
                    <td class="${pago2026.pagado ? 'text-success' : 'text-danger'}">
                        ${pago2026.pagado ? 'Bs ' + (pago2026.monto || 0).toFixed(2) : 'Bs 0.00'}
                    </td>
                    <td>
                        <span class="estado-${estado2026}">
                            ${estado2026 === 'pagado' ? 'COMPLETO' : estado2026 === 'deuda' ? 'DEUDA' : 'PARCIAL'}
                        </span>
                    </td>
                    <td>Bs ${montoReq2027.toFixed(2)}</td>
                    <td class="${pago2027.pagado ? 'text-success' : 'text-danger'}">
                        ${pago2027.pagado ? 'Bs ' + (pago2027.monto || 0).toFixed(2) : 'Bs 0.00'}
                    </td>
                    <td>
                        <span class="estado-${estado2027}">
                            ${estado2027 === 'pagado' ? 'COMPLETO' : estado2027 === 'deuda' ? 'DEUDA' : 'PARCIAL'}
                        </span>
                    </td>
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

// Función auxiliar para determinar estado de pago
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

// ACTUALIZAR RESUMEN DE CURSOS EN SEGUIMIENTO - POR AÑO (2026 y 2027)
function actualizarResumenCursosSeguimiento() {
    const contenedor = document.getElementById('resumenCursosSeguimiento');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
        if (datosCurso.estudiantes) {
            let totalEstudiantes = datosCurso.estudiantes.length;
            
            // Estadísticas para 2026
            let estudiantesAlDia2026 = 0;
            let estudiantesParcial2026 = 0;
            let estudiantesConDeuda2026 = 0;
            let totalRecaudado2026 = 0;
            let totalEsperado2026 = 0;
            
            // Estadísticas para 2027
            let estudiantesAlDia2027 = 0;
            let estudiantesParcial2027 = 0;
            let estudiantesConDeuda2027 = 0;
            let totalRecaudado2027 = 0;
            let totalEsperado2027 = 0;
            
            const montoReq2026 = obtenerMontoCurso(cursoNombre, '2026');
            const montoReq2027 = obtenerMontoCurso(cursoNombre, '2027');
            
            datosCurso.estudiantes.forEach(estudiante => {
                const pago2026 = estudiante.pagos ? estudiante.pagos['2026'] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false };
                const pago2027 = estudiante.pagos ? estudiante.pagos['2027'] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false };
                
                totalEsperado2026 += montoReq2026;
                totalEsperado2027 += montoReq2027;
                
                // Calcular para 2026
                if (pago2026.pagado && pago2026.monto >= montoReq2026) {
                    estudiantesAlDia2026++;
                    totalRecaudado2026 += pago2026.monto;
                } else if (pago2026.pagado && pago2026.monto > 0 && pago2026.monto < montoReq2026) {
                    estudiantesParcial2026++;
                    totalRecaudado2026 += pago2026.monto;
                } else if (!pago2026.pagado || pago2026.monto === 0) {
                    estudiantesConDeuda2026++;
                }
                
                // Calcular para 2027
                if (pago2027.pagado && pago2027.monto >= montoReq2027) {
                    estudiantesAlDia2027++;
                    totalRecaudado2027 += pago2027.monto;
                } else if (pago2027.pagado && pago2027.monto > 0 && pago2027.monto < montoReq2027) {
                    estudiantesParcial2027++;
                    totalRecaudado2027 += pago2027.monto;
                } else if (!pago2027.pagado || pago2027.monto === 0) {
                    estudiantesConDeuda2027++;
                }
            });
            
            const porcentajeAlDia2026 = totalEstudiantes > 0 ? Math.round((estudiantesAlDia2026 / totalEstudiantes) * 100) : 0;
            const porcentajeAlDia2027 = totalEstudiantes > 0 ? Math.round((estudiantesAlDia2027 / totalEstudiantes) * 100) : 0;
            
            const resumenDiv = document.createElement('div');
            resumenDiv.className = 'col-md-6 mb-4'; // Cambiado a col-md-6 para mostrar más grande
            
            resumenDiv.innerHTML = `
                <div class="resumen-curso" style="border: 2px solid #bc13fe; border-radius: 10px; padding: 15px; background: rgba(10, 8, 35, 0.8); box-shadow: 0 0 15px rgba(188, 19, 254, 0.3);">
                    <h6 style="color: #ffcc00; font-weight: 700; margin-bottom: 15px; text-align: center;">
                        ${cursoNombre}
                    </h6>
                    
                    <!-- AÑO 2026 -->
                    <div class="mb-3" style="border: 1px solid #ff5e00; border-radius: 8px; padding: 10px; background: rgba(255, 94, 0, 0.1);">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 style="color: #ff5e00; margin: 0; font-weight: bold;">
                                <i class="fas fa-calendar"></i> AÑO 2026
                            </h6>
                            <small style="color: #aaa;">Monto: Bs ${montoReq2026}</small>
                        </div>
                        
                        <div class="row text-center">
                            <div class="col-4">
                                <div class="numero text-success" style="font-size: 1.5rem; font-weight: bold;">${estudiantesAlDia2026}</div>
                                <small style="color: #aaa; font-size: 0.7rem;">Al día</small>
                            </div>
                            <div class="col-4">
                                <div class="numero text-warning" style="font-size: 1.5rem; font-weight: bold;">${estudiantesParcial2026}</div>
                                <small style="color: #aaa; font-size: 0.7rem;">Parcial</small>
                            </div>
                            <div class="col-4">
                                <div class="numero text-danger" style="font-size: 1.5rem; font-weight: bold;">${estudiantesConDeuda2026}</div>
                                <small style="color: #aaa; font-size: 0.7rem;">Con deuda</small>
                            </div>
                        </div>
                        
                        <div class="mt-2">
                            <div class="d-flex justify-content-between">
                                <small style="color: #aaa;">Recaudado:</small>
                                <strong style="color: #00ff00">Bs ${totalRecaudado2026.toFixed(2)}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <small style="color: #aaa;">Esperado:</small>
                                <strong style="color: #ffcc00">Bs ${totalEsperado2026.toFixed(2)}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <small style="color: #aaa;">% Al día:</small>
                                <strong style="color: ${porcentajeAlDia2026 > 50 ? '#28a745' : porcentajeAlDia2026 > 25 ? '#ffc107' : '#dc3545'}">
                                    ${porcentajeAlDia2026}%
                                </strong>
                            </div>
                        </div>
                        
                        <!-- Barra de progreso 2026 -->
                        <div class="mt-2">
                            <div class="progress" style="height: 8px; background: rgba(255,255,255,0.1);">
                                <div class="progress-bar bg-success" style="width: ${(estudiantesAlDia2026/totalEstudiantes*100)}%" 
                                     title="${estudiantesAlDia2026} al día"></div>
                                <div class="progress-bar bg-warning" style="width: ${(estudiantesParcial2026/totalEstudiantes*100)}%" 
                                     title="${estudiantesParcial2026} parcial"></div>
                                <div class="progress-bar bg-danger" style="width: ${(estudiantesConDeuda2026/totalEstudiantes*100)}%" 
                                     title="${estudiantesConDeuda2026} con deuda"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AÑO 2027 -->
                    <div class="mb-2" style="border: 1px solid #00ffff; border-radius: 8px; padding: 10px; background: rgba(0, 255, 255, 0.1);">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 style="color: #00ffff; margin: 0; font-weight: bold;">
                                <i class="fas fa-calendar"></i> AÑO 2027
                            </h6>
                            <small style="color: #aaa;">Monto: Bs ${montoReq2027}</small>
                        </div>
                        
                        <div class="row text-center">
                            <div class="col-4">
                                <div class="numero text-success" style="font-size: 1.5rem; font-weight: bold;">${estudiantesAlDia2027}</div>
                                <small style="color: #aaa; font-size: 0.7rem;">Al día</small>
                            </div>
                            <div class="col-4">
                                <div class="numero text-warning" style="font-size: 1.5rem; font-weight: bold;">${estudiantesParcial2027}</div>
                                <small style="color: #aaa; font-size: 0.7rem;">Parcial</small>
                            </div>
                            <div class="col-4">
                                <div class="numero text-danger" style="font-size: 1.5rem; font-weight: bold;">${estudiantesConDeuda2027}</div>
                                <small style="color: #aaa; font-size: 0.7rem;">Con deuda</small>
                            </div>
                        </div>
                        
                        <div class="mt-2">
                            <div class="d-flex justify-content-between">
                                <small style="color: #aaa;">Recaudado:</small>
                                <strong style="color: #00ff00">Bs ${totalRecaudado2027.toFixed(2)}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <small style="color: #aaa;">Esperado:</small>
                                <strong style="color: #ffcc00">Bs ${totalEsperado2027.toFixed(2)}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <small style="color: #aaa;">% Al día:</small>
                                <strong style="color: ${porcentajeAlDia2027 > 50 ? '#28a745' : porcentajeAlDia2027 > 25 ? '#ffc107' : '#dc3545'}">
                                    ${porcentajeAlDia2027}%
                                </strong>
                            </div>
                        </div>
                        
                        <!-- Barra de progreso 2027 -->
                        <div class="mt-2">
                            <div class="progress" style="height: 8px; background: rgba(255,255,255,0.1);">
                                <div class="progress-bar bg-success" style="width: ${(estudiantesAlDia2027/totalEstudiantes*100)}%" 
                                     title="${estudiantesAlDia2027} al día"></div>
                                <div class="progress-bar bg-warning" style="width: ${(estudiantesParcial2027/totalEstudiantes*100)}%" 
                                     title="${estudiantesParcial2027} parcial"></div>
                                <div class="progress-bar bg-danger" style="width: ${(estudiantesConDeuda2027/totalEstudiantes*100)}%" 
                                     title="${estudiantesConDeuda2027} con deuda"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- RESUMEN TOTAL -->
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 8px; border-radius: 5px; margin-top: 10px;">
                        <div class="d-flex justify-content-between">
                            <small style="color: #aaa;"><strong>Total estudiantes:</strong></small>
                            <strong style="color: white;">${totalEstudiantes}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <small style="color: #aaa;">Total recaudado:</small>
                            <strong style="color: #00ff00">Bs ${(totalRecaudado2026 + totalRecaudado2027).toFixed(2)}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <small style="color: #aaa;">Total esperado:</small>
                            <strong style="color: #ffcc00">Bs ${(totalEsperado2026 + totalEsperado2027).toFixed(2)}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <small style="color: #aaa;">Porcentaje total:</small>
                            <strong style="color: #bc13fe">
                                ${totalEstudiantes > 0 ? Math.round(((estudiantesAlDia2026 + estudiantesAlDia2027) / (totalEstudiantes * 2) * 100)) : 0}%
                            </strong>
                        </div>
                    </div>
                </div>
            `;
            contenedor.appendChild(resumenDiv);
        }
    }
}

function actualizarTablasMovimientosSeguimiento() {
    const tbodyIngresos = document.getElementById('tablaIngresosSeguimiento');
    if (tbodyIngresos) {
        tbodyIngresos.innerHTML = '';
        
        const ingresosRecientes = datos.movimientosCaja
            .filter(mov => mov.tipo === 'ingreso')
            .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
            .slice(0, 10);
        
        ingresosRecientes.forEach(movimiento => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${movimiento.fecha || 'Sin fecha'}</td>
                <td>${movimiento.concepto || 'Sin concepto'}</td>
                <td class="text-success">Bs ${(movimiento.monto || 0).toFixed(2)}</td>
            `;
            tbodyIngresos.appendChild(fila);
        });
    }
    
    const tbodyGastos = document.getElementById('tablaGastosSeguimiento');
    if (tbodyGastos) {
        tbodyGastos.innerHTML = '';
        
        const gastosRecientes = datos.gastos
            .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
            .slice(0, 10);
        
        gastosRecientes.forEach(gasto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${gasto.fecha || 'Sin fecha'}</td>
                <td>${gasto.categoria || 'Sin categoría'}</td>
                <td class="text-danger">Bs ${(gasto.monto || 0).toFixed(2)}</td>
            `;
            tbodyGastos.appendChild(fila);
        });
    }
}

// FILTRAR ESTUDIANTES EN SEGUIMIENTO - CORREGIDA DEFINITIVAMENTE
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
        
        // Filtrar por nombre (corregido)
        if (filtroNombre && !estudiante.includes(filtroNombre)) {
            mostrar = false;
        }
        
        // Filtrar por curso
        if (filtroCurso !== 'todos' && curso !== filtroCurso) {
            mostrar = false;
        }
        
        // Filtrar por estado
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

// CARGAR ESTUDIANTES PARA LA PESTAÑA DE APORTES
function cargarEstudiantesParaAportes() {
    const cursoSeleccionado = document.getElementById('curso').value;
    const container = document.querySelector('.estudiantes-pagos-container');
    
    if (!container) return;
    
    if (!cursoSeleccionado) {
        container.innerHTML = '<p class="text-muted">Seleccione un curso para cargar los estudiantes</p>';
        return;
    }
    
    const datosCurso = datos.cursos[cursoSeleccionado];
    container.innerHTML = '';
    
    if (!datosCurso || !datosCurso.estudiantes || datosCurso.estudiantes.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay estudiantes registrados para este curso</p>';
        return;
    }
    
    datosCurso.estudiantes.forEach((est, index) => {
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${index}" id="est${index}" ${!isAdmin ? 'disabled' : ''}>
            <label class="form-check-label" for="est${index}">
                ${est.nombre || `Estudiante ${index + 1}`}
            </label>
        `;
        container.appendChild(div);
    });
}

// CARGAR ESTUDIANTES PARA OTROS COBROS
function cargarEstudiantesParaOtrosCobros() {
    const cursoSeleccionado = document.getElementById('cursoOtroCobro').value;
    const estudianteSelect = document.getElementById('estudianteOtroCobro');
    
    if (!estudianteSelect) return;
    
    estudianteSelect.innerHTML = '<option value="">Seleccione estudiante</option>';
    estudianteSelect.disabled = !cursoSeleccionado;
    
    if (!cursoSeleccionado) return;
    
    const datosCurso = datos.cursos[cursoSeleccionado];
    
    if (datosCurso && datosCurso.estudiantes) {
        datosCurso.estudiantes.forEach((est, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = est.nombre || `Estudiante ${index + 1}`;
            estudianteSelect.appendChild(option);
        });
    }
}

// CARGAR CURSO SELECCIONADO MEJORADO
function cargarCursoSeleccionado() {
    const cursoSeleccionado = document.getElementById('selectorCurso').value;
    
    if (!cursoSeleccionado) {
        mostrarMensaje('Seleccione un curso', 'error');
        return;
    }
    
    const monto2026 = obtenerMontoCurso(cursoSeleccionado, '2026');
    const monto2027 = obtenerMontoCurso(cursoSeleccionado, '2027');
    
    document.getElementById('tituloCurso').textContent = `Gestión de Pagos - ${cursoSeleccionado}`;
    document.getElementById('infoMontosCurso').innerHTML = `
        <span class="text-info">Monto 2026: <strong>Bs ${monto2026}</strong></span> | 
        <span class="text-warning">Monto 2027: <strong>Bs ${monto2027}</strong></span>
    `;
    
    document.getElementById('contenedorCurso').style.display = 'block';
    
    const datosCurso = datos.cursos[cursoSeleccionado];
    const cuerpoTabla = document.getElementById('cuerpoTablaPagos');
    cuerpoTabla.innerHTML = '';
    
    if (!datosCurso.estudiantes) datosCurso.estudiantes = [];
    
    datosCurso.estudiantes.forEach((estudiante, index) => {
        const totalPagado = Object.values(estudiante.pagos || {}).reduce((total, pago) => total + (pago.pagado ? (pago.monto || 0) : 0), 0);
        
        let deudaTotal = 0;
        if (estudiante.pagos) {
            if (!estudiante.pagos[2026] || !estudiante.pagos[2026].pagado || estudiante.pagos[2026].monto < monto2026) {
                deudaTotal += (monto2026 - (estudiante.pagos[2026] && estudiante.pagos[2026].pagado ? estudiante.pagos[2026].monto : 0));
            }
            if (!estudiante.pagos[2027] || !estudiante.pagos[2027].pagado || estudiante.pagos[2027].monto < monto2027) {
                deudaTotal += (monto2027 - (estudiante.pagos[2027] && estudiante.pagos[2027].pagado ? estudiante.pagos[2027].monto : 0));
            }
        } else {
            deudaTotal = monto2026 + monto2027;
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
        if (deudaTotal === (monto2026 + monto2027)) {
            estadoGeneral = 'con-deuda';
        } else if (deudaTotal > 0) {
            estadoGeneral = 'parcial';
        }
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <input type="text" class="form-control form-control-sm" value="${estudiante.nombre || `Estudiante ${index + 1}`}" 
                       onchange="${isAdmin ? `actualizarNombreEstudiante('${cursoSeleccionado}', ${index}, this.value)` : ''}"
                       ${!isAdmin ? 'disabled' : ''}>
            </td>
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

// REGISTRAR APORTE
function registrarAporte(e) {
    e.preventDefault();
    
    if (!isAdmin) return;
    
    const curso = document.getElementById('curso').value;
    const anio = document.getElementById('anio').value;
    const montoAporte = parseFloat(document.getElementById('montoAporte').value) || 0;
    
    if (!curso || !anio || !montoAporte) {
        mostrarMensaje('Complete todos los campos', 'error');
        return;
    }
    
    if (isNaN(montoAporte) || montoAporte <= 0) {
        mostrarMensaje('Ingrese un monto válido', 'error');
        return;
    }
    
    const montoRequerido = obtenerMontoCurso(curso, anio);
    if (montoAporte < montoRequerido) {
        if (!confirm(`El monto ingresado (Bs ${montoAporte}) es menor al requerido para ${curso} en ${anio} (Bs ${montoRequerido}). ¿Desea continuar?`)) {
            return;
        }
    }
    
    const estudiantesSeleccionados = [];
    const checkboxes = document.querySelectorAll('.estudiantes-pagos-container .form-check-input:checked');
    checkboxes.forEach(checkbox => estudiantesSeleccionados.push(parseInt(checkbox.value)));
    
    if (estudiantesSeleccionados.length === 0) {
        mostrarMensaje('Seleccione al menos un estudiante', 'error');
        return;
    }
    
    const fecha = new Date().toISOString().split('T')[0];
    estudiantesSeleccionados.forEach(index => {
        if (!datos.cursos[curso].estudiantes[index].pagos) {
            datos.cursos[curso].estudiantes[index].pagos = {
                2026: { monto: 0, fecha: '', pagado: false },
                2027: { monto: 0, fecha: '', pagado: false }
            };
        }
        
        datos.cursos[curso].estudiantes[index].pagos[anio] = {
            monto: montoAporte,
            fecha: fecha,
            pagado: true
        };
    });
    
    const totalRecaudado = montoAporte * estudiantesSeleccionados.length;
    
    const nuevoAporte = {
        id: Date.now(),
        monto: totalRecaudado,
        fecha: fecha,
        concepto: `Aporte ${curso} - ${estudiantesSeleccionados.length} estudiantes (${anio})`,
        curso: curso,
        anio: anio
    };
    
    datos.aportes.push(nuevoAporte);
    
    guardarDatos();
    actualizarDashboard();
    actualizarTablaAportes();
    actualizarResumenAportesCursos();
    actualizarDetalleCajaFuerte();
    actualizarSeguimiento();
    
    document.getElementById('formAporte').reset();
    document.getElementById('anio').value = new Date().getFullYear();
    document.querySelector('.estudiantes-pagos-container').innerHTML = '<p class="text-muted">Seleccione un curso para cargar los estudiantes</p>';
    
    mostrarMensaje(`Aporte registrado exitosamente. Total recaudado: Bs ${totalRecaudado.toFixed(2)}`, 'success');
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

// REGISTRAR OTRO COBRO
function registrarOtroCobro(e) {
    e.preventDefault();
    
    if (!isAdmin) return;
    
    const curso = document.getElementById('cursoOtroCobro').value;
    const estudianteIndex = document.getElementById('estudianteOtroCobro').value;
    const concepto = document.getElementById('conceptoOtroCobro').value;
    const monto = parseFloat(document.getElementById('montoOtroCobro').value) || 0;
    const fecha = document.getElementById('fechaOtroCobro').value;
    const observaciones = document.getElementById('observacionesOtroCobro').value;
    
    if (!curso || !estudianteIndex || !concepto || !monto || !fecha) {
        mostrarMensaje('Complete todos los campos', 'error');
        return;
    }
    
    const estudiante = datos.cursos[curso].estudiantes[estudianteIndex];
    
    const nuevoCobro = {
        id: Date.now(),
        curso: curso,
        estudiante: estudiante.nombre || `Estudiante ${parseInt(estudianteIndex) + 1}`,
        concepto: concepto,
        monto: monto,
        fecha: fecha,
        observaciones: observaciones
    };
    
    datos.otrosCobros.push(nuevoCobro);
    datos.totalOtrosCobros += monto;
    
    guardarDatos();
    actualizarTablaOtrosCobros();
    actualizarTotalOtrosCobros();
    
    document.getElementById('formOtroCobro').reset();
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaOtroCobro').value = hoy;
    
    mostrarMensaje('Cobro registrado exitosamente', 'success');
}

// REGISTRAR EVENTO MEJORADO
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
            fotosHTML = '<div class="evento-imagenes">';
            evento.fotos.forEach((foto, index) => {
                fotosHTML += `
                    <img src="data:${foto.tipo};base64,${foto.datos}" 
                         alt="${foto.nombre}" 
                         class="evento-imagen"
                         onclick="ampliarImagen('data:${foto.tipo};base64,${foto.datos}')">
                `;
            });
            fotosHTML += '</div>';
            fotosHTML += `<p class="fotos-count"><i class="fas fa-camera"></i> ${evento.fotos.length} foto(s)</p>`;
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

// FUNCIONES PARA ELIMINAR REGISTROS (actualizan dashboard)
function eliminarGasto(id) {
    if (!isAdmin) return;
    
    if (confirm('¿Está seguro de eliminar este gasto?')) {
        const index = datos.gastos.findIndex(gasto => gasto.id === id);
        if (index !== -1) {
            const gasto = datos.gastos[index];
            datos.gastos.splice(index, 1);
            
            // Actualizar dashboard
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
            
            // Actualizar dashboard
            actualizarDashboard();
            actualizarDetalleCajaFuerte();
            actualizarSeguimiento();
            
            guardarDatos();
            actualizarTablaMovimientosCaja();
            mostrarMensaje('Movimiento eliminado y dashboard actualizado', 'success');
        }
    }
}

function eliminarOtroCobro(id) {
    if (!isAdmin) return;
    
    if (confirm('¿Está seguro de eliminar este cobro?')) {
        const index = datos.otrosCobros.findIndex(cobro => cobro.id === id);
        if (index !== -1) {
            const cobro = datos.otrosCobros[index];
            datos.totalOtrosCobros -= cobro.monto || 0;
            datos.otrosCobros.splice(index, 1);
            
            guardarDatos();
            actualizarTablaOtrosCobros();
            actualizarTotalOtrosCobros();
            mostrarMensaje('Cobro eliminado', 'success');
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

// INICIALIZACIÓN DE GRÁFICOS
let graficoGastos = null;
let graficoAportes = null;
let graficoEvolucion = null;

function inicializarGraficos() {
    if (graficoGastos) graficoGastos.destroy();
    if (graficoAportes) graficoAportes.destroy();
    if (graficoEvolucion) graficoEvolucion.destroy();
    
    const ctxGastos = document.getElementById('graficoGastos');
    if (ctxGastos) {
        graficoGastos = new Chart(ctxGastos.getContext('2d'), {
            type: 'doughnut',
            data: obtenerDatosGraficoGastos(),
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff', font: { size: 12, weight: 'bold' } }
                    }
                }
            }
        });
    }
    
    const ctxAportes = document.getElementById('graficoAportes');
    if (ctxAportes) {
        graficoAportes = new Chart(ctxAportes.getContext('2d'), {
            type: 'bar',
            data: obtenerDatosGraficoAportes(),
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
    
    const ctxEvolucion = document.getElementById('graficoEvolucion');
    if (ctxEvolucion) {
        graficoEvolucion = new Chart(ctxEvolucion.getContext('2d'), {
            type: 'line',
            data: obtenerDatosGraficoEvolucion(),
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
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
            borderColor: '#fff',
            borderWidth: 2
        }]
    };
}

function obtenerDatosGraficoAportes() {
    const filtroAnio = document.getElementById('filtroAnio') ? document.getElementById('filtroAnio').value : 'todos';
    
    const años = ['2026', '2027'];
    const datosPorAño = {};
    años.forEach(año => datosPorAño[año] = 0);
    
    // Sumar aportes registrados
    datos.aportes.forEach(aporte => {
        if (filtroAnio !== 'todos' && aporte.anio !== filtroAnio) return;
        if (datosPorAño.hasOwnProperty(aporte.anio)) {
            datosPorAño[aporte.anio] += aporte.monto || 0;
        }
    });
    
    // Sumar pagos de estudiantes
    for (const curso of Object.values(datos.cursos)) {
        if (curso.estudiantes) {
            for (const estudiante of curso.estudiantes) {
                if (estudiante.pagos) {
                    años.forEach(año => {
                        if (filtroAnio !== 'todos' && año !== filtroAnio) return;
                        if (estudiante.pagos[año] && estudiante.pagos[año].pagado) {
                            datosPorAño[año] += estudiante.pagos[año].monto || 0;
                        }
                    });
                }
            }
        }
    }
    
    return {
        labels: años,
        datasets: [{
            label: 'Aportes por Año (Bs)',
            data: años.map(año => datosPorAño[año]),
            backgroundColor: 'rgba(255, 94, 0, 0.6)',
            borderColor: 'rgba(255, 94, 0, 1)',
            borderWidth: 2
        }]
    };
}

function obtenerDatosGraficoEvolucion() {
    const filtroAnio = document.getElementById('filtroAnio') ? document.getElementById('filtroAnio').value : 'todos';
    
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const datosAportes = new Array(12).fill(0);
    const datosGastos = new Array(12).fill(0);
    
    datos.aportes.forEach(aporte => {
        try {
            const fecha = new Date(aporte.fecha);
            if (!isNaN(fecha)) {
                const anio = fecha.getFullYear();
                const mes = fecha.getMonth();
                
                // Filtrar por año
                if (filtroAnio !== 'todos' && anio.toString() !== filtroAnio) return;
                
                if (mes >= 0 && mes < 12) {
                    datosAportes[mes] += aporte.monto || 0;
                }
            }
        } catch (e) {}
    });
    
    datos.gastos.forEach(gasto => {
        try {
            const fecha = new Date(gasto.fecha);
            if (!isNaN(fecha)) {
                const anio = fecha.getFullYear();
                const mes = fecha.getMonth();
                
                // Filtrar por año
                if (filtroAnio !== 'todos' && anio.toString() !== filtroAnio) return;
                
                if (mes >= 0 && mes < 12) {
                    datosGastos[mes] += gasto.monto || 0;
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
    
    if (graficoAportes) {
        graficoAportes.data = obtenerDatosGraficoAportes();
        graficoAportes.update();
    }
    
    if (graficoEvolucion) {
        graficoEvolucion.data = obtenerDatosGraficoEvolucion();
        graficoEvolucion.update();
    }
}

function actualizarReportes() {
    actualizarGraficos();
    actualizarReporteMensual();
}

// ACTUALIZAR REPORTE MENSUAL SEPARADO POR AÑO
function actualizarReporteMensual() {
    actualizarReporteMensualPorAnio('2026', 'tablaReporteMensual2026');
    actualizarReporteMensualPorAnio('2027', 'tablaReporteMensual2027');
}

function actualizarReporteMensualPorAnio(anio, tablaId) {
    const tabla = document.getElementById(tablaId);
    if (!tabla) return;
    
    tabla.innerHTML = '';
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    let acumulado = 0;
    
    meses.forEach((mes, index) => {
        const mesNum = index + 1;
        
        let aportesMes = 0;
        datos.aportes.forEach(aporte => {
            try {
                const fecha = new Date(aporte.fecha);
                if (!isNaN(fecha)) {
                    const anioGasto = fecha.getFullYear().toString();
                    if (anioGasto === anio && fecha.getMonth() + 1 === mesNum) {
                        aportesMes += aporte.monto || 0;
                    }
                }
            } catch (e) {}
        });
        
        let gastosMes = 0;
        datos.gastos.forEach(gasto => {
            try {
                const fecha = new Date(gasto.fecha);
                if (!isNaN(fecha)) {
                    const anioGasto = fecha.getFullYear().toString();
                    if (anioGasto === anio && fecha.getMonth() + 1 === mesNum) {
                        gastosMes += gasto.monto || 0;
                    }
                }
            } catch (e) {}
        });
        
        const balanceMes = aportesMes - gastosMes;
        acumulado += balanceMes;
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${mes}</strong></td>
            <td>Bs ${aportesMes.toFixed(2)}</td>
            <td>Bs ${gastosMes.toFixed(2)}</td>
            <td class="${balanceMes >= 0 ? 'text-success' : 'text-danger'}"><strong>Bs ${balanceMes.toFixed(2)}</strong></td>
        `;
        tabla.appendChild(fila);
    });
    
    // Agregar fila de total
    const filaTotal = document.createElement('tr');
    filaTotal.className = 'table-primary';
    filaTotal.innerHTML = `
        <td><strong>TOTAL ${anio}</strong></td>
        <td><strong>Bs ${acumulado >= 0 ? '+' : ''}${acumulado.toFixed(2)}</strong></td>
        <td></td>
        <td></td>
    `;
    tabla.appendChild(filaTotal);
}

// GUARDAR PAGOS DEL CURSO
function guardarPagosCurso() {
    if (!isAdmin) return;
    
    guardarDatos();
    mostrarMensaje('Cambios guardados exitosamente', 'success');
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
        const tieneDeuda = Object.values(estudiante.pagos || {}).some(pago => !pago.pagado && (pago.monto || 0) > 0);
        
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
            tieneDeuda ? 'CON DEUDA' : 'AL DÍA'
        ].join(";");
        
        csvContent += fila + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pagos_${cursoSeleccionado.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarMensaje('Archivo Excel generado exitosamente', 'success');
}

// EXPORTAR EXCEL COMPLETO
function exportarExcelCompleto() {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Encabezados
    csvContent += "Curso;Estudiante;2026;Fecha 2026;Estado 2026;2027;Fecha 2027;Estado 2027;Total Pagado;Estado\n";
    
    // Datos de todos los cursos
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
        datosCurso.estudiantes.forEach((estudiante, index) => {
            const totalPagado = Object.values(estudiante.pagos || {}).reduce((total, pago) => total + (pago.pagado ? (pago.monto || 0) : 0), 0);
            const tieneDeuda = Object.values(estudiante.pagos || {}).some(pago => !pago.pagado && (pago.monto || 0) > 0);
            
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
                tieneDeuda ? 'CON DEUDA' : 'AL DÍA'
            ].join(";");
            
            csvContent += fila + "\n";
        });
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

// GENERAR PDF DEL CURSO
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
            <title>Listado de Estudiantes - ${cursoSeleccionado}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
                .reporte { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .header h2 { color: #333; margin-bottom: 5px; }
                .header h3 { color: #666; margin-top: 0; }
                .info-montos { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center; }
                .tabla { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10px; }
                .tabla th, .tabla td { border: 1px solid #000; padding: 6px; text-align: left; }
                .tabla th { background-color: #f2f2f2; font-weight: bold; }
                .pagado { color: green; font-weight: bold; }
                .deuda { color: red; font-weight: bold; }
                .parcial { color: orange; font-weight: bold; }
                .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="reporte">
                <div class="header">
                    <h2>FEDERACIÓN ESTUDIANTIL</h2>
                    <h3>LISTADO DE ESTUDIANTES - ${cursoSeleccionado}</h3>
                    <p>Fecha de emisión: ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="info-montos">
                    <strong>Montos Requeridos:</strong> 2026: Bs ${montoReq2026} | 2027: Bs ${montoReq2027}
                </div>
                <table class="tabla">
                    <tr>
                        <th>N°</th>
                        <th>Nombre del Estudiante</th>
                        <th>2026</th>
                        <th>Fecha 2026</th>
                        <th>Estado 2026</th>
                        <th>2027</th>
                        <th>Fecha 2027</th>
                        <th>Estado 2027</th>
                        <th>Total Pagado</th>
                        <th>Deuda</th>
                        <th>Estado General</th>
                    </tr>
    `;
    
    datosCurso.estudiantes.forEach((estudiante, index) => {
        const totalPagado = Object.values(estudiante.pagos || {}).reduce((total, pago) => total + (pago.pagado ? (pago.monto || 0) : 0), 0);
        
        let deudaTotal = 0;
        if (estudiante.pagos) {
            if (!estudiante.pagos[2026] || !estudiante.pagos[2026].pagado || estudiante.pagos[2026].monto < montoReq2026) {
                deudaTotal += (montoReq2026 - (estudiante.pagos[2026] && estudiante.pagos[2026].pagado ? estudiante.pagos[2026].monto : 0));
            }
            if (!estudiante.pagos[2027] || !estudiante.pagos[2027].pagado || estudiante.pagos[2027].monto < montoReq2027) {
                deudaTotal += (montoReq2027 - (estudiante.pagos[2027] && estudiante.pagos[2027].pagado ? estudiante.pagos[2027].monto : 0));
            }
        } else {
            deudaTotal = montoReq2026 + montoReq2027;
        }
        
        const estado2026 = determinarEstadoPago(
            estudiante.pagos ? estudiante.pagos[2026] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false },
            montoReq2026
        );
        
        const estado2027 = determinarEstadoPago(
            estudiante.pagos ? estudiante.pagos[2027] || { monto: 0, fecha: '', pagado: false } : { monto: 0, fecha: '', pagado: false },
            montoReq2027
        );
        
        let estadoGeneral = 'al-dia';
        let estadoGeneralClase = 'pagado';
        let estadoGeneralTexto = 'AL DÍA';
        
        if (deudaTotal === (montoReq2026 + montoReq2027)) {
            estadoGeneral = 'con-deuda';
            estadoGeneralClase = 'deuda';
            estadoGeneralTexto = 'CON DEUDA';
        } else if (deudaTotal > 0) {
            estadoGeneral = 'parcial';
            estadoGeneralClase = 'parcial';
            estadoGeneralTexto = 'PARCIAL';
        }
        
        contenidoPDF += `
            <tr>
                <td>${index + 1}</td>
                <td>${estudiante.nombre || `Estudiante ${index + 1}`}</td>
                <td class="${estudiante.pagos && estudiante.pagos[2026] && estudiante.pagos[2026].pagado ? 'pagado' : 'deuda'}">
                    ${estudiante.pagos && estudiante.pagos[2026] && estudiante.pagos[2026].pagado ? 'Bs ' + (estudiante.pagos[2026].monto || 0).toFixed(2) : 'Bs 0.00'}
                </td>
                <td>${estudiante.pagos && estudiante.pagos[2026] ? (estudiante.pagos[2026].fecha || '-') : '-'}</td>
                <td class="${estado2026}">${estado2026 === 'pagado' ? 'COMPLETO' : estado2026 === 'deuda' ? 'DEUDA' : 'PARCIAL'}</td>
                <td class="${estudiante.pagos && estudiante.pagos[2027] && estudiante.pagos[2027].pagado ? 'pagado' : 'deuda'}">
                    ${estudiante.pagos && estudiante.pagos[2027] && estudiante.pagos[2027].pagado ? 'Bs ' + (estudiante.pagos[2027].monto || 0).toFixed(2) : 'Bs 0.00'}
                </td>
                <td>${estudiante.pagos && estudiante.pagos[2027] ? (estudiante.pagos[2027].fecha || '-') : '-'}</td>
                <td class="${estado2027}">${estado2027 === 'pagado' ? 'COMPLETO' : estado2027 === 'deuda' ? 'DEUDA' : 'PARCIAL'}</td>
                <td><strong>Bs ${totalPagado.toFixed(2)}</strong></td>
                <td class="${deudaTotal > 0 ? 'deuda' : 'pagado'}"><strong>Bs ${deudaTotal.toFixed(2)}</strong></td>
                <td class="${estadoGeneralClase}"><strong>${estadoGeneralTexto}</strong></td>
            </tr>
        `;
    });
    
    contenidoPDF += `
                </table>
                <div class="footer">
                    <p>Este documento es para control interno de la Federación Estudiantil</p>
                    <p>Montos 2026: Bs ${montoReq2026} | Montos 2027: Bs ${montoReq2027}</p>
                </div>
            </div>
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    <i class="fas fa-print"></i> Imprimir Listado
                </button>
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

// GENERAR RECIBO
function generarRecibo(curso, index) {
    const estudiante = datos.cursos[curso].estudiantes[index];
    const pagos = estudiante.pagos || {};
    
    let contenidoRecibo = `
        <html>
        <head>
            <title>Recibo de Pago - ${estudiante.nombre || `Estudiante ${index + 1}`}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .recibo { border: 2px solid #000; padding: 20px; max-width: 600px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .detalles { margin: 20px 0; }
                .firma { margin-top: 50px; border-top: 1px solid #000; padding-top: 10px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <div class="recibo">
                <div class="header">
                    <h2>FEDERACIÓN ESTUDIANTIL</h2>
                    <h3>RECIBO DE PAGO DE APORTES</h3>
                </div>
                <div class="detalles">
                    <p><strong>Estudiante:</strong> ${estudiante.nombre || `Estudiante ${index + 1}`}</p>
                    <p><strong>Curso:</strong> ${curso}</p>
                    <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString()}</p>
                    <h4>Detalle de Pagos:</h4>
                    <table>
                        <tr>
                            <th>Año</th>
                            <th>Monto</th>
                            <th>Fecha de Pago</th>
                            <th>Estado</th>
                        </tr>
    `;
    
    ['2026', '2027'].forEach(anio => {
        const pago = pagos[anio] || { monto: 0, fecha: '', pagado: false };
        contenidoRecibo += `
            <tr>
                <td>${anio}</td>
                <td>${pago.pagado ? 'Bs ' + (pago.monto || 0).toFixed(2) : 'Pendiente'}</td>
                <td>${pago.fecha || '-'}</td>
                <td>${pago.pagado ? 'PAGADO' : 'PENDIENTE'}</td>
            </tr>
        `;
    });
    
    const totalPagado = Object.values(pagos).reduce((total, pago) => total + (pago.pagado ? (pago.monto || 0) : 0), 0);
    
    contenidoRecibo += `
                    </table>
                    <p style="margin-top: 10px;"><strong>Total Pagado:</strong> Bs ${totalPagado.toFixed(2)}</p>
                </div>
                <div class="firma">
                    <p>_________________________</p>
                    <p><strong>Firma del Tesorero</strong></p>
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

// GENERAR PDF DE TODOS LOS ESTUDIANTES
function generarPDFTodosEstudiantes() {
    let contenidoPDF = `
        <html>
        <head>
            <title>Reporte Completo de Estudiantes - Federación Estudiantil</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
                .reporte { max-width: 1000px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 15px; }
                .header h1 { color: #333; margin-bottom: 5px; }
                .header h2 { color: #666; margin-top: 0; }
                .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
                .tabla { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10px; }
                .tabla th, .tabla td { border: 1px solid #000; padding: 6px; text-align: left; }
                .tabla th { background-color: #e9ecef; font-weight: bold; }
                .pagado { color: green; font-weight: bold; }
                .deuda { color: red; font-weight: bold; }
                .parcial { color: orange; font-weight: bold; }
                .resumen { margin-top: 30px; padding: 15px; border: 2px solid #000; border-radius: 10px; }
                .resumen-item { display: flex; justify-content: space-between; margin: 5px 0; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="reporte">
                <div class="header">
                    <h1>FEDERACIÓN ESTUDIANTIL</h1>
                    <h2>REPORTE COMPLETO DE ESTUDIANTES</h2>
                    <p>Fecha de emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                </div>
                
                <div class="info">
                    <h3>ESTADO DE PAGOS 2026-2027</h3>
                    <p>Este reporte incluye todos los estudiantes con su estado de pagos completo</p>
                </div>
                
                <table class="tabla">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Curso</th>
                            <th>Estudiante</th>
                            <th>Monto 2026</th>
                            <th>Pagado 2026</th>
                            <th>Estado 2026</th>
                            <th>Monto 2027</th>
                            <th>Pagado 2027</th>
                            <th>Estado 2027</th>
                            <th>Total Pagado</th>
                            <th>Deuda</th>
                            <th>Estado General</th>
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
    
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
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
                let estadoGeneralClase = 'pagado';
                let estadoGeneralTexto = 'AL DÍA';
                
                if (totalDeuda === (montoReq2026 + montoReq2027)) {
                    estadoGeneral = 'con-deuda';
                    estadoGeneralClase = 'deuda';
                    estadoGeneralTexto = 'CON DEUDA';
                    estudiantesConDeuda++;
                } else if (totalDeuda > 0) {
                    estadoGeneral = 'parcial';
                    estadoGeneralClase = 'parcial';
                    estadoGeneralTexto = 'PARCIAL';
                    estudiantesParcial++;
                } else {
                    estudiantesAlDia++;
                }
                
                contenidoPDF += `
                    <tr>
                        <td>${contador}</td>
                        <td><strong>${cursoNombre}</strong></td>
                        <td>${estudiante.nombre || `Estudiante ${index + 1}`}</td>
                        <td>Bs ${montoReq2026.toFixed(2)}</td>
                        <td class="${pagado2026 > 0 ? 'pagado' : 'deuda'}">Bs ${pagado2026.toFixed(2)}</td>
                        <td class="${estado2026}">${estado2026 === 'pagado' ? 'COMPLETO' : estado2026 === 'deuda' ? 'DEUDA' : 'PARCIAL'}</td>
                        <td>Bs ${montoReq2027.toFixed(2)}</td>
                        <td class="${pagado2027 > 0 ? 'pagado' : 'deuda'}">Bs ${pagado2027.toFixed(2)}</td>
                        <td class="${estado2027}">${estado2027 === 'pagado' ? 'COMPLETO' : estado2027 === 'deuda' ? 'DEUDA' : 'PARCIAL'}</td>
                        <td><strong>Bs ${totalPagado.toFixed(2)}</strong></td>
                        <td class="${totalDeuda > 0 ? 'deuda' : 'pagado'}"><strong>Bs ${totalDeuda.toFixed(2)}</strong></td>
                        <td class="${estadoGeneralClase}"><strong>${estadoGeneralTexto}</strong></td>
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
                    <h3>RESUMEN GENERAL</h3>
                    <div class="resumen-item">
                        <span>Total Estudiantes:</span>
                        <span><strong>${totalEstudiantes}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Estudiantes al Día:</span>
                        <span class="pagado"><strong>${estudiantesAlDia}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Estudiantes con Pagos Parciales:</span>
                        <span class="parcial"><strong>${estudiantesParcial}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Estudiantes con Deuda:</span>
                        <span class="deuda"><strong>${estudiantesConDeuda}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Total Pagado por Estudiantes:</span>
                        <span class="pagado"><strong>Bs ${totalPagadoGeneral.toFixed(2)}</strong></span>
                    </div>
                    <div class="resumen-item">
                        <span>Total Deudas Pendientes:</span>
                        <span class="deuda"><strong>Bs ${totalDeudaGeneral.toFixed(2)}</strong></span>
                    </div>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc;">
                    <button onclick="window.print()" style="padding: 12px 25px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">
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
        
        setTimeout(() => {
            ventanaPDF.focus();
        }, 500);
    }
}

// GENERAR REPORTE PDF DE CASILLEROS
function generarReporteCasillerosPDF() {
    let contenidoPDF = `
        <html>
        <head>
            <title>Reporte de Casilleros - Federación Estudiantil</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
                .reporte { max-width: 1000px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 15px; }
                .header h1 { color: #333; margin-bottom: 5px; }
                .header h2 { color: #666; margin-top: 0; }
                .resumen { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .resumen-item { display: flex; justify-content: space-between; margin: 5px 0; }
                .tabla { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10px; }
                .tabla th, .tabla td { border: 1px solid #000; padding: 6px; text-align: left; }
                .tabla th { background-color: #e9ecef; font-weight: bold; }
                .pagado { color: green; font-weight: bold; }
                .libre { color: #666; font-style: italic; }
                .sector { margin-top: 30px; padding: 15px; border: 1px solid #000; border-radius: 5px; }
                .sector h4 { margin-top: 0; }
                .calendario { display: inline-block; margin-right: 5px; width: 12px; height: 12px; border-radius: 2px; }
                .calendario.pagado { background: green; }
                .calendario.no-pagado { background: red; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="reporte">
                <div class="header">
                    <h1>FEDERACIÓN ESTUDIANTIL</h1>
                    <h2>REPORTE DE CASILLEROS 2026-2027</h2>
                    <p>Fecha de emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                </div>
                
                <div class="resumen">
                    <h3>RESUMEN GENERAL</h3>
    `;
    
    let totalPagado = 0;
    let casillerosOcupados = 0;
    let casillerosLibres = 0;
    let total2026 = 0;
    let total2027 = 0;
    
    // Calcular totales
    for (let i = 1; i <= 36; i++) {
        const casillero = datos.casilleros[i] || {
            numero: i,
            estudiante: '',
            pagos: [],
            historialMeses2026: [],
            historialMeses2027: [],
            totalPagado: 0
        };
        
        totalPagado += casillero.totalPagado || 0;
        
        if (casillero.estudiante && casillero.estudiante.trim() !== '') {
            casillerosOcupados++;
        } else {
            casillerosLibres++;
        }
        
        // Calcular por año
        if (casillero.pagos) {
            casillero.pagos.forEach(pago => {
                if (pago.anio === '2026') total2026 += pago.monto || 0;
                if (pago.anio === '2027') total2027 += pago.monto || 0;
            });
        }
    }
    
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
                </div>
                
                <div class="sector">
                    <h4>SECTOR A - Casilleros 1-18</h4>
                    <table class="tabla">
                        <thead>
                            <tr>
                                <th>Casillero</th>
                                <th>Estudiante</th>
                                <th>Total Pagado</th>
                                <th>Meses 2026</th>
                                <th>Meses 2027</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Sector A
    for (let i = 1; i <= 18; i++) {
        const casillero = datos.casilleros[i] || {
            numero: i,
            estudiante: '',
            pagos: [],
            historialMeses2026: [],
            historialMeses2027: [],
            totalPagado: 0
        };
        
        const meses2026 = casillero.historialMeses2026 || [];
        const meses2027 = casillero.historialMeses2027 || [];
        
        let calendario2026 = '';
        for (let m = 1; m <= 12; m++) {
            const pagado = meses2026.includes(m);
            calendario2026 += `<div class="calendario ${pagado ? 'pagado' : 'no-pagado'}" title="Mes ${m}"></div>`;
        }
        
        let calendario2027 = '';
        for (let m = 1; m <= 12; m++) {
            const pagado = meses2027.includes(m);
            calendario2027 += `<div class="calendario ${pagado ? 'pagado' : 'no-pagado'}" title="Mes ${m}"></div>`;
        }
        
        const estado = casillero.estudiante && casillero.estudiante.trim() !== '' ? 'OCUPADO' : 'LIBRE';
        const estadoClase = casillero.estudiante && casillero.estudiante.trim() !== '' ? 'pagado' : 'libre';
        
        contenidoPDF += `
            <tr>
                <td><strong>${i}</strong></td>
                <td>${casillero.estudiante || 'Sin asignar'}</td>
                <td>Bs ${casillero.totalPagado ? casillero.totalPagado.toFixed(2) : '0.00'}</td>
                <td>${calendario2026}</td>
                <td>${calendario2027}</td>
                <td class="${estadoClase}"><strong>${estado}</strong></td>
            </tr>
        `;
    }
    
    contenidoPDF += `
                        </tbody>
                    </table>
                </div>
                
                <div class="sector">
                    <h4>SECTOR B - Casilleros 19-36</h4>
                    <table class="tabla">
                        <thead>
                            <tr>
                                <th>Casillero</th>
                                <th>Estudiante</th>
                                <th>Total Pagado</th>
                                <th>Meses 2026</th>
                                <th>Meses 2027</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Sector B
    for (let i = 19; i <= 36; i++) {
        const casillero = datos.casilleros[i] || {
            numero: i,
            estudiante: '',
            pagos: [],
            historialMeses2026: [],
            historialMeses2027: [],
            totalPagado: 0
        };
        
        const meses2026 = casillero.historialMeses2026 || [];
        const meses2027 = casillero.historialMeses2027 || [];
        
        let calendario2026 = '';
        for (let m = 1; m <= 12; m++) {
            const pagado = meses2026.includes(m);
            calendario2026 += `<div class="calendario ${pagado ? 'pagado' : 'no-pagado'}" title="Mes ${m}"></div>`;
        }
        
        let calendario2027 = '';
        for (let m = 1; m <= 12; m++) {
            const pagado = meses2027.includes(m);
            calendario2027 += `<div class="calendario ${pagado ? 'pagado' : 'no-pagado'}" title="Mes ${m}"></div>`;
        }
        
        const estado = casillero.estudiante && casillero.estudiante.trim() !== '' ? 'OCUPADO' : 'LIBRE';
        const estadoClase = casillero.estudiante && casillero.estudiante.trim() !== '' ? 'pagado' : 'libre';
        
        contenidoPDF += `
            <tr>
                <td><strong>${i}</strong></td>
                <td>${casillero.estudiante || 'Sin asignar'}</td>
                <td>Bs ${casillero.totalPagado ? casillero.totalPagado.toFixed(2) : '0.00'}</td>
                <td>${calendario2026}</td>
                <td>${calendario2027}</td>
                <td class="${estadoClase}"><strong>${estado}</strong></td>
            </tr>
        `;
    }
    
    contenidoPDF += `
                        </tbody>
                    </table>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc;">
                    <button onclick="window.print()" style="padding: 12px 25px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">
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
        
        setTimeout(() => {
            ventanaPDF.focus();
        }, 500);
    }
}

// ACTUALIZAR TABLA DE APORTES
function actualizarTablaAportes() {
    const tbody = document.getElementById('tablaAportes');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const aportesAgrupados = {};
    
    datos.aportes.forEach(aporte => {
        const key = `${aporte.curso}-${aporte.fecha}-${aporte.anio || 'N/A'}`;
        if (!aportesAgrupados[key]) {
            aportesAgrupados[key] = {
                curso: aporte.curso,
                fecha: aporte.fecha,
                anio: aporte.anio || 'N/A',
                total: 0,
                estudiantes: 0,
                concepto: aporte.concepto
            };
        }
        aportesAgrupados[key].total += aporte.monto || 0;
        const match = (aporte.concepto || '').match(/\d+/);
        aportesAgrupados[key].estudiantes += match ? parseInt(match[0]) : 1;
    });
    
    Object.values(aportesAgrupados).forEach(aporte => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${aporte.curso}</td>
            <td>${aporte.anio}</td>
            <td>${aporte.estudiantes}</td>
            <td>Bs ${aporte.total.toFixed(2)}</td>
            <td>${aporte.fecha}</td>
            <td>
                ${isAdmin ? `
                <button class="btn btn-danger btn-sm" onclick="eliminarAporteGrupo('${aporte.curso}', '${aporte.fecha}', ${aporte.anio})">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// Función para eliminar grupo de aportes
function eliminarAporteGrupo(curso, fecha, anio) {
    if (!isAdmin) return;
    
    if (confirm('¿Está seguro de eliminar este grupo de aportes?')) {
        const aportesAEliminar = datos.aportes.filter(aporte => 
            aporte.curso === curso && 
            aporte.fecha === fecha && 
            (aporte.anio === anio || (!aporte.anio && anio === 'N/A'))
        );
        
        datos.aportes = datos.aportes.filter(aporte => 
            !(aporte.curso === curso && 
              aporte.fecha === fecha && 
              (aporte.anio === anio || (!aporte.anio && anio === 'N/A')))
        );
        
        guardarDatos();
        actualizarDashboard();
        actualizarTablaAportes();
        actualizarResumenAportesCursos();
        actualizarDetalleCajaFuerte();
        actualizarSeguimiento();
        mostrarMensaje('Aportes eliminados', 'success');
    }
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
            <td>${gasto.descripcion || 'Sin descripción'}</td>
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
        
        // Mostrar PDF (simplificado - en producción usar una librería completa)
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

// ACTUALIZAR TABLA DE MOVIMIENTOS DE CAJA
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
                <button class="btn btn-danger btn-sm" onclick="eliminarMovimientoCaja(${movimiento.id})">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// ACTUALIZAR TABLA DE OTROS COBROS
function actualizarTablaOtrosCobros() {
    const tbody = document.getElementById('tablaOtrosCobros');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    datos.otrosCobros.forEach(cobro => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${cobro.fecha || 'Sin fecha'}</td>
            <td>${cobro.curso || 'Sin curso'}</td>
            <td>${cobro.estudiante || 'Sin estudiante'}</td>
            <td>${cobro.concepto || 'Sin concepto'}</td>
            <td>Bs ${(cobro.monto || 0).toFixed(2)}</td>
            <td>${cobro.observaciones || 'Sin observaciones'}</td>
            <td>
                ${isAdmin ? `
                <button class="btn btn-danger btn-sm" onclick="eliminarOtroCobro(${cobro.id})">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// ACTUALIZAR ÚLTIMOS REGISTROS
function actualizarUltimosRegistros() {
    console.log('Actualizando últimos registros...');
    
    const tbodyAportes = document.getElementById('ultimosAportes');
    if (tbodyAportes) {
        tbodyAportes.innerHTML = '';
        const ultimosAportes = datos.aportes.slice(-5).reverse();
        
        ultimosAportes.forEach(aporte => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${aporte.curso || 'Sin curso'}</td>
                <td>${aporte.anio || 'N/A'}</td>
                <td>Bs ${(aporte.monto || 0).toFixed(2)}</td>
                <td>${aporte.fecha || 'Sin fecha'}</td>
            `;
            tbodyAportes.appendChild(fila);
        });
    }
    
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

// ACTUALIZAR RESUMEN DE APORTES POR CURSO
function actualizarResumenAportesCursos() {
    const tabla = document.getElementById('resumenAportesCursos');
    if (!tabla) return;
    
    tabla.innerHTML = '';
    
    let total2026 = 0;
    let total2027 = 0;
    let totalGeneral = 0;
    
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
        let aporte2026 = 0;
        let aporte2027 = 0;
        
        if (datosCurso.estudiantes) {
            datosCurso.estudiantes.forEach(estudiante => {
                if (estudiante.pagos) {
                    if (estudiante.pagos[2026] && estudiante.pagos[2026].pagado) aporte2026 += estudiante.pagos[2026].monto || 0;
                    if (estudiante.pagos[2027] && estudiante.pagos[2027].pagado) aporte2027 += estudiante.pagos[2027].monto || 0;
                }
            });
        }
        
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
    
    imagen.onclick = function() {
        document.body.removeChild(this);
    };
    
    document.body.appendChild(imagen);
}

// RESETEAR DATOS
function resetearDatos() {
    if (!isAdmin) return;
    
    if (confirm('¿Está seguro de que desea resetear todos los datos a 0? Esta acción no se puede deshacer.')) {
        const cursosEstructura = datos.cursos;
        
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
        actualizarTablaAportes();
        actualizarTablaGastos();
        actualizarTablaMovimientosCaja();
        actualizarUltimosRegistros();
        actualizarGraficos();
        actualizarReporteMensual();
        actualizarDetalleCajaFuerte();
        actualizarSeguimiento();
        actualizarVistaCasilleros();
        actualizarEventos();
        actualizarTablaOtrosCobros();
        
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
    
    let alertClass = 'alert-info';
    let color = '#00ffff';
    if (tipo === 'success') {
        alertClass = 'alert-success';
        color = '#00ff00';
    }
    if (tipo === 'error') {
        alertClass = 'alert-danger';
        color = '#ff4444';
    }
    if (tipo === 'info') {
        alertClass = 'alert-info';
        color = '#00ffff';
    }
    
    mensajeDiv.className = `alert ${alertClass}`;
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

// FUNCIONES PARA REPORTES
function mostrarInfoDineroInicial() {
    mostrarMensaje('El dinero inicial corresponde al primer ingreso registrado en la caja. Este valor se calcula automáticamente.', 'info');
}

// GENERAR REPORTE COMPLETO
// GENERAR REPORTE PDF COMPLETO FINANCIERO - CON TODOS LOS MOVIMIENTOS Y APORTES POR CURSO
function generarReporteCompleto() {
    // Calcular todos los totales
    let totalIngresos = datos.totalIngresosCaja || 0;
    let totalEgresos = datos.totalEgresosCaja || 0;
    let saldoCaja = datos.dineroFinal || 0;
    
    let totalAportesEstudiantes = 0;
    let totalCasilleros = 0;
    
    // Calcular aportes de estudiantes POR CURSO Y AÑO
    const aportesPorCurso = {};
    
    for (const [cursoNombre, datosCurso] of Object.entries(datos.cursos)) {
        if (datosCurso.estudiantes) {
            // Inicializar estructura para este curso
            if (!aportesPorCurso[cursoNombre]) {
                aportesPorCurso[cursoNombre] = {
                    '2026': { total: 0, estudiantes: 0 },
                    '2027': { total: 0, estudiantes: 0 },
                    totalGeneral: 0,
                    estudiantesTotales: datosCurso.estudiantes.length
                };
            }
            
            datosCurso.estudiantes.forEach(estudiante => {
                if (estudiante.pagos) {
                    // Aporte 2026
                    if (estudiante.pagos['2026'] && estudiante.pagos['2026'].pagado) {
                        const monto2026 = estudiante.pagos['2026'].monto || 0;
                        aportesPorCurso[cursoNombre]['2026'].total += monto2026;
                        aportesPorCurso[cursoNombre]['2026'].estudiantes++;
                        totalAportesEstudiantes += monto2026;
                        aportesPorCurso[cursoNombre].totalGeneral += monto2026;
                    }
                    
                    // Aporte 2027
                    if (estudiante.pagos['2027'] && estudiante.pagos['2027'].pagado) {
                        const monto2027 = estudiante.pagos['2027'].monto || 0;
                        aportesPorCurso[cursoNombre]['2027'].total += monto2027;
                        aportesPorCurso[cursoNombre]['2027'].estudiantes++;
                        totalAportesEstudiantes += monto2027;
                        aportesPorCurso[cursoNombre].totalGeneral += monto2027;
                    }
                }
            });
        }
    }
    
    // Calcular casilleros
    for (const casillero of Object.values(datos.casilleros)) {
        if (casillero && casillero.totalPagado) {
            totalCasilleros += casillero.totalPagado;
        }
    }
    
    // Organizar movimientos por fecha (más recientes primero)
    const movimientosOrdenados = [...datos.movimientosCaja].sort((a, b) => 
        new Date(b.fecha || 0) - new Date(a.fecha || 0)
    );
    
    // Organizar gastos por fecha (más recientes primero)
    const gastosOrdenados = [...datos.gastos].sort((a, b) => 
        new Date(b.fecha || 0) - new Date(a.fecha || 0)
    );
    
    let contenidoPDF = `
        <html>
        <head>
            <title>Reporte Financiero Completo - Federación Estudiantil</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
                .reporte { max-width: 1000px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 15px; }
                .header h1 { color: #333; margin-bottom: 5px; }
                .header h2 { color: #666; margin-top: 0; }
                .seccion { margin-top: 30px; padding: 15px; border: 1px solid #000; border-radius: 5px; }
                .seccion h3 { margin-top: 0; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                .resumen-item { display: flex; justify-content: space-between; margin: 5px 0; padding: 5px; }
                .resumen-item.total { background: #f8f9fa; font-weight: bold; border-top: 2px solid #000; }
                .ingreso { color: green; }
                .egreso { color: red; }
                .tabla { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9px; }
                .tabla th, .tabla td { border: 1px solid #000; padding: 4px; text-align: left; }
                .tabla th { background-color: #e9ecef; font-weight: bold; font-size: 8px; }
                .tabla-aportes { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9px; }
                .tabla-aportes th, .tabla-aportes td { border: 1px solid #000; padding: 4px; text-align: center; }
                .tabla-aportes th { background-color: #d4edda; font-weight: bold; }
                .caja-fuerte { background: #f0f8ff; padding: 15px; border-radius: 10px; border: 2px solid #007bff; }
                .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .col { width: 48%; }
                .estado-caja { text-align: center; padding: 20px; background: #28a745; color: white; border-radius: 10px; margin: 20px 0; }
                .estado-caja h2 { margin: 0; font-size: 2.5rem; }
                .subtotal { background: #f8f9fa; font-weight: bold; }
                .curso-header { background: #e9ecef; font-weight: bold; }
                .page-break { page-break-before: always; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="reporte">
                <div class="header">
                    <h1>FEDERACIÓN ESTUDIANTIL</h1>
                    <h2>REPORTE FINANCIERO COMPLETO - TODOS LOS MOVIMIENTOS</h2>
                    <p>Fecha de emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                    <p>Total de movimientos registrados: ${movimientosOrdenados.length} | Total de gastos: ${gastosOrdenados.length}</p>
                </div>
                
                <!-- ESTADO DE CAJA -->
                <div class="estado-caja">
                    <h2>SALDO ACTUAL EN CAJA</h2>
                    <h1>Bs ${saldoCaja.toFixed(2)}</h1>
                    <p>Disponible para operaciones</p>
                </div>
                
                <!-- APORTES POR CURSO Y AÑO -->
                <div class="seccion">
                    <h3>APORTES POR CURSO Y AÑO</h3>
                    <table class="tabla-aportes">
                        <thead>
                            <tr>
                                <th>Curso</th>
                                <th>Total Estudiantes</th>
                                <th colspan="3">AÑO 2026</th>
                                <th colspan="3">AÑO 2027</th>
                                <th>TOTAL CURSO</th>
                            </tr>
                            <tr>
                                <th></th>
                                <th></th>
                                <th>Est. Pagaron</th>
                                <th>Monto Req.</th>
                                <th>Recaudado</th>
                                <th>Est. Pagaron</th>
                                <th>Monto Req.</th>
                                <th>Recaudado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Mostrar aportes por curso
    let totalEstudiantesPagaron2026 = 0;
    let totalRecaudado2026 = 0;
    let totalMontoReq2026 = 0;
    let totalEstudiantesPagaron2027 = 0;
    let totalRecaudado2027 = 0;
    let totalMontoReq2027 = 0;
    let totalGeneralCursos = 0;
    
    // Ordenar cursos alfabéticamente
    const cursosOrdenados = Object.keys(aportesPorCurso).sort();
    
    if (cursosOrdenados.length === 0) {
        contenidoPDF += `
            <tr>
                <td colspan="9" style="text-align: center; padding: 20px;">
                    No hay aportes registrados por curso
                </td>
            </tr>
        `;
    } else {
        cursosOrdenados.forEach(cursoNombre => {
            const curso = aportesPorCurso[cursoNombre];
            const montoReq2026 = obtenerMontoCurso(cursoNombre, '2026');
            const montoReq2027 = obtenerMontoCurso(cursoNombre, '2027');
            
            const estudiantesPagaron2026 = curso['2026'].estudiantes;
            const recaudado2026 = curso['2026'].total;
            const estudiantesPagaron2027 = curso['2027'].estudiantes;
            const recaudado2027 = curso['2027'].total;
            
            totalEstudiantesPagaron2026 += estudiantesPagaron2026;
            totalRecaudado2026 += recaudado2026;
            totalMontoReq2026 += (montoReq2026 * curso.estudiantesTotales);
            
            totalEstudiantesPagaron2027 += estudiantesPagaron2027;
            totalRecaudado2027 += recaudado2027;
            totalMontoReq2027 += (montoReq2027 * curso.estudiantesTotales);
            
            totalGeneralCursos += curso.totalGeneral;
            
            contenidoPDF += `
                <tr>
                    <td><strong>${cursoNombre}</strong></td>
                    <td>${curso.estudiantesTotales}</td>
                    <td>${estudiantesPagaron2026}</td>
                    <td>Bs ${montoReq2026.toFixed(2)}</td>
                    <td class="ingreso">Bs ${recaudado2026.toFixed(2)}</td>
                    <td>${estudiantesPagaron2027}</td>
                    <td>Bs ${montoReq2027.toFixed(2)}</td>
                    <td class="ingreso">Bs ${recaudado2027.toFixed(2)}</td>
                    <td class="ingreso"><strong>Bs ${curso.totalGeneral.toFixed(2)}</strong></td>
                </tr>
            `;
        });
        
        // Totales de la sección de aportes por curso
        contenidoPDF += `
            <tr class="subtotal">
                <td colspan="2"><strong>TOTALES:</strong></td>
                <td><strong>${totalEstudiantesPagaron2026}</strong></td>
                <td><strong>Bs ${totalMontoReq2026.toFixed(2)}</strong></td>
                <td class="ingreso"><strong>Bs ${totalRecaudado2026.toFixed(2)}</strong></td>
                <td><strong>${totalEstudiantesPagaron2027}</strong></td>
                <td><strong>Bs ${totalMontoReq2027.toFixed(2)}</strong></td>
                <td class="ingreso"><strong>Bs ${totalRecaudado2027.toFixed(2)}</strong></td>
                <td class="ingreso"><strong>Bs ${totalGeneralCursos.toFixed(2)}</strong></td>
            </tr>
            <tr style="background: #f0f8ff;">
                <td colspan="9" style="padding: 10px;">
                    <strong>Resumen de Aportes:</strong> 
                    ${totalEstudiantesPagaron2026 + totalEstudiantesPagaron2027} estudiantes pagaron de ${Object.keys(aportesPorCurso).length} cursos.
                    Total recaudado en aportes: <strong class="ingreso">Bs ${totalGeneralCursos.toFixed(2)}</strong>
                </td>
            </tr>
        `;
    }
    
    contenidoPDF += `
                        </tbody>
                    </table>
                </div>
                
                <div class="row">
                    <div class="col">
                        <!-- RESUMEN DE INGRESOS -->
                        <div class="seccion">
                            <h3>INGRESOS TOTALES</h3>
                            <div class="resumen-item">
                                <span>Ingresos por Aportes Estudiantes:</span>
                                <span class="ingreso">Bs ${totalAportesEstudiantes.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Ingresos por Casilleros:</span>
                                <span class="ingreso">Bs ${totalCasilleros.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Otros Ingresos en Caja:</span>
                                <span class="ingreso">Bs ${(totalIngresos - totalAportesEstudiantes - totalCasilleros).toFixed(2)}</span>
                            </div>
                            <div class="resumen-item total">
                                <span><strong>TOTAL INGRESOS:</strong></span>
                                <span class="ingreso"><strong>Bs ${totalIngresos.toFixed(2)}</strong></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col">
                        <!-- RESUMEN DE EGRESOS -->
                        <div class="seccion">
                            <h3>EGRESOS TOTALES</h3>
                            <div class="resumen-item">
                                <span>Gastos Operativos:</span>
                                <span class="egreso">Bs ${datos.totalGastos.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Egresos de Caja:</span>
                                <span class="egreso">Bs ${totalEgresos.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item total">
                                <span><strong>TOTAL EGRESOS:</strong></span>
                                <span class="egreso"><strong>Bs ${(datos.totalGastos + totalEgresos).toFixed(2)}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- CAJA FUERTE DETALLADA -->
                <div class="seccion caja-fuerte">
                    <h3>DETALLE DE CAJA FUERTE</h3>
                    <div class="row">
                        <div class="col">
                            <h4>ORÍGENES DEL DINERO</h4>
                            <div class="resumen-item">
                                <span>Dinero Inicial:</span>
                                <span>Bs ${datos.dineroInicial.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Aportes Estudiantes:</span>
                                <span class="ingreso">Bs ${totalAportesEstudiantes.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Renta Casilleros:</span>
                                <span class="ingreso">Bs ${totalCasilleros.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Otros Ingresos:</span>
                                <span class="ingreso">Bs ${(totalIngresos - totalAportesEstudiantes - totalCasilleros).toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div class="col">
                            <h4>DESTINO DEL DINERO</h4>
                            <div class="resumen-item">
                                <span>Gastos Operativos:</span>
                                <span class="egreso">Bs ${datos.totalGastos.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Egresos Varios:</span>
                                <span class="egreso">Bs ${totalEgresos.toFixed(2)}</span>
                            </div>
                            <div class="resumen-item">
                                <span>Dinero Disponible:</span>
                                <span class="ingreso"><strong>Bs ${saldoCaja.toFixed(2)}</strong></span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- ECUACIÓN FINANCIERA -->
                    <div style="text-align: center; margin-top: 20px; padding: 15px; background: #fffacd; border-radius: 5px;">
                        <h4>ECUACIÓN FINANCIERA</h4>
                        <p>
                            <strong>Dinero Inicial (Bs ${datos.dineroInicial.toFixed(2)}) + 
                            Total Ingresos (Bs ${totalIngresos.toFixed(2)}) - 
                            Total Egresos (Bs ${(datos.totalGastos + totalEgresos).toFixed(2)}) = 
                            Saldo Final (Bs ${saldoCaja.toFixed(2)})</strong>
                        </p>
                    </div>
                </div>
                
                <!-- TABLA DE TODOS LOS MOVIMIENTOS DE CAJA -->
                <div class="seccion page-break">
                    <h3>TODOS LOS MOVIMIENTOS DE CAJA (${movimientosOrdenados.length} registros)</h3>
                    <div class="table-responsive">
                        <table class="tabla">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Concepto</th>
                                    <th>Monto (Bs)</th>
                                </tr>
                            </thead>
                            <tbody>
    `;
    
    // Mostrar TODOS los movimientos de caja
    let contadorMovimientos = 1;
    let subtotalIngresos = 0;
    let subtotalEgresos = 0;
    
    if (movimientosOrdenados.length === 0) {
        contenidoPDF += `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    No hay movimientos de caja registrados
                </td>
            </tr>
        `;
    } else {
        movimientosOrdenados.forEach(mov => {
            const tipo = mov.tipo === 'ingreso' ? 'INGRESO' : 'EGRESO';
            const clase = mov.tipo === 'ingreso' ? 'ingreso' : 'egreso';
            const monto = mov.monto || 0;
            
            if (mov.tipo === 'ingreso') subtotalIngresos += monto;
            if (mov.tipo === 'egreso') subtotalEgresos += monto;
            
            contenidoPDF += `
                <tr>
                    <td>${contadorMovimientos}</td>
                    <td>${mov.fecha || 'Sin fecha'}</td>
                    <td>${tipo}</td>
                    <td>${mov.concepto || 'Sin concepto'}</td>
                    <td class="${clase}">Bs ${monto.toFixed(2)}</td>
                </tr>
            `;
            contadorMovimientos++;
        });
        
        // Subtotal al final
        contenidoPDF += `
            <tr class="subtotal">
                <td colspan="4" style="text-align: right;"><strong>Subtotal Ingresos:</strong></td>
                <td class="ingreso"><strong>Bs ${subtotalIngresos.toFixed(2)}</strong></td>
            </tr>
            <tr class="subtotal">
                <td colspan="4" style="text-align: right;"><strong>Subtotal Egresos:</strong></td>
                <td class="egreso"><strong>Bs ${subtotalEgresos.toFixed(2)}</strong></td>
            </tr>
            <tr class="subtotal">
                <td colspan="4" style="text-align: right;"><strong>Total Neto Movimientos:</strong></td>
                <td class="${subtotalIngresos - subtotalEgresos >= 0 ? 'ingreso' : 'egreso'}">
                    <strong>Bs ${(subtotalIngresos - subtotalEgresos).toFixed(2)}</strong>
                </td>
            </tr>
        `;
    }
    
    contenidoPDF += `
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- TABLA DE TODOS LOS GASTOS -->
                <div class="seccion">
                    <h3>TODOS LOS GASTOS REGISTRADOS (${gastosOrdenados.length} registros)</h3>
                    <div class="table-responsive">
                        <table class="tabla">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Fecha</th>
                                    <th>Categoría</th>
                                    <th>Descripción</th>
                                    <th>Monto (Bs)</th>
                                    <th>Comprobante</th>
                                </tr>
                            </thead>
                            <tbody>
    `;
    
    // Mostrar TODOS los gastos
    let contadorGastos = 1;
    let subtotalGastos = 0;
    
    if (gastosOrdenados.length === 0) {
        contenidoPDF += `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    No hay gastos registrados
                </td>
            </tr>
        `;
    } else {
        gastosOrdenados.forEach(gasto => {
            const monto = gasto.monto || 0;
            subtotalGastos += monto;
            
            const descripcion = gasto.descripcion || 'Sin descripción';
            const descripcionCorta = descripcion.length > 50 ? descripcion.substring(0, 50) + '...' : descripcion;
            
            contenidoPDF += `
                <tr>
                    <td>${contadorGastos}</td>
                    <td>${gasto.fecha || 'Sin fecha'}</td>
                    <td>${gasto.categoria || 'Sin categoría'}</td>
                    <td title="${descripcion}">${descripcionCorta}</td>
                    <td class="egreso">Bs ${monto.toFixed(2)}</td>
                    <td>${gasto.comprobante ? 'SÍ' : 'NO'}</td>
                </tr>
            `;
            contadorGastos++;
        });
        
        // Subtotal de gastos
        contenidoPDF += `
            <tr class="subtotal">
                <td colspan="4" style="text-align: right;"><strong>Total Gastos:</strong></td>
                <td class="egreso" colspan="2"><strong>Bs ${subtotalGastos.toFixed(2)}</strong></td>
            </tr>
        `;
    }
    
    contenidoPDF += `
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- RESUMEN GENERAL -->
                <div class="seccion page-break">
                    <h3 style="color: #0056b3;">RESUMEN EJECUTIVO COMPLETO</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border: 1px solid #28a745;">
                            <h4 style="color: #28a745;">DINERO INICIAL</h4>
                            <h2>Bs ${datos.dineroInicial.toFixed(2)}</h2>
                            <small>Fondo inicial en caja</small>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border: 1px solid #17a2b8;">
                            <h4 style="color: #17a2b8;">TOTAL RECAUDADO</h4>
                            <h2>Bs ${totalIngresos.toFixed(2)}</h2>
                            <small>${movimientosOrdenados.length} movimientos</small>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border: 1px solid #dc3545;">
                            <h4 style="color: #dc3545;">TOTAL GASTADO</h4>
                            <h2>Bs ${(datos.totalGastos + totalEgresos).toFixed(2)}</h2>
                            <small>${gastosOrdenados.length} gastos</small>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; padding: 20px; background: #28a745; color: white; border-radius: 10px;">
                        <h2>SALDO FINAL DISPONIBLE</h2>
                        <h1 style="font-size: 3rem; margin: 10px 0;">Bs ${saldoCaja.toFixed(2)}</h1>
                        <p>Este es el dinero actualmente disponible en caja para la Federación Estudiantil</p>
                    </div>
                    
                    <!-- RESUMEN DETALLADO -->
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
                        <h4 style="color: #333;">DETALLE POR CONCEPTO:</h4>
                        <div class="row" style="display: flex; justify-content: space-between;">
                            <div style="width: 48%;">
                                <strong>Ingresos:</strong>
                                <ul style="margin: 5px 0; padding-left: 20px;">
                                    <li>Aportes Estudiantes: Bs ${totalAportesEstudiantes.toFixed(2)}</li>
                                    <li>Casilleros: Bs ${totalCasilleros.toFixed(2)}</li>
                                    <li>Otros: Bs ${(totalIngresos - totalAportesEstudiantes - totalCasilleros).toFixed(2)}</li>
                                </ul>
                            </div>
                            <div style="width: 48%;">
                                <strong>Egresos:</strong>
                                <ul style="margin: 5px 0; padding-left: 20px;">
                                    <li>Gastos Operativos: Bs ${datos.totalGastos.toFixed(2)}</li>
                                    <li>Egresos Caja: Bs ${totalEgresos.toFixed(2)}</li>
                                </ul>
                            </div>
                        </div>
                        
                        <!-- RESUMEN APORTES POR CURSO -->
                        <div style="margin-top: 15px; padding: 10px; background: #d4edda; border-radius: 5px;">
                            <h5 style="color: #155724; margin-bottom: 10px;">APORTES POR CURSO - RESUMEN</h5>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                                <div>
                                    <strong>Año 2026:</strong>
                                    <ul style="margin: 5px 0; padding-left: 20px;">
                                        <li>Estudiantes que pagaron: ${totalEstudiantesPagaron2026}</li>
                                        <li>Monto requerido total: Bs ${totalMontoReq2026.toFixed(2)}</li>
                                        <li>Recaudado: <strong class="ingreso">Bs ${totalRecaudado2026.toFixed(2)}</strong></li>
                                    </ul>
                                </div>
                                <div>
                                    <strong>Año 2027:</strong>
                                    <ul style="margin: 5px 0; padding-left: 20px;">
                                        <li>Estudiantes que pagaron: ${totalEstudiantesPagaron2027}</li>
                                        <li>Monto requerido total: Bs ${totalMontoReq2027.toFixed(2)}</li>
                                        <li>Recaudado: <strong class="ingreso">Bs ${totalRecaudado2027.toFixed(2)}</strong></li>
                                    </ul>
                                </div>
                            </div>
                            <div style="text-align: center; margin-top: 10px; padding: 10px; background: #c3e6cb; border-radius: 3px;">
                                <strong>TOTAL APORTES ESTUDIANTES: <span class="ingreso">Bs ${totalGeneralCursos.toFixed(2)}</span></strong>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc;">
                    <button onclick="window.print()" style="padding: 12px 25px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">
                        <i class="fas fa-print"></i> Imprimir Reporte Financiero Completo
                    </button>
                    <p style="margin-top: 10px; color: #666; font-size: 11px;">
                        <strong>Nota:</strong> Este reporte incluye TODA la información financiera de la Federación Estudiantil<br>
                        Total movimientos: ${movimientosOrdenados.length} | Total gastos: ${gastosOrdenados.length}<br>
                        Aportes de ${Object.keys(aportesPorCurso).length} cursos analizados<br>
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
        
        setTimeout(() => {
            ventanaPDF.focus();
        }, 500);
    }
}

// Función para probar sincronización
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

// Agregar botón de prueba en el navbar
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

// Llamar después de cargar
setTimeout(agregarBotonPrueba, 2000);

// Función para guardar datos automáticamente
setInterval(() => {
    if (isAdmin || isViewer) {
        guardarDatos();
        console.log('Datos guardados automáticamente');
    }
}, 30000);

console.log('Script cargado completamente con todas las mejoras');