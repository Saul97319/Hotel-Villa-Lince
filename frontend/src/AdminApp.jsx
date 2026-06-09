import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BedDouble, 
  DollarSign, 
  Calendar, 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  PieChart, 
  LogOut, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  FileText,
  ChevronRight,
  Info,
  Download,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';

// ==========================================
// CONFIGURACIÓN Y VALORES POR DEFECTO (MOCKS)
// ==========================================
const BACKEND_URL = 'http://localhost:5000';

const MOCK_OVERVIEW = {
  total_habitaciones: 45,
  ocupadas: 32,
  disponibles: 13,
  reservas_mes: 184,
  ingresos_mes: 245300,
  ocupacion_promedio: 71.1
};

const MOCK_RESERVAS_MES = [
  { mes: 'Jul', cantidad: 120 },
  { mes: 'Ago', cantidad: 145 },
  { mes: 'Sep', cantidad: 110 },
  { mes: 'Oct', cantidad: 135 },
  { mes: 'Nov', cantidad: 150 },
  { mes: 'Dic', cantidad: 195 },
  { mes: 'Ene', cantidad: 160 },
  { mes: 'Feb', cantidad: 140 },
  { mes: 'Mar', cantidad: 184 }
];

const MOCK_INGRESOS_MES = [
  { mes: 'Jul', ingresos: 162000 },
  { mes: 'Ago', ingresos: 195000 },
  { mes: 'Sep', ingresos: 148000 },
  { mes: 'Oct', ingresos: 181000 },
  { mes: 'Nov', ingresos: 201000 },
  { mes: 'Dic', ingresos: 261000 },
  { mes: 'Ene', ingresos: 214000 },
  { mes: 'Feb', ingresos: 187000 },
  { mes: 'Mar', ingresos: 245300 }
];

const MOCK_OCUPACION_HABITACIONES = [
  { tipo: 'Sencilla Ejecutiva', total: 15, ocupadas: 11, porcentaje: 73.3, precio: 1200 },
  { tipo: 'Doble Confort', total: 18, ocupadas: 14, porcentaje: 77.7, precio: 1800 },
  { tipo: 'Master Suite Lince', total: 12, ocupadas: 7, porcentaje: 58.3, precio: 3200 }
];

const MOCK_RECIENTES = [
  { id: 1, tipo: 'Reserva', detalle: 'Empresa Bimbo S.A. - 3 Habitaciones Dobles', fecha: 'Hoy, 14:22', monto: '$16,200', estado: 'Confirmado' },
  { id: 2, tipo: 'Check-In', detalle: 'Ing. Carlos Mendoza (Representante Ternium)', fecha: 'Hoy, 11:05', monto: 'N/A', estado: 'Completado' },
  { id: 3, tipo: 'Convenio', detalle: 'Nuevo convenio corporativo con Femsa', fecha: 'Ayer, 18:40', monto: 'Tarifa Fija (-15%)', estado: 'Activo' },
  { id: 4, tipo: 'Check-Out', detalle: 'Huéspedes Habitación 104 (Sencilla)', fecha: 'Ayer, 12:00', monto: '$3,600', estado: 'Completado' },
];

