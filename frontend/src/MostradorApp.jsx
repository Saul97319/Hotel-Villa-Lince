import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, CalendarCheck, LogOut, PhoneCall, 
  BedDouble, Wrench, Sparkles, User, X, CheckCircle2, AlertTriangle, Key,
  Calendar, Building, Users, FileText, Mail
} from 'lucide-react';
import CheckInWizard from './components/CheckIn/CheckInWizard';

const STATUS_CONFIG = {
  disponible: { color: 'bg-emerald-400', hover: 'hover:bg-emerald-500', icon: CheckCircle2, label: 'Disponible' },
  reservada: { color: 'bg-fuchsia-400', hover: 'hover:bg-fuchsia-500', icon: CalendarCheck, label: 'Reservada' },
  sucia: { color: 'bg-amber-400', hover: 'hover:bg-amber-500', icon: Sparkles, label: 'Sucia' },
  mantenimiento: { color: 'bg-rose-500', hover: 'hover:bg-rose-600', icon: Wrench, label: 'Mantenimiento' },
  ocupada: { color: 'bg-indigo-400', hover: 'hover:bg-indigo-500', icon: BedDouble, label: 'Ocupada' }
};

const CAPACIDADES = {
  'Individual': 1,
  'Doble': 2,
  'Matrimonial': 2,
  'Ejecutiva': 2, 
  'Suite': 4,
  'Familiar': 6
};

