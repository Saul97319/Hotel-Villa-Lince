import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, Plus, Send, CheckCircle2, 
  AlertCircle, XCircle, X, Briefcase, Calendar, Hotel, LogOut, Edit, Trash2, Power 
} from 'lucide-react';

export default function GestionGerencialApp({ onLogout }) {
  // ==========================================
  // ESTADOS DEL COMPONENTE
  // ==========================================
  const [activeTab, setActiveTab] = useState('convenios');
  const [convenios, setConvenios] = useState([]);
  const [representantes, setRepresentantes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingConvenio, setEditingConvenio] = useState(null); 
  const [toasts, setToasts] = useState([]);
  const [convenioToDelete, setConvenioToDelete] = useState(null);
  
  // ==========================================
  // CONEXIÓN CON EL BACKEND (CARGA ÚNICA)
  // ==========================================
  const fetchData = async () => {
    try {
      setLoading(true);
      const [convRes, repRes, facRes] = await Promise.all([
        fetch('http://localhost:5000/api/convenios'),
        fetch('http://localhost:5000/api/representantes'),
        fetch('http://localhost:5000/api/facturas_gerencia')
      ]);

      if (convRes.ok) setConvenios(await convRes.json());
      if (repRes.ok) setRepresentantes(await repRes.json());
      if (facRes.ok) setFacturas(await facRes.json());
    } catch (error) {
      showToast("Error de conexión al cargar los datos corporativos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // UTILERÍAS NATIVAS DE FACTURACIÓN
  // ==========================================
  const descargarXML = (factura) => {
    // Mapeamos los conceptos dinámicos en nodos XML auténticos
    const nodosConceptos = factura.conceptos?.map(c => 
      `    <Concepto Descripcion="${c.descripcion}" Cantidad="${c.cantidad}" PrecioUnitario="${c.precio_unitario.toFixed(2)}" Descuento="${c.descuento.toFixed(2)}" Importe="${c.importe.toFixed(2)}" />`
    ).join('\n') || '';

    const estructuraXml = `<?xml version="1.0" encoding="UTF-8"?>
<Comprobante Fiscal="Simulado" Folio="${factura.folio_interno || factura.id}" UUID="${factura.uuid || ''}" FechaEmision="${factura.fecha_emision || ''}">
  <Emisor RazonSocial="${factura.emisor?.razon_social || 'Hotel Villa Lince S.A. de C.V.'}" RFC="${factura.emisor?.rfc || 'HVL260311LN8'}" RegimenFiscal="601" />
  <Receptor RazonSocial="${factura.receptor?.nombre_razon_social || factura.empresa}" RFC="${factura.receptor?.rfc || 'XAXX010101000'}" Esquema="${factura.receptor?.convenio_aplicado || 'Ninguno'}" />
  <Conceptos>
${nodosConceptos}
  </Conceptos>
  <Impuestos TotalImpuestosTrasladados="${((factura.impuestos?.iva_total || 0) + (factura.impuestos?.ish_total || 0)).toFixed(2)}">
    <Traslado Impuesto="IVA" Tasa="0.16" Importe="${factura.impuestos?.iva_total || 0}" />
    <Traslado Impuesto="ISH" Tasa="0.03" Importe="${factura.impuestos?.ish_total || 0}" />
  </Impuestos>
  <Totales SubTotal="${(factura.totales?.subtotal || 0).toFixed(2)}" TotalDescuento="${(factura.totales?.total_descuento || 0).toFixed(2)}" TotalNeto="${(factura.totales?.total_neto || 0).toFixed(2)}" EstadoPago="${factura.estado_pago || factura.estado}" />
</Comprobante>`;

    // Generamos el Blob en formato XML
    const blob = new Blob([estructuraXml], { type: 'text/xml;charset=utf-8;' });
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", URL.createObjectURL(blob));
    downloadAnchor.setAttribute("download", `Factura_${factura.folio_interno || factura.id}.xml`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const dispararImpresion = () => {
    const tituloOriginal = document.title;
    // Forzamos al navegador a usar el folio real como nombre de descarga del archivo PDF
    document.title = `Factura_${facturaSeleccionada?.folio_interno || 'Villa-Lince'}`;
    window.print();
    document.title = tituloOriginal; // Restauramos el título original
  };

  // ==========================================
  // NOTIFICACIONES Y MODALES
  // ==========================================
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const openModal = (type, data = null) => {
    setModalType(type);
    if (data) setEditingConvenio(data);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType('');
    setEditingConvenio(null); 
  };

  // ==========================================
  // LÓGICA DE NEGOCIO (CRUD CONVENIOS)
  // ==========================================
  const handleCrearConvenio = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nuevoConvenio = {
      empresa: formData.get('empresa'),
      descuento: formData.get('descuento'),
      terminos: formData.get('terminos')
    };
    
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/convenios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoConvenio)
      });

      if (response.ok) {
        const result = await response.json();
        await fetchData();
        closeModal();
        showToast(result.mensaje, 'success');
      } else {
        const err = await response.json();
        showToast(`Error: ${err.error}`, 'error');
      }
    } catch (error) {
      showToast("Error de comunicación.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActualizarConvenio = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datosActualizados = {
      empresa: formData.get('empresa'),
      descuento: formData.get('descuento'),
      terminos: formData.get('terminos')
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/convenios/${editingConvenio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      });

      if (response.ok) {
        const result = await response.json();
        await fetchData();
        closeModal();
        showToast(result.mensaje, 'success');
      } else {
        const err = await response.json();
        showToast(`Error: ${err.error}`, 'error');
      }
    } catch (error) {
      showToast("Error de comunicación.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEstado = async (conv) => {
    const nuevoEstado = conv.estado === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      const response = await fetch(`http://localhost:5000/api/convenios/${conv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        await fetchData();
        showToast(`Estado de ${conv.empresa} cambiado a ${nuevoEstado}`, 'success');
      } else {
        const err = await response.json();
        showToast(`Error: ${err.error}`, 'error');
      }
    } catch (error) {
      showToast("Error al cambiar el estado.", "error");
    }
  };

  const executeEliminarConvenio = async () => {
    if (!convenioToDelete) return;
    try {
      const response = await fetch(`http://localhost:5000/api/convenios/${convenioToDelete}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
        showToast("Convenio eliminado exitosamente.", "success");
      } else {
        const err = await response.json();
        showToast(`Error: ${err.error}`, "error");
      }
    } catch (error) {
      showToast("Error al eliminar el convenio.", "error");
    } finally {
      setConvenioToDelete(null);
    }
  };

  const handleCrearRepresentante = (e) => {
    e.preventDefault();
    closeModal();
    showToast("Para mantener la integridad, asigne la habitación desde el Mostrador usando el Súper Formulario.", "warning");
  };

  // ==========================================
  // COMPONENTES DE RENDEREADO INTERNO
  // ==========================================
  const renderConvenios = () => (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Convenios Corporativos</h2>
          <p className="text-slate-500 text-sm mt-1">Gestiona las alianzas y tarifas especiales para empresas.</p>
        </div>
        <button 
          onClick={() => openModal('convenio')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={18} />
          Nuevo Convenio
        </button>
      </div>

      {convenios.length === 0 ? (
        <div className="text-center py-10 text-slate-500">No hay convenios registrados en la base de datos.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {convenios.map(conv => (
            <div key={conv.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col h-full group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Building2 size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => openModal('editar_convenio', conv)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Editar Convenio"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => setConvenioToDelete(conv.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Eliminar Convenio"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={() => handleToggleEstado(conv)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105 shadow-sm ${
                      conv.estado === 'Activo' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' 
                        : 'bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200'
                    }`}
                  >
                    <Power size={12} />
                    {conv.estado}
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">{conv.empresa}</h3>
              <p className="text-indigo-600 font-bold text-xl mb-4">{conv.descuento} <span className="text-sm font-normal text-slate-500">Descuento base</span></p>
              <div className="border-t border-slate-100 pt-4 mt-auto">
                <p className="text-sm text-slate-600 line-clamp-2">
                  <span className="font-semibold text-slate-700">Términos:</span> {conv.terminos}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRepresentantes = () => (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Representantes Corporativos</h2>
          <p className="text-slate-500 text-sm mt-1">Control de huéspedes afiliados a empresas en convenio.</p>
        </div>
        <button 
          onClick={() => openModal('representante')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={18} />
          Agregar Huésped
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Huésped</th>
                <th className="p-4 font-semibold">Empresa / Cargo</th>
                <th className="p-4 font-semibold">Habitación</th>
                <th className="p-4 font-semibold">Período de Estadía</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {representantes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-slate-500">No hay representantes corporativos registrados.</td>
                </tr>
              ) : (
                representantes.map(rep => (
                  <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm uppercase">
                          {rep.nombre.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{rep.nombre}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Briefcase size={16} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{rep.empresa}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Hotel size={16} className="text-slate-400 shrink-0" />
                        {rep.habitacion}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm whitespace-nowrap">
                        <Calendar size={16} className="text-slate-400 shrink-0" />
                        {rep.estadia}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFacturas = () => (
    <div className="animate-fade-in no-print">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Facturación Empresarial y Comprobantes</h2>
        <p className="text-slate-500 text-sm mt-1">Panel gerencial de control de auditoría, exportación técnica e impresión fiscal.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Folio Interno</th>
                {/* 🔽 SE SEPARAN LAS COLUMNAS EN DOS AQUÍ */}
                <th className="p-4 font-semibold">Empresa Afiliada</th>
                <th className="p-4 font-semibold">Huésped Titular</th>
                <th className="p-4 font-semibold">Fecha Emisión</th>
                <th className="p-4 font-semibold">Monto Neto</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-center">Acciones Fiscales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {facturas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-slate-500">No hay facturas generadas en el sistema.</td>
                </tr>
              ) : (
                facturas.map(fac => (
                  <tr key={fac.id_real || fac.factura_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600">{fac.folio_interno || fac.id}</td>
                    
                    {/* Celda de la Empresa */}
                    <td className="p-4 font-semibold text-slate-800">
                      {fac.empresa_nombre || "Particular"}
                    </td>

                    {/* Celda del Huésped */}
                    <td className="p-4 text-slate-600">
                      {fac.huesped_nombre || "Huésped General"}
                    </td>

                    <td className="p-4 text-slate-500">
                      {fac.fecha_emision ? new Date(fac.fecha_emision).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : fac.fecha}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {typeof fac.totales?.total_neto === 'number' ? `$${fac.totales.total_neto.toFixed(2)}` : fac.monto}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                        (fac.estado_pago || fac.estado) === 'Pagado' || (fac.estado_pago || fac.estado) === 'Pagada'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {fac.estado_pago || fac.estado}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button 
                        onClick={() => setFacturaSeleccionada(fac)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Ver Factura
                      </button>
                      <button 
                        onClick={() => descargarXML(fac)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Formato XML
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  // ==========================================
  // RENDERIZADO GLOBAL DE LA INTERFAZ
  // ==========================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-600 font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="font-medium text-sm">Cargando el historial gerencial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @media print {
          aside, nav, header, button, .no-print { display: none !important; }
          
          body, html {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          /* Forzamos al contenedor del comprobante a tomar la totalidad de la pantalla de impresión */
          .print-modal-layout {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
          }
          .format-pdf-sheet {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            padding: 1cm !important;
          }
        }    
      `}</style>

      {/* BARRA LATERAL */}
      <aside className="w-64 bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 text-white flex flex-col shadow-xl z-10 hidden md:flex no-print">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
            <Hotel className="text-indigo-200" size={28} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">Villa Lince</h1>
            <p className="text-xs text-indigo-300">Gestión Gerencial</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setActiveTab('convenios')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'convenios' ? 'bg-white/15 text-white shadow-sm border border-white/10' : 'text-indigo-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Building2 size={20} />
            <span className="font-medium text-sm">Convenios</span>
          </button>
          <button 
            onClick={() => setActiveTab('representantes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'representantes' ? 'bg-white/15 text-white shadow-sm border border-white/10' : 'text-indigo-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users size={20} />
            <span className="font-medium text-sm">Representantes</span>
          </button>
          <button 
            onClick={() => setActiveTab('facturas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'facturas' ? 'bg-white/15 text-white shadow-sm border border-white/10' : 'text-indigo-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileText size={20} />
            <span className="font-medium text-sm">Facturación</span>
          </button>
        </nav>

        <div className="p-6 mt-auto border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/150?img=11" alt="Gerente" className="w-10 h-10 rounded-full border-2 border-indigo-400/30" />
            <div>
              <p className="text-sm font-semibold">Gerente General</p>
              <p className="text-xs text-indigo-300">Corporativo</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 hover:text-white rounded-lg transition-all duration-300 border border-rose-500/30">
            <LogOut size={16} />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE TRABAJO DINÁMICA */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center md:hidden no-print">
          <div className="flex items-center gap-2">
            <Hotel className="text-indigo-900" size={24} />
            <h1 className="font-bold text-slate-800">Villa Lince</h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'convenios' && renderConvenios()}
            {activeTab === 'representantes' && renderRepresentantes()}
            {activeTab === 'facturas' && renderFacturas()}
          </div>
        </div>
      </main>

      {/* COMPONENTE CAPA TOASTS */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 no-print">
        {toasts.map(toast => {
          const colors = {
            success: 'bg-white border-emerald-500 text-slate-800 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
            warning: 'bg-white border-amber-500 text-slate-800 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
            error: 'bg-white border-rose-500 text-slate-800 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
          };
          const Icon = {
            success: <CheckCircle2 className="text-emerald-500" size={20} />,
            warning: <AlertCircle className="text-amber-500" size={20} />,
            error: <XCircle className="text-rose-500" size={20} />
          }[toast.type];

          return (
            <div key={toast.id} className={`animate-slide-in-right flex items-center gap-3 p-4 rounded-xl border-l-4 min-w-[300px] ${colors[toast.type]}`}>
              <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'success' ? 'bg-emerald-100' : toast.type === 'warning' ? 'bg-amber-100' : 'bg-rose-100'}`}>
                {Icon}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${toast.type === 'success' ? 'text-emerald-500' : toast.type === 'warning' ? 'text-amber-500' : 'text-rose-500'}`}>
                  {toast.type === 'success' ? 'Operación Exitosa' : toast.type === 'warning' ? 'Advertencia' : 'Error en el Sistema'}
                </p>
                <p className="text-sm leading-relaxed font-medium">{toast.message}</p>
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 transition-colors ml-2">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* CAPA DE MODALES (CRUD CONVENIOS) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {modalType === 'convenio' ? 'Crear Nuevo Convenio' : modalType === 'editar_convenio' ? 'Editar Convenio' : 'Registrar Representante'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-rose-500 transition-colors rounded-full p-1 hover:bg-rose-50">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {modalType === 'convenio' && (
                <form onSubmit={handleCrearConvenio} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Empresa Aliada</label>
                    <input required name="empresa" type="text" placeholder="Ej. Corporativo XYZ" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none text-sm text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Porcentaje de Descuento (%)</label>
                    <input required name="descuento" type="number" min="0" max="100" placeholder="Ej. 15" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none text-sm text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Términos Adicionales</label>
                    <textarea required name="terminos" rows="3" placeholder="Detalles del acuerdo..." className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none text-sm resize-none text-gray-800"></textarea>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={closeModal} disabled={isSubmitting} className="flex-1 bg-white border border-slate-300 text-slate-700 font-medium py-2.5 rounded-lg hover:bg-slate-50">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 shadow-sm">{isSubmitting ? 'Guardando...' : 'Guardar Convenio'}</button>
                  </div>
                </form>
              )}

              {modalType === 'editar_convenio' && editingConvenio && (
                <form onSubmit={handleActualizarConvenio} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Empresa Aliada</label>
                    {/* Quitamos el 'disabled' e introducimos el atributo name para capturar el valor en el submit */}
                    <input required name="empresa" type="text" defaultValue={editingConvenio.empresa} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none text-slate-800 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Porcentaje de Descuento (%)</label>
                    <input required name="descuento" type="number" min="0" max="100" defaultValue={editingConvenio.descuento.replace('%','')} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none text-sm text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Términos Adicionales</label>
                    <textarea required name="terminos" rows="3" defaultValue={editingConvenio.terminos} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none text-sm resize-none text-gray-800"></textarea>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={closeModal} disabled={isSubmitting} className="flex-1 bg-white border border-slate-300 text-slate-700 font-medium py-2.5 rounded-lg hover:bg-slate-50">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 shadow-sm">{isSubmitting ? 'Guardando...' : 'Actualizar Convenio'}</button>
                  </div>
                </form>
              )}

              {modalType === 'representante' && (
                <div className="text-center space-y-4">
                  <div className="bg-amber-100 text-amber-600 p-4 rounded-full inline-block shadow-inner">
                    <AlertCircle size={40} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">Acción Restringida</h4>
                  <p className="text-sm text-slate-600">
                    Para mantener la integridad de la base de datos y la sincronización con las habitaciones, los representantes corporativos deben registrarse directamente desde el Mostrador en el momento del Check-in.
                  </p>
                  <div className="pt-4">
                    <button type="button" onClick={closeModal} className="w-full bg-slate-800 text-white font-medium py-2.5 rounded-lg hover:bg-slate-900">Entendido</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ELIMINACIÓN DE CONVENIOS */}
      {convenioToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setConvenioToDelete(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in border border-slate-100 text-center p-6">
            <div className="bg-rose-100 text-rose-600 p-4 rounded-full inline-flex mb-4 shadow-inner">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar convenio?</h3>
            <p className="text-sm text-slate-600 mb-6">¿Estás seguro de que deseas eliminar este convenio de forma permanente? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConvenioToDelete(null)} className="flex-1 bg-white border border-slate-300 text-slate-700 font-medium py-2.5 rounded-lg hover:bg-slate-50">Cancelar</button>
              <button onClick={executeEliminarConvenio} className="flex-1 bg-rose-600 text-white font-medium py-2.5 rounded-lg hover:bg-rose-700 shadow-sm">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INDEPENDIENTE: INSPECTOR DE FACTURACIÓN FISCAL */}
      {facturaSeleccionada && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-[70] overflow-y-auto print-modal-layout">
          <div className="bg-white text-gray-900 w-full max-w-4xl p-8 rounded-2xl shadow-2xl relative border border-gray-300 my-auto format-pdf-sheet">
            {/* Controles superiores */}
            <div className="absolute top-4 right-4 flex space-x-2 no-print">
              <button onClick={dispararImpresion} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all">
                🖨️ Imprimir / Guardar PDF
              </button>
              <button onClick={() => setFacturaSeleccionada(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl font-medium text-sm transition-all">
                Cerrar
              </button>
            </div>

            {/* Encabezado Comprobante */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mt-8 md:mt-0">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Hotel Villa Lince</h1>
                <p className="text-xs text-gray-600 font-semibold">{facturaSeleccionada.emisor?.razon_social || 'Hotel Villa Lince S.A. de C.V.'}</p>
                <p className="text-xs text-gray-500">RFC: {facturaSeleccionada.emisor?.rfc || 'HVL260311LN8'}</p>
                <p className="text-xs text-gray-500">Régimen Fiscal: 601 - General de Ley Personas Morales</p>
                <p className="text-xs text-gray-500">Matriz: Av. Prolongación El Colli, Zapopan, Jalisco</p>
              </div>
              <div className="text-right bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase">Comprobante Fiscal Digital</h3>
                <p className="text-lg font-mono font-bold text-indigo-600">{facturaSeleccionada.folio_interno || facturaSeleccionada.id}</p>
                <p className="text-[10px] font-mono text-gray-500 mt-2">UUID FISCAL SIMULADO:</p>
                <p className="text-[10px] font-mono text-gray-600 bg-gray-200 p-1 rounded break-all select-all">{facturaSeleccionada.uuid || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'}</p>
                <p className="text-xs text-gray-500 mt-1">Emisión: {facturaSeleccionada.fecha_emision ? new Date(facturaSeleccionada.fecha_emision).toLocaleString() : new Date().toLocaleString()}</p>
              </div>
            </div>

            {/* Datos Receptor */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 my-6 text-xs">
              <h4 className="font-bold text-indigo-950 uppercase mb-2">Receptor del Comprobante</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p><span className="font-semibold text-gray-600">Razón Social:</span> {facturaSeleccionada.receptor?.nombre_razon_social || facturaSeleccionada.empresa}</p>
                  <p><span className="font-semibold text-gray-600">RFC Fiscal:</span> {facturaSeleccionada.receptor?.rfc || 'XAXX010101000'}</p>
                </div>
                <div>
                  <p><span className="font-semibold text-gray-600">Uso CFDI:</span> G03 - Gastos en general</p>
                  <p><span className="font-semibold text-gray-600">Esquema comercial:</span> {facturaSeleccionada.receptor?.convenio_aplicado || 'Ninguno'}</p>
                </div>
              </div>
            </div>

            {/* Tabla Conceptos */}
            <table className="w-full text-left text-xs border-collapse border border-slate-200 mb-6">
              <thead>
                <tr className="bg-slate-800 text-white uppercase text-[10px]">
                  <th className="p-3 border border-slate-200">Descripción del Servicio / Concepto</th>
                  <th className="p-3 border border-slate-200 text-center w-16">Cant.</th>
                  <th className="p-3 border border-slate-200 text-right w-28">Precio Unitario</th>
                  <th className="p-3 border border-slate-200 text-right w-24">Descuento</th>
                  <th className="p-3 border border-slate-200 text-right w-28">Importe Neto</th>
                </tr>
              </thead>
              <tbody>
                {facturaSeleccionada.conceptos?.map((concepto, idx) => (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">{concepto.descripcion}</td>
                    <td className="p-3 text-center font-bold text-gray-600">{concepto.cantidad}</td>
                    <td className="p-3 text-right text-gray-700">${concepto.precio_unitario.toFixed(2)}</td>
                    <td className="p-3 text-right text-rose-600">-${concepto.descuento.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">${concepto.importe.toFixed(2)}</td>
                  </tr>
                )) || (
                  <tr className="border-b border-slate-200">
                    <td className="p-3 font-medium text-slate-800">Servicios de Hospedaje Generales contratados</td>
                    <td className="p-3 text-center font-bold text-gray-600">1</td>
                    <td className="p-3 text-right text-gray-700">{facturaSeleccionada.monto}</td>
                    <td className="p-3 text-right text-rose-600">-$0.00</td>
                    <td className="p-3 text-right font-bold text-slate-900">{facturaSeleccionada.monto}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totales */}
            <div className="flex justify-end text-xs">
              <div className="w-full max-w-sm bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-gray-600">Subtotal Comercial:</span>
                  <span className="font-semibold text-slate-800">${(facturaSeleccionada.totales?.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1 text-rose-600">
                  <span>Descuento Corporativo:</span>
                  <span className="font-semibold">-${(facturaSeleccionada.totales?.total_descuento || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1 text-gray-500">
                  <span>IVA Trasladado (16.00%):</span>
                  <span>${(facturaSeleccionada.impuestos?.iva_total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1 text-gray-500">
                  <span>ISH Local (3.00%):</span>
                  <span>${(facturaSeleccionada.impuestos?.ish_total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-indigo-900 font-black text-sm pt-1">
                  <span>TOTAL GENERAL NETO:</span>
                  <span>{facturaSeleccionada.totales?.total_neto ? `$${facturaSeleccionada.totales.total_neto.toFixed(2)}` : facturaSeleccionada.monto}</span>
                </div>
              </div>
            </div>

            {/* Sello Digital */}
            <div className="mt-8 border-t border-gray-200 pt-4 text-[9px] text-gray-400 font-mono leading-tight">
              <p className="font-bold text-gray-500 mb-1 uppercase tracking-wide">Cadena Original del Complemento de Certificación Digital:</p>
              <p className="break-all bg-slate-50 p-2 rounded border border-slate-100">
                ||1.1|{facturaSeleccionada.uuid || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'}|2026-06-04T11:54:00|HVL260311LN8|mSgWq9A7bC+pX0vLk1M9zY3RtWE5nN...
              </p>
              <p className="mt-4 text-center text-gray-400 font-sans">Este documento es una representación impresa de un CFDI simulado para fines académicos universitarios.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}