export default function AdminApp({ onLogout }) {
  // --- Estados de la Aplicación ---
  const [activeTab, setActiveTab] = useState('overview'); // overview, reservas, financiero, configuracion
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [hotelName] = useState('Hotel Villa Lince');
  
  // --- Estados de Datos ---
  const [overviewData, setOverviewData] = useState(MOCK_OVERVIEW);
  const [reservasMensuales, setReservasMensuales] = useState(MOCK_RESERVAS_MES);
  const [ingresosMensuales, setIngresosMensuales] = useState(MOCK_INGRESOS_MES);
  const [ocupacionHabitaciones, setOcupacionHabitaciones] = useState(MOCK_OCUPACION_HABITACIONES);
  const [filtroPeriodo, setFiltroPeriodo] = useState('Todos');
  const [lastSyncTime, setLastSyncTime] = useState(localStorage.getItem('admin_last_sync') || null);

  // --- Sistema de Notificaciones Toast ---
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // ==========================================
  // EFECTO PARA CARGAR DATOS AL INICIAR
  // ==========================================
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ==========================================
  // FUNCIÓN PRINCIPAL DE CONEXIÓN
  // ==========================================
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };

      const [overviewRes, reservasRes, ingresosRes, ocupacionRes] = await Promise.all([
        fetch(`${BACKEND_URL}/overview_admin`, { headers }),
        fetch(`${BACKEND_URL}/reservaciones_por_mes`, { headers }),
        fetch(`${BACKEND_URL}/ingresos_por_mes`, { headers }),
        fetch(`${BACKEND_URL}/ocupacion_habitaciones`, { headers })
      ]);

      // Si el servidor responde con un error de autenticación o similar
      if (!overviewRes.ok || !reservasRes.ok) {
        throw new Error("Server error");
      }

      const overviewRaw = await overviewRes.json();
      const reservasRaw = await reservasRes.json();
      const ingresosRaw = await ingresosRes.json();
      const ocupacionRaw = await ocupacionRes.json();

      const preciosBase = {
        'Individual': 900,
        'Doble': 1200,
        'Matrimonial': 1400,
        'Ejecutiva': 1800,
        'Suite': 2800,
        'Familiar': 3500
      };

      // Mapeo y traducción de datos reales
      const overview = {
        total_habitaciones: overviewRaw.total_habitaciones || 0,
        ocupadas: overviewRaw.ocupadas_hoy || 0,
        disponibles: overviewRaw.disponibles_hoy || 0,
        reservas_mes: overviewRaw.reservas_mes || 0,
        ingresos_mes: overviewRaw.ingresos_mes || 0,
        ocupacion_promedio: overviewRaw.ocupacion_promedio || 0
      };

      const reservas = (reservasRaw.data || []).map(r => ({ mes: r.month, cantidad: r.count }));
      const ingresos = (ingresosRaw.data || []).map(i => ({ mes: i.month, ingresos: i.revenue }));
      const ocupacion = (ocupacionRaw.data || []).map(o => ({
        tipo: o.tipo, total: o.total, ocupadas: o.ocupadas, porcentaje: o.porcentaje,
        precio: preciosBase[o.tipo] || 1000
      }));

      // ========================================================
      // NUEVO: GUARDAR COPIA LOCAL (DESCARGA AUTOMÁTICA)
      // ========================================================
      const now = new Date();
      const horaFormateada = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const fechaFormateada = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
      const stringSincronizacion = `${fechaFormateada} a las ${horaFormateada}`;

      localStorage.setItem('local_overview', JSON.stringify(overview));
      localStorage.setItem('local_reservas', JSON.stringify(reservas));
      localStorage.setItem('local_ingresos', JSON.stringify(ingresos));
      localStorage.setItem('local_ocupacion', JSON.stringify(ocupacion));
      localStorage.setItem('admin_last_sync', stringSincronizacion);

      // Asignar al estado de la aplicación
      setOverviewData(overview);
      setReservasMensuales(reservas);
      setIngresosMensuales(ingresos);
      setOcupacionHabitaciones(ocupacion);
      setLastSyncTime(stringSincronizacion);
      
      setIsDemoMode(false);
      addToast("Datos sincronizados y respaldados localmente.", "success");

    } catch (error) {
      console.error("Modo Offline Activado:", error);
      setIsDemoMode(true);

      // ========================================================
      // NUEVO: INTENTAR CARGAR RESPALDO LOCAL DETECTADO
      // ========================================================
      const localOverview = localStorage.getItem('local_overview');
      const localReservas = localStorage.getItem('local_reservas');
      const localIngresos = localStorage.getItem('local_ingresos');
      const localOcupacion = localStorage.getItem('local_ocupacion');
      const savedSyncTime = localStorage.getItem('admin_last_sync');

      if (localOverview && localReservas && localIngresos && localOcupacion) {
        setOverviewData(JSON.parse(localOverview));
        setReservasMensuales(JSON.parse(localReservas));
        setIngresosMensuales(JSON.parse(localIngresos));
        setOcupacionHabitaciones(JSON.parse(localOcupacion));
        setLastSyncTime(savedSyncTime);
        addToast("Sin conexión. Mostrando último respaldo local.", "warning");
      } else {
        // Si nunca se ha sincronizado nada, usamos los Mocks como plan C
        setOverviewData(MOCK_OVERVIEW);
        setReservasMensuales(MOCK_RESERVAS_MES);
        setIngresosMensuales(MOCK_INGRESOS_MES);
        setOcupacionHabitaciones(MOCK_OCUPACION_HABITACIONES);
        setLastSyncTime(null);
        addToast("Sin conexión y sin respaldos. Usando datos simulados.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* CONTENEDOR DE TOASTS */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`p-4 rounded-xl shadow-lg border backdrop-blur-md flex items-start gap-3 transition-all duration-300 transform translate-x-0 animate-bounce-short ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800' 
                : toast.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-800'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />}
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* ==========================================
          SIDEBAR LATERAL (DISEÑO PREMIUM OSCURO)
          ========================================== */}
      <aside className="w-full md:w-64 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-slate-100 flex flex-col justify-between border-r border-indigo-900/40 shadow-2xl relative shrink-0">
        {/* Glow Decorativo */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-500"></div>
        
        <div>
          {/* Header del Sidebar */}
          <div className="p-6 flex items-center gap-3 border-b border-indigo-900/30">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-tight tracking-wide">{hotelName}</h1>
              <span className="text-xs text-indigo-300 font-medium tracking-wider uppercase flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Admin Panel
              </span>
            </div>
          </div>

          {/* Información del Usuario Activo */}
          <div className="px-6 py-4 border-b border-indigo-900/10 bg-indigo-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-sm border-2 border-indigo-400/30">
                AD
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Administrador</p>
                <p className="text-xs text-slate-400 truncate">admin@villalince.com</p>
              </div>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-1.5">
            <span className="px-3 text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">
              Navegación
            </span>
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/10 font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 shrink-0" />
                <span className="text-sm">Resumen General</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'overview' ? 'rotate-90 text-white' : 'text-slate-600 group-hover:text-slate-400'}`} />
            </button>

            <button
              onClick={() => setActiveTab('reservas')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === 'reservas'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/10 font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 shrink-0" />
                <span className="text-sm">Reporte de Reservas</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'reservas' ? 'rotate-90 text-white' : 'text-slate-600 group-hover:text-slate-400'}`} />
            </button>

            <button
              onClick={() => setActiveTab('financiero')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === 'financiero'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/10 font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 shrink-0" />
                <span className="text-sm">Reporte Financiero</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'financiero' ? 'rotate-90 text-white' : 'text-slate-600 group-hover:text-slate-400'}`} />
            </button>

            <button
              onClick={() => setActiveTab('configuracion')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === 'configuracion'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/10 font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 shrink-0" />
                <span className="text-sm">Parámetros del Sistema</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'configuracion' ? 'rotate-90 text-white' : 'text-slate-600 group-hover:text-slate-400'}`} />
            </button>
          </nav>
        </div>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-indigo-950 bg-indigo-950/30 flex flex-col gap-3">
          
          {/* Indicador de Estado de Conexión */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-indigo-900/20 shadow-inner">
            <span className="text-[10px] text-slate-400 font-medium">Servidor Backend:</span>
            <span className={`font-black flex items-center gap-1 text-[11px] ${isDemoMode ? 'text-rose-500' : 'text-emerald-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isDemoMode ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`}></span>
              {isDemoMode ? 'Desconectado' : 'Conectado'}
            </span>
          </div>

          {/* Botón PREMIUM de Cerrar Sesión con Hover Dinámico Rojo */}
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white/5 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 rounded-xl transition-all duration-300 border border-white/5 hover:border-rose-500/20 text-xs font-bold shadow-sm"
          >
            <LogOut size={16} className="transition-transform group-hover:translate-x-0.5" />
            <span>Cerrar Sesión</span>
          </button>              
        </div>
      </aside>

      {/* ==========================================
          ÁREA PRINCIPAL (CONTENIDO GENERAL)
          ========================================== */}
      <main className="flex-1 flex flex-col overflow-y-auto max-h-screen">
        
        {/* TOPBAR SUPERIOR (CONTROL Y REFRESCO) */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Taller de Fortalecimiento I</span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-md font-bold">UVM</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
              Panel de Control Operativo
              {isDemoMode && <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Control de Periodo */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              {['Mes Actual', 'Trimestre', 'Todos'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFiltroPeriodo(p)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                    filtroPeriodo === p 
                      ? 'bg-white text-indigo-600 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Botón de Refresco manual */}
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all duration-150 shadow-xs disabled:opacity-50 flex items-center gap-2"
              title="Sincronizar base de datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline text-xs font-semibold">Sincronizar</span>
            </button>
          </div>
        </header>

        {/* Banner de Estado Resiliente / Offline */}
          {isDemoMode && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-pulse">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-800">Modo de Resiliencia Local Activo</h4>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Se ha perdido la conexión con el servidor de backend. Para garantizar la continuidad de tus operaciones, 
                  estás visualizando los datos del último respaldo guardado automáticamente el{' '}
                  <span className="font-bold underline">{lastSyncTime || 'Modo Demo (Sin respaldos todavía)'}</span>.
                </p>
              </div>
            </div>
          )}

        {/* ==========================================
            PANTALLA DE CARGA (LOADING SCREEN)
            ========================================== */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="relative flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
              <Building2 className="w-6 h-6 text-indigo-500 absolute" />
            </div>
            <p className="text-slate-600 font-bold tracking-wide animate-pulse">Cargando base de datos y KPIs...</p>
            <p className="text-xs text-slate-400 mt-1">Conectando con el servidor de Adrián & Laura</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">

            {/* =======================================================
                TAB 1: OVERVIEW GENERAL (RESUMEN OPERATIVO)
                ======================================================= */}
            {activeTab === 'overview' && (
              <>
                {/* TARJETAS KPI */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* KPI 1: OCUPACIÓN PROMEDIO */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-full pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ocupación Actual</span>
                      <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform duration-200">
                        <BedDouble className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                          {((overviewData.ocupadas / overviewData.total_habitaciones) * 100).toFixed(1)}%
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                          {overviewData.ocupadas} de {overviewData.total_habitaciones} Habs. Ocupadas
                        </p>
                      </div>
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                        Habitaciones
                      </span>
                    </div>
                    {/* Barra de progreso visual */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${(overviewData.ocupadas / overviewData.total_habitaciones) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* KPI 2: RESERVAS DEL MES */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reservas del Mes</span>
                      <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform duration-200">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                          {overviewData.reservas_mes}
                        </h3>
                        <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +12.4% vs mes anterior
                        </p>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                        Volumen
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  {/* KPI 3: INGRESOS DEL MES */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingresos Facturados</span>
                      <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform duration-200">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                          ${overviewData.ingresos_mes.toLocaleString()}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                          Meta mensual: $220,000 MXN
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        Cumplido
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  {/* KPI 4: DISPONIBILIDAD INMEDIATA */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Habs. Disponibles</span>
                      <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform duration-200">
                        <Layers className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                          {overviewData.disponibles}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                          Listas para asignar hoy
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                        Disponibles
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full" 
                        style={{ width: `${(overviewData.disponibles / overviewData.total_habitaciones) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                </section>

                {/* DASHBOARD GRÁFICO (REPORTE DE OCUPACIÓN Y FINANZAS) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* GRÁFICO HISTÓRICO DE RESERVACIONES (DIBUJADO CON SVG) */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 lg:col-span-2 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">Histórico de Ocupación de Habitaciones</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Volumen mensual registrado en los últimos periodos</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-xs bg-indigo-600"></span>
                        <span className="text-xs text-slate-500 font-medium">Reservaciones</span>
                      </div>
                    </div>

                    {/* Contenedor Gráfico Custom (SVG) */}
                    <div className="relative w-full h-64 bg-slate-50/50 rounded-xl border border-slate-100 p-4">
                      <div className="absolute inset-x-4 top-10 bottom-12 flex flex-col justify-between pointer-events-none">
                        {[200, 150, 100, 50, 0].map((val) => (
                          <div key={val} className="w-full flex items-center justify-between border-t border-slate-200/50">
                            <span className="text-[10px] text-slate-400 font-bold bg-white pr-2 -mt-2">{val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Render de Barras */}
                      <div className="absolute inset-x-8 bottom-12 top-6 flex justify-between items-end gap-3 z-10">
                        {reservasMensuales.map((item, index) => {
                          const maxReservas = 200;
                          const barHeight = `${(item.cantidad / maxReservas) * 100}%`;
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                              <div className="w-full bg-slate-100 rounded-t-lg group-hover:bg-indigo-50 transition-colors duration-200 flex flex-col justify-end h-full">
                                <div 
                                  className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-md hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 relative"
                                  style={{ height: barHeight }}
                                >
                                  {/* Tooltip Hover */}
                                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-25 font-bold shadow-lg">
                                    {item.cantidad} Reservas
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold mt-2 tracking-tight">{item.mes}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* OCUPACIÓN POR TIPO DE HABITACIÓN (HU 4.2 - Decisiones Operativas) */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-bold text-slate-900">Capacidad por Categoría</h4>
                        <span className="p-1.5 bg-slate-100 text-slate-500 rounded-lg">
                          <PieChart className="w-4 h-4" />
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-6">Información por tipo de habitación para distribución de tarifas.</p>

                      <div className="space-y-5">
                        {ocupacionHabitaciones.map((habitacion, index) => {
                          // Colores basados en el índice
                          const colors = [
                            { text: 'text-indigo-600', bg: 'bg-indigo-600', lightBg: 'bg-indigo-50' },
                            { text: 'text-purple-600', bg: 'bg-purple-600', lightBg: 'bg-purple-50' },
                            { text: 'text-amber-600', bg: 'bg-amber-600', lightBg: 'bg-amber-50' }
                          ];
                          const color = colors[index % colors.length];

                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800">{habitacion.tipo}</span>
                                <span className="font-mono text-slate-500">
                                  {habitacion.ocupadas}/{habitacion.total} Habs. Ocupadas
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                                <div 
                                  className={`${color.bg} h-full rounded-full`} 
                                  style={{ width: `${habitacion.porcentaje}%` }}
                                ></div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>Porcentaje: <strong className={color.text}>{habitacion.porcentaje}%</strong></span>
                                <span>Precio Sugerido: <strong className="text-slate-700">${habitacion.precio.toLocaleString()}/Noche</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <div className="bg-indigo-500/5 rounded-xl p-3 border border-indigo-500/10 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-indigo-800 leading-normal font-medium">
                          <strong>Sugerencia de Administración:</strong> La Master Suite registra ocupación de 58.3%. Se sugiere aplicar la tarifa corporativa con convenios vigentes.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ÚLTIMAS ACCIONES REGISTRADAS Y ESTADO DEL SPRINT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* ACTIVIDADES RECIENTES EN EL SISTEMA */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 lg:col-span-2 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">Actividades de la Plataforma</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Transacciones, convenios corporativos y arribos registrados</p>
                      </div>
                      <button 
                        onClick={() => addToast('Descargando reporte de auditoría...', 'info')}
                        className="text-xs text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Exportar logs
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {MOCK_RECIENTES.map((acc) => (
                        <div key={acc.id} className="py-4 flex items-center justify-between gap-4 first:pt-2 last:pb-2">
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              acc.tipo === 'Reserva' 
                                ? 'bg-indigo-500' 
                                : acc.tipo === 'Check-In' 
                                ? 'bg-purple-500' 
                                : acc.tipo === 'Convenio'
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`} title={acc.tipo}></span>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{acc.detalle}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{acc.fecha} &bull; Rol de {acc.tipo}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-800">{acc.monto}</p>
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 ${
                              acc.estado === 'Confirmado' || acc.estado === 'Activo'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-slate-50 text-slate-600 border border-slate-100'
                            }`}>
                              {acc.estado}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PARTICIPANTES DEL PROYECTO (DISEÑO Y PLANEACIÓN) */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 mb-1">Equipo de Desarrollo UVM</h4>
                      <p className="text-xs text-slate-400 mb-4">Roles de diseño y responsabilidades asignadas</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">SM</span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Adrián Allard</p>
                              <p className="text-[10px] text-slate-400">Scrum Master / Base de Datos</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Core</span>
                        </div>

                        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-xs font-bold text-purple-600">FE</span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Diego Silva</p>
                              <p className="text-[10px] text-slate-400">Front-End Developer</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">UI/UX</span>
                        </div>

                        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-600">BE</span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Laura Moya</p>
                              <p className="text-[10px] text-slate-400">Back-End / Seguridad</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">API</span>
                        </div>

                        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-600">QA</span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Bruno Spiritu</p>
                              <p className="text-[10px] text-slate-400">QA / Tester Ágil</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Pruebas</span>
                        </div>

                        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-xs font-bold text-pink-600">DO</span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Alyn Nila</p>
                              <p className="text-[10px] text-slate-400">Documentación y Requisitos</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Doc</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Docente: Georgina Mondragón</span>
                      <span>15 Semanas de Sprints</span>
                    </div>
                  </div>

                </div>
              </>
            )}

            {/* =======================================================
                TAB 2: REPORTE DE RESERVAS (HU 4.2 DETALLADO)
                ======================================================= */}
            {activeTab === 'reservas' && (
              <div className="space-y-6">
                
                {/* Cabecera del Reporte */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Reporte del Historial de Reservas</h3>
                    <p className="text-xs text-slate-400 mt-1">Monitoreo de huéspedes corporativos y reservas vigentes en Villa Lince</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => addToast('Filtrando reservaciones...', 'info')}
                      className="px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs text-slate-600 font-bold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Filter className="w-4 h-4" /> Filtros Avanzados
                    </button>
                    <button 
                      onClick={() => addToast('Descargando reporte PDF...', 'success')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs text-white font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" /> Descargar PDF
                    </button>
                  </div>
                </div>

                {/* Grid con Estado Detallado */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Tarjeta Informativa de Reservas */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 lg:col-span-1 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Fórmula de Ocupación</h4>
                    
                    <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">RESERVAS TOTALES DEL MES</span>
                        <p className="text-lg font-extrabold text-slate-800">{overviewData.reservas_mes} Reservas</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">OCUPACIÓN DE HABITACIONES</span>
                        <p className="text-lg font-extrabold text-indigo-600">
                          {((overviewData.ocupadas / overviewData.total_habitaciones) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700">Estado de Reservas Activas</p>
                      <div className="flex items-center justify-between text-xs p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                        <span>Check-In Completado</span>
                        <strong className="font-mono">24</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 bg-amber-50 text-amber-800 rounded-lg">
                        <span>Llegadas Tardías Esperadas</span>
                        <strong className="font-mono">5</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 bg-slate-50 text-slate-600 rounded-lg">
                        <span>Bloqueo Mantenimiento</span>
                        <strong className="font-mono">3</strong>
                      </div>
                    </div>
                  </div>

                  {/* Tabla con Simulación de Reservas de Huéspedes Corporativos */}
                  <div className="bg-white rounded-2xl border border-slate-200 lg:col-span-3 overflow-hidden shadow-xs">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Listado de Huéspedes Activos</h4>
                      <span className="text-xs font-bold text-indigo-600">Convenios Corporativos</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
                            <th className="px-6 py-3.5">Huésped / Representante</th>
                            <th className="px-6 py-3.5">Empresa</th>
                            <th className="px-6 py-3.5">Habitación</th>
                            <th className="px-6 py-3.5">Estadía</th>
                            <th className="px-6 py-3.5">Estado</th>
                            <th className="px-6 py-3.5 text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          <tr>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">Carlos Mendoza</p>
                              <p className="text-[10px] text-slate-400">carlos.mendoza@ternium.com</p>
                            </td>
                            <td className="px-6 py-4">Ternium Monterrey</td>
                            <td className="px-6 py-4">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold">104 - Ejecutiva</span>
                            </td>
                            <td className="px-6 py-4">3 Noches</td>
                            <td className="px-6 py-4">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">Check-In</span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold">$3,600</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">Ana Gabriela Rocha</p>
                              <p className="text-[10px] text-slate-400">ana.rocha@femsa.com</p>
                            </td>
                            <td className="px-6 py-4">FEMSA Servicios</td>
                            <td className="px-6 py-4">
                              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded font-bold">203 - Suite</span>
                            </td>
                            <td className="px-6 py-4">5 Noches</td>
                            <td className="px-6 py-4">
                              <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold">Llegada Tardía</span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold">$16,000</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">Jorge Luis Arredondo</p>
                              <p className="text-[10px] text-slate-400">jorge.arredondo@bimbo.com</p>
                            </td>
                            <td className="px-6 py-4">Grupo Bimbo</td>
                            <td className="px-6 py-4">
                              <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-bold">108 - Doble</span>
                            </td>
                            <td className="px-6 py-4">2 Noches</td>
                            <td className="px-6 py-4">
                              <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Reservada</span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold">$3,600</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* =======================================================
                TAB 3: REPORTE FINANCIERO (HU 4.2 DETALLADO)
                ======================================================= */}
            {activeTab === 'financiero' && (
              <div className="space-y-6">
                
                {/* Tarjetas de Resumen Financiero */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ingreso Promedio por Habitación</span>
                      <h4 className="text-xl font-extrabold text-slate-900 mt-1">$1,850.00 MXN</h4>
                      <p className="text-xs text-slate-400 mt-1">Durante el presente mes de operaciones</p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Facturación Corporativa</span>
                      <h4 className="text-xl font-extrabold text-slate-900 mt-1">82% del total</h4>
                      <p className="text-xs text-emerald-600 font-semibold mt-1">Representa el core del Hotel Villa Lince</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Convenios Pendientes de Cobro</span>
                      <h4 className="text-xl font-extrabold text-amber-700 mt-1">2 Convenios</h4>
                      <p className="text-xs text-slate-400 mt-1">En periodo de gracia de 15 días hábiles</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                      <FileText className="w-6 h-6" />
                    </div>
                  </div>

                </div>

                {/* Gráfico de Ingresos Mensuales */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Historial de Ingresos Mensuales</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Total facturado en pesos mexicanos (MXN)</p>
                    </div>
                    <button 
                      onClick={() => addToast('Generando reporte financiero extendido...', 'info')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                    >
                      Generar Reporte Completo
                    </button>
                  </div>

                  {/* Renderizado de ingresos con gráfico SVG */}
                  <div className="relative w-full h-64 bg-slate-50/50 rounded-xl border border-slate-100 p-4">
                    <div className="absolute inset-x-4 top-10 bottom-12 flex flex-col justify-between pointer-events-none">
                      {['$300k', '$225k', '$150k', '$75k', '$0'].map((val) => (
                        <div key={val} className="w-full flex items-center justify-between border-t border-slate-200/50">
                          <span className="text-[10px] text-slate-400 font-bold bg-white pr-2 -mt-2">{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Barras de ingresos */}
                    <div className="absolute inset-x-8 bottom-12 top-6 flex justify-between items-end gap-3 z-10">
                      {ingresosMensuales.map((item, index) => {
                        const maxIngresos = 300000;
                        const barHeight = `${(item.ingresos / maxIngresos) * 100}%`;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                            <div className="w-full bg-slate-100 rounded-t-lg group-hover:bg-emerald-50 transition-colors duration-200 flex flex-col justify-end h-full">
                              <div 
                                className="w-full bg-gradient-to-t from-emerald-500 to-teal-500 rounded-t-md hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 relative"
                                style={{ height: barHeight }}
                              >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-25 font-bold shadow-lg">
                                  ${item.ingresos.toLocaleString()} MXN
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold mt-2 tracking-tight">{item.mes}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* =======================================================
                TAB 4: CONFIGURACIÓN / PARÁMETROS DEL SISTEMA
                ======================================================= */}
            {activeTab === 'configuracion' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-4xl shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Parámetros Críticos y Seguridad</h3>
                  <p className="text-xs text-slate-400 mt-1">Configuración del Hotel Villa Lince y seguridad de la base de datos de Adrián y Laura</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Reglas de Negocio */}
                  <div className="space-y-4 border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-indigo-600" /> Reglas de Negocio
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span>Llegada Tardía (tolerancia):</span>
                        <select className="bg-white border border-slate-200 rounded p-1 font-semibold text-slate-700">
                          <option>2 Horas (Por Defecto)</option>
                          <option>3 Horas</option>
                          <option>Sin Límite</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span>Pago Mínimo Confirmación:</span>
                        <input type="text" className="bg-white border border-slate-200 rounded p-1 text-right w-24 font-bold text-slate-700" defaultValue="1 Noche" />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span>Descuento Corporativo Base:</span>
                        <input type="text" className="bg-white border border-slate-200 rounded p-1 text-right w-24 font-bold text-slate-700" defaultValue="15%" />
                      </div>
                    </div>
                  </div>

                  {/* Estado de Seguridad API backend */}
                  <div className="space-y-4 border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-600" /> Seguridad Informática
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Cifrado de Credenciales:</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> SHA-256 Activo
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Protección Inyección SQL:</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Sanitizado (Flask-SQLAlchemy)
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Control de Sesiones:</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> JWT Tokens Habilitado
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    onClick={() => addToast('Configuraciones guardadas localmente.', 'success')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    Guardar Cambios
                  </button>
                </div>

              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}