export default function MostradorApp({ onLogout }) {
  // 1️⃣ PRIMERO: Todas las declaraciones de estados van aquí arriba
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convenios, setConvenios] = useState([]); 
  const [wizardInitialData, setWizardInitialData] = useState({});

  const [formData, setFormData] = useState({
    nombre: '',
    personas: 1,
    fechaEntrada: new Date().toISOString().split('T')[0],
    fechaSalida: '',
    fechaNacimiento: '',
    telefono: '',
    email: '',
    habitacion_id: '',
    empresa: '',
    cargo: '', 
    convenio_id: '',
    rfc: ''    
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    const obtenerDatosMostrador = async () => {
      try {
        const [roomsRes, convRes] = await Promise.all([
          fetch('http://localhost:5000/api/habitaciones'),
          fetch('http://localhost:5000/api/convenios')
        ]);
        if (roomsRes.ok) setRooms(await roomsRes.json());
        if (convRes.ok) setConvenios(await convRes.json()); 
      } catch (err) {
        setError('Error de comunicación con el servidor de datos.');
        console.error(err);
      } finally {
        setLoading(false); 
      }
    };
    obtenerDatosMostrador();
  }, []);

  // --- FILTRADO REACTIVO ---
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms;
    const query = searchQuery.toLowerCase();
    return rooms.filter(room => 
      room.id.toString().includes(query) || 
      (room.guest && room.guest.toLowerCase().includes(query)) ||
      (room.folio && room.folio.toString().toLowerCase().includes(query))
    );
  }, [rooms, searchQuery]);

  // --- AGRUPADO DE HABITACIONES CORREGIDO ---
  const groupedRooms = useMemo(() => {
    const groups = filteredRooms.reduce((acc, room) => {
      const type = room.type || 'Sin Categoría';
      if (!acc[type]) acc[type] = [];
      acc[type].push(room);
      return acc;
    }, {});

    const orderOfTypes = ['Individual', 'Doble', 'Matrimonial', 'Ejecutiva', 'Familiar', 'Suite'];
    
    const sortedKeys = Object.keys(groups).sort((a, b) => {
       const indexA = orderOfTypes.indexOf(a);
       const indexB = orderOfTypes.indexOf(b);
       return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    return sortedKeys.map(key => ({
        tipo: key,
        habitaciones: groups[key]
    }));
  }, [filteredRooms]);

  // --- LÓGICA DE VALIDACIÓN EN TIEMPO REAL (EXTRAÍDA CORRECTAMENTE) ---
  const selectedRoomData = useMemo(() => {
    return rooms.find(r => r.id.toString() === formData.habitacion_id.toString());
  }, [rooms, formData.habitacion_id]);

  const maxCapacity = selectedRoomData ? CAPACIDADES[selectedRoomData.type] : 99;
  const isOverCapacity = formData.personas > maxCapacity;
  const isEjecutiva = selectedRoomData?.type === 'Ejecutiva';

  const calculateAge = (dob) => {
    if(!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };
  const age = calculateAge(formData.fechaNacimiento);
  const isUnderage = age !== null && age < 18;

  // Calculadora automática de días de estadía
  const diasEstadia = useMemo(() => {
    if(!formData.fechaEntrada || !formData.fechaSalida) return 0;
    const diff = new Date(formData.fechaSalida).getTime() - new Date(formData.fechaEntrada).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }, [formData.fechaEntrada, formData.fechaSalida]);

  // --- MANEJO DE MODALES ---
  const openModal = (type, room = null) => {
    setActiveModal(type);
    if (room) {
      setSelectedRoom(room);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedRoom(null);
    setFormData({
      nombre: '',
      personas: 1,
      fechaEntrada: new Date().toISOString().split('T')[0],
      fechaSalida: '',
      fechaNacimiento: '',
      telefono: '',
      email: '',
      habitacion_id: '',
      cargo: '',
      rfc: ''
    }); 
  };

  const handleCheckinSubmit = async () => {
    if (!formData.nombre || !formData.habitacion_id) {
      showToast("Por favor, ingresa el nombre y selecciona una habitación.", "warning");
      return;
    }

    if (isOverCapacity || isUnderage) {
      showToast("Corrige las alertas del formulario antes de continuar.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const res = await fetch('http://localhost:5000/api/habitaciones');
        const data = await res.json();
        setRooms(data);
        closeModal();
        showToast("¡Check-in registrado exitosamente!", "success"); // Notificación verde de éxito
      } else {
        const errData = await response.json();
        showToast(`Error: ${errData.error}`, "error");
      }
    } catch (error) {
      showToast("Error de conexión con el servidor de datos.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LÓGICA DE CHECK-OUT ---
  const handleCheckoutSubmit = async () => {
    if (!formData.habitacion_id) {
      showToast("Por favor, selecciona la habitación a liberar.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitacion_id: formData.habitacion_id })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Refrescar el panel para ver la habitación en estado "Sucia"
        const res = await fetch('http://localhost:5000/api/habitaciones');
        const data = await res.json();
        setRooms(data);
        closeModal();
        
        // Lanzamos la notificación con la sanción si la hay (warning) o el éxito (success)
        showToast(result.mensaje, result.tipo_alerta); 
      } else {
        const errData = await response.json();
        showToast(`Error: ${errData.error}`, "error");
      }
    } catch (error) {
      showToast("Error de conexión con el servidor.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LÓGICA DE LIMPIEZA DE HABITACIÓN ---
  const handleLimpiezaSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/limpiar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitacion_id: selectedRoom.id })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Refrescar las habitaciones
        const res = await fetch('http://localhost:5000/api/habitaciones');
        const data = await res.json();
        setRooms(data);
        closeModal();
        
        // Lanzamos nuestro Toast verde reutilizable
        showToast(result.mensaje, "success"); 
      } else {
        const errData = await response.json();
        showToast(`Error: ${errData.error}`, "error");
      }
    } catch (error) {
      showToast("Error de conexión con el servidor.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LÓGICA DE RESERVA RÁPIDA ---
  const handleReservaSubmit = async () => {
    if (!formData.nombre || !formData.habitacion_id) {
      showToast("Por favor, ingresa el nombre y selecciona una habitación.", "warning");
      return;
    }

    if (isOverCapacity || isUnderage) {
      showToast("Corrige las alertas del formulario antes de continuar.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/reserva_rapida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        const res = await fetch('http://localhost:5000/api/habitaciones');
        const data = await res.json();
        setRooms(data);
        closeModal();
        showToast(result.mensaje, "success");
      } else {
        const errData = await response.json();
        showToast(`Error: ${errData.error}`, "error");
      }
    } catch (error) {
      showToast("Error de conexión con el servidor de datos.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LÓGICA DE CANCELACIÓN DE RESERVA ---
  const handleCancelarReserva = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/cancelar_reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitacion_id: selectedRoom.id })
      });

      if (response.ok) {
        const result = await response.json();
        const res = await fetch('http://localhost:5000/api/habitaciones');
        setRooms(await res.json());
        closeModal();
        showToast(result.mensaje, "success");
      } else {
        const errData = await response.json();
        showToast(`Error: ${errData.error}`, "error");
      }
    } catch (error) {
      showToast("Error de conexión con el servidor.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LÓGICA DE MANTENIMIENTO ---
  const handleMantenimiento = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/mantenimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitacion_id: selectedRoom.id })
      });

      if (response.ok) {
        const result = await response.json();
        const res = await fetch('http://localhost:5000/api/habitaciones');
        setRooms(await res.json());
        closeModal();
        showToast(result.mensaje, selectedRoom.status === 'mantenimiento' ? "success" : "warning");
      } else {
        const errData = await response.json();
        showToast(`Error: ${errData.error}`, "error");
      }
    } catch (error) {
      showToast("Error de conexión.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* --- BARRA LATERAL (Acciones Rápidas) --- */}
      <aside className="w-72 bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 text-white flex flex-col shadow-2xl z-20 transition-all duration-300">
        <div className="p-6 text-center border-b border-indigo-800/50">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <User size={32} className="text-indigo-200" />
          </div>
          <h2 className="text-xl font-bold tracking-wider">HOTEL VILLA LINCE</h2>
          <p className="text-xs text-indigo-300 uppercase tracking-widest mt-1">Recepción</p>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-4 overflow-y-auto">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 px-2">Acciones Rápidas</p>
          
          <button 
            onClick={() => openModal('checkin')}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-100 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] group"
          >
            <CalendarCheck className="group-hover:rotate-12 transition-transform" />
            <span className="font-medium">Nuevo Check-in</span>
          </button>

          <button 
            onClick={() => openModal('checkout')}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] group"
          >
            <LogOut className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Check-out</span>
          </button>

          <button 
            onClick={() => openModal('reserva')}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/40 text-blue-100 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] group"
          >
            <PhoneCall className="group-hover:animate-bounce" />
            <span className="font-medium">Reserva Rápida</span>
          </button>
        </nav>

        <div className="p-4 border-t border-indigo-800/50">
          <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-indigo-300 hover:text-white transition-colors">
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* --- PANEL PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Buscador Superior */}
        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 z-10 shrink-0">
          <div className="relative w-full max-w-2xl group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-3 bg-slate-100 border-transparent rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-inner focus:shadow-lg"
              placeholder="Buscar por huésped, folio o número de habitación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Leyenda de colores rápida */}
          <div className="hidden lg:flex items-center space-x-4 ml-6 text-sm font-medium">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center space-x-1.5">
                <span className={`w-3 h-3 rounded-full ${config.color} shadow-sm`}></span>
                <span className="text-slate-600 capitalize">{config.label}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Cuadrícula Dinámica de Habitaciones */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Estado de Habitaciones</h1>
              <p className="text-slate-500 mt-1">Vista en tiempo real de ocupación y limpieza.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-medium">Sincronizando habitaciones con el servidor...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-rose-500 space-y-4">
              <AlertTriangle size={48} />
              <p className="text-lg font-semibold text-center px-4">{error}</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
              <AlertTriangle size={48} className="text-amber-300" />
              <p className="text-lg">No se encontraron habitaciones con esa búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {groupedRooms.map((grupo) => (
                <div key={grupo.tipo}>
                  <div className="flex items-center mb-4 border-b-2 border-slate-200 pb-2">
                    <Building className="text-indigo-500 mr-2" size={24} />
                    <h2 className="text-2xl font-bold text-slate-700 uppercase tracking-wide">
                      Habitaciones {grupo.tipo}
                    </h2>
                    <span className="ml-4 px-3 py-1 bg-slate-200 text-slate-600 text-sm font-semibold rounded-full shadow-sm">
                      {grupo.habitaciones.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {grupo.habitaciones.map((room) => {
                      const safeStatus = (room.status || 'disponible').toLowerCase();
                      const config = STATUS_CONFIG[safeStatus] || STATUS_CONFIG['disponible'];
                      const Icon = config.icon;
                      
                      return (
                        <div 
                          key={room.id}
                          onClick={() => {
                            if (safeStatus === 'ocupada' || safeStatus === 'reservada') openModal('detalles', room);
                            else if (safeStatus === 'sucia') openModal('limpieza', room);
                            else if (safeStatus === 'disponible' || safeStatus === 'mantenimiento') openModal('mantenimiento', room);
                          }}
                          // Eliminamos la validación condicional del cursor para que TODAS sean cliqueables
                          className={`relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group ${config.color} ${config.hover}`}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                          
                          <div className="p-5 flex flex-col h-full text-white relative z-10">
                            <div className="flex justify-between items-start mb-4">
                              <span className="text-3xl font-black drop-shadow-md">{room.id}</span>
                              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Icon size={24} className="drop-shadow-sm" />
                              </div>
                            </div>
                            
                            <div className="mt-auto">
                              <p className="text-sm font-semibold uppercase tracking-wider opacity-90 mb-2">{room.type}</p>
                              
                              <div className="flex items-center justify-between">
                                {room.guest && safeStatus === 'ocupada' ? (
                                  <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md w-full mr-2">
                                    <p className="font-bold truncate" title={room.guest}>{room.guest}</p>
                                    <p className="text-xs opacity-80">{room.folio}</p>
                                  </div>
                                ) : (
                                  <div className="h-10 flex items-center">
                                    <p className="text-sm font-medium opacity-90 capitalize">{config.label}</p>
                                  </div>
                                )}
                                
                                {/* Badge de Capacidad movido a un lado del estado */}
                                <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full flex items-center gap-1 font-medium whitespace-nowrap" title={`Capacidad máxima: ${CAPACIDADES[room.type]} personas`}>
                                  <Users size={10} /> Máx {CAPACIDADES[room.type]}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL ÚNICO REUTILIZABLE (EXCLUYENDO CHECKIN) --- */}
      {activeModal && activeModal !== 'checkin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden transform scale-100">
            <div className={`p-6 text-white shrink-0 ${
              activeModal === 'checkout' ? 'bg-rose-500' : 
              activeModal === 'detalles' ? 'bg-indigo-600' : 'bg-blue-500'
            }`}>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {activeModal === 'checkout' && <><LogOut /> Procesar Check-out</>}
                  {activeModal === 'reserva' && <><PhoneCall /> Reserva Express</>}
                  {activeModal === 'detalles' && <><User /> Detalles del Huésped</>}
                  {activeModal === 'limpieza' && <><Sparkles /> Limpieza Terminada</>}
                  {activeModal === 'mantenimiento' && <><Wrench /> Control de Mantenimiento</>}
                </h3>
                <button onClick={closeModal} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              {activeModal === 'detalles' && selectedRoom && selectedRoom.guestDetails && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start space-x-4">
                    <div className="bg-indigo-200 text-indigo-700 p-3 rounded-full">
                      <BedDouble size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">Habitación {selectedRoom.id}</h4>
                      <p className="text-sm font-medium text-indigo-600">{selectedRoom.type} • Folio: {selectedRoom.folio}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><User size={12}/> Nombre</p>
                      <p className="text-sm font-semibold text-slate-700">{selectedRoom.guest}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Users size={12}/> Personas</p>
                      <p className="text-sm font-semibold text-slate-700">{selectedRoom.guestDetails.personas} Personas</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar size={12}/> Estancia</p>
                      <p className="text-sm font-semibold text-slate-700">{selectedRoom.guestDetails.fechaEntrada} al {selectedRoom.guestDetails.fechaSalida}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><PhoneCall size={12}/> Teléfono</p>
                      <p className="text-sm font-semibold text-slate-700">{selectedRoom.guestDetails.telefono}</p>
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Mail size={12}/> Correo Electrónico</p>
                      <p className="text-sm font-semibold text-slate-700 truncate" title={selectedRoom.guestDetails.email}>{selectedRoom.guestDetails.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar size={12}/> F. de Nacimiento</p>
                      <p className="text-sm font-semibold text-slate-700">{selectedRoom.guestDetails.fechaNacimiento}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeModal === 'reserva' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Habitación Asignada</label>
                    <select 
                      value={formData.habitacion_id}
                      onChange={(e) => setFormData({...formData, habitacion_id: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Seleccione habitación...</option>
                      {rooms.filter(r => (r.status || '').toLowerCase() === 'disponible').map(r => (
                        <option key={r.id} value={r.id}>Hab. {r.id} ({r.type} - Máx {CAPACIDADES[r.type]})</option>
                      ))}
                    </select>
                  </div>

                  {formData.habitacion_id && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs font-semibold text-slate-600">Nombre Completo</label>
                        <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. Juan Pérez" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">No. de Personas</label>
                        <input type="number" min="1" value={formData.personas} onChange={(e) => setFormData({...formData, personas: parseInt(e.target.value) || 1})} className={`w-full p-2 border rounded-lg bg-slate-50 outline-none ${isOverCapacity ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`} />
                        {isOverCapacity && <p className="text-[10px] text-red-500 font-medium">Supera la capacidad ({maxCapacity}).</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Fecha de Nacimiento</label>
                        <input type="date" value={formData.fechaNacimiento} onChange={(e) => setFormData({...formData, fechaNacimiento: e.target.value})} className={`w-full p-2 border rounded-lg bg-slate-50 outline-none ${isUnderage ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`} />
                        {isUnderage && <p className="text-[10px] text-red-500 font-medium">Debe ser mayor de edad.</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Fecha Entrada</label>
                        <input type="date" min={new Date().toISOString().split('T')[0]} value={formData.fechaEntrada} onChange={(e) => setFormData({...formData, fechaEntrada: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Fecha Salida</label>
                        <input type="date" min={formData.fechaEntrada} value={formData.fechaSalida} onChange={(e) => setFormData({...formData, fechaSalida: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50" />
                        {diasEstadia > 0 && <p className="text-[10px] text-indigo-600 font-medium">Estadía: {diasEstadia} día(s)</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Teléfono</label>
                        <input type="tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50" placeholder="10 dígitos" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Correo Electrónico</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50" placeholder={isEjecutiva ? "correo@empresa.com" : "correo@ejemplo.com"} />
                      </div>

                      {isEjecutiva && (
                        <>
                          <div className="space-y-1 col-span-2">
                            <label className="text-xs font-semibold text-amber-600">Convenio (Solo si aplica)</label>
                            <select 
                              value={formData.convenio_id}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const foundConv = convenios.find(c => c.id.toString() === selectedId);
                                setFormData({
                                  ...formData,
                                  convenio_id: selectedId,
                                  empresa: foundConv ? foundConv.empresa : formData.empresa
                                });
                              }}
                              className="w-full p-2 border border-amber-200 rounded-lg bg-amber-50 text-slate-800 text-sm outline-none"
                            >
                              <option value="">Ninguno / Sin convenio (Precio regular)</option>
                              {convenios.map(c => (
                                <option key={c.id} value={c.id}>{c.empresa} (Desc: {c.descuento})</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-amber-600">Empresa *</label>
                            <input type="text" required value={formData.empresa} onChange={(e) => setFormData({...formData, empresa: e.target.value})} className="w-full p-2 border border-amber-200 rounded-lg bg-amber-50 text-slate-800 text-sm outline-none" placeholder="Empresa del huésped" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-amber-600">Cargo / Puesto *</label>
                            <input type="text" required value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} className="w-full p-2 border border-amber-200 rounded-lg bg-amber-50 text-slate-800 text-sm outline-none" placeholder="Puesto de trabajo" />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-xs font-semibold text-amber-600">RFC Fiscal *</label>
                            <input type="text" required value={formData.rfc} onChange={(e) => setFormData({...formData, rfc: e.target.value})} className="w-full p-2 border border-amber-200 rounded-lg bg-amber-50 text-slate-800 text-sm outline-none" placeholder="RFC corporativo" />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeModal === 'checkout' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Folio / Habitación a Liberar</label>
                    <select 
                      value={formData.habitacion_id}
                      onChange={(e) => setFormData({...formData, habitacion_id: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Seleccione ocupante...</option>
                      {rooms.filter(r => (r.status || '').toLowerCase() === 'ocupada').map(r => (
                        <option key={r.id} value={r.id}>Hab. {r.id} - {r.guest} ({r.folio})</option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">
                      <strong>Nota de Sistema:</strong> El algoritmo verificará automáticamente la hora actual. Si el huésped excede la hora límite estipulada de Check-out (12:00 PM), se arrojará una alerta de cobro por penalización.
                    </p>
                  </div>
                </div>
              )}

              {activeModal === 'limpieza' && selectedRoom && (
                <div className="space-y-4 text-center py-6">
                  <div className="bg-amber-100 text-amber-600 p-4 rounded-full inline-block mb-2 shadow-inner">
                    <Sparkles size={48} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">¿La habitación {selectedRoom.id} ya está limpia?</h4>
                  <p className="text-sm text-slate-600 px-4">
                    Al confirmar, la habitación cambiará a color verde ("Disponible") y el sistema permitirá asignar nuevos huéspedes a esta habitación.
                  </p>
                </div>
              )}
              {activeModal === 'mantenimiento' && selectedRoom && (
                <div className="space-y-4 text-center py-6">
                  <div className={`p-4 rounded-full inline-block mb-2 shadow-inner ${selectedRoom.status === 'mantenimiento' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {selectedRoom.status === 'mantenimiento' ? <CheckCircle2 size={48} /> : <Wrench size={48} />}
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">
                    {selectedRoom.status === 'mantenimiento' ? '¿Finalizar Mantenimiento?' : '¿Enviar a Mantenimiento?'}
                  </h4>
                  <p className="text-sm text-slate-600 px-4">
                    {selectedRoom.status === 'mantenimiento' 
                      ? `La habitación ${selectedRoom.id} ha sido reparada y volverá a estar Disponible.` 
                      : `La habitación ${selectedRoom.id} desaparecerá de las opciones de Check-in hasta ser reparada.`}
                  </p>
                </div>
              )}

              {/* --- BOTONES DEL MODAL OPTIMIZADOS CON ENLAZADO EXPRESS --- */}
              <div className="pt-4 flex gap-3">
                {activeModal === 'detalles' && selectedRoom?.status === 'reservada' ? (
                  <>
                    <button 
                      onClick={handleCancelarReserva}
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-transform bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 text-sm"
                    >
                      {isSubmitting ? 'Cancelando...' : 'Cancelar Reserva'}
                    </button>
                    
                    <button 
                      onClick={() => {
                        const details = selectedRoom.guestDetails || {};

                        const prellenadoReserva = {
                          nombre: selectedRoom.guest || '',
                          personas: details.personas || 1,
                          fechaEntrada: details.fechaEntrada || '',
                          fechaSalida: details.fechaSalida || '',
                          fechaNacimiento: details.fechaNacimiento === "No registrado" ? "" : details.fechaNacimiento,
                          telefono: details.telefono === "No registrado" ? "" : details.telefono,
                          email: details.email === "No registrado" ? "" : details.email,
                          habitacion_id: selectedRoom.id,
                          empresa: details.empresa === "Particular" ? "" : details.empresa,
                          cargo: details.cargo || '',
                          rfc: details.notas?.startsWith("RFC: ") ? details.notas.replace("RFC: ", "") : ''
                        };
                        
                        setWizardInitialData(prellenadoReserva);
                        setActiveModal('checkin'); 
                      }}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-transform bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 text-sm flex items-center justify-center gap-2 animate-pulse"
                    >
                      Proceder Check-In
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={
                      activeModal === 'detalles' ? closeModal : 
                      activeModal === 'checkout' ? handleCheckoutSubmit : 
                      activeModal === 'limpieza' ? handleLimpiezaSubmit :
                      activeModal === 'reserva' ? handleReservaSubmit :
                      handleMantenimiento
                    }
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-transform text-sm ${
                      activeModal === 'reserva' ? 'bg-fuchsia-500 hover:bg-fuchsia-600 shadow-fuchsia-500/30' : 
                      activeModal === 'checkout' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' : 
                      activeModal === 'detalles' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30' : 
                      activeModal === 'limpieza' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 
                      'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                    }`}
                  >
                    {isSubmitting ? 'Procesando...' : 
                    activeModal === 'detalles' ? 'Cerrar Detalles' : 
                    activeModal === 'limpieza' ? 'Confirmar Limpieza' : 
                    activeModal === 'mantenimiento' && selectedRoom?.status !== 'mantenimiento' ? 'Enviar a Mantenimiento' :
                    activeModal === 'mantenimiento' && selectedRoom?.status === 'mantenimiento' ? 'Habilitar Habitación' :
                    'Confirmar Reserva Express'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
    NUEVO MODAL INDEPENDIENTE PARA EL CHECK-IN WIZARD
    ===================================================================== */}
      {activeModal === 'checkin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* Agregamos max-w-3xl para mayor amplitud, max-h y flex-col */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Cabecera estática que nunca se mueve al desplazar hacia abajo */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <CalendarCheck size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Check-In y Pago Modular</h3>
                  <p className="text-xs text-slate-500">Flujo de registro seguro con terminal de pagos</p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenedor del contenido del Wizard con scroll vertical independiente y elegante */}
            <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <CheckInWizard 
                rooms={rooms}
                convenios={convenios}
                initialData={wizardInitialData} /* Heredamos el objeto precargado */
                onComplete={() => {
                  const refreshRooms = async () => {
                    const res = await fetch('http://localhost:5000/api/habitaciones');
                    if(res.ok) setRooms(await res.json());
                  };
                  refreshRooms();
                  closeModal();
                  showToast("¡Check-in y Pago completados exitosamente!", "success");
                }}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}
      {/* --- NOTIFICACIÓN INTERACTIVA TOAST (ANIMADA Y MULTICOLOR) --- */}
      <div 
        className={`fixed top-6 right-6 z-50 flex items-center gap-3 bg-white text-slate-900 border-2 font-medium px-5 py-4 rounded-2xl max-w-sm transition-all duration-500 ease-in-out transform ${
          toast.show ? 'translate-x-0 opacity-100' : 'translate-x-[150%] opacity-0'
        } ${
          toast.type === 'success' ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
          toast.type === 'warning' ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' :
          'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
        }`}
      >
        <div className={`p-2 rounded-xl shrink-0 ${
          toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
          toast.type === 'warning' ? 'bg-amber-100 text-amber-600' :
          'bg-rose-100 text-rose-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        </div>
        <div className="flex-1">
          <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
            toast.type === 'success' ? 'text-emerald-500' :
            toast.type === 'warning' ? 'text-amber-500' :
            'text-rose-500'
          }`}>
            {toast.type === 'success' ? 'Operación Exitosa' : toast.type === 'warning' ? 'Advertencia' : 'Error en el Sistema'}
          </p>
          <p className="text-sm leading-relaxed">{toast.message}</p>
        </div>
        <button 
          onClick={() => setToast(prev => ({ ...prev, show: false }))} 
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors ml-2"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
