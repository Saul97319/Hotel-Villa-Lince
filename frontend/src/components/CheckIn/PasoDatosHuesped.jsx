import React, { useState, useMemo } from 'react';
import { User, Users, Calendar, PhoneCall, Mail, Building, FileText, AlertTriangle } from 'lucide-react';

const CAPACIDADES = {
  'Individual': 1, 'Doble': 2, 'Matrimonial': 2, 'Ejecutiva': 2, 'Suite': 4, 'Familiar': 6
};

export default function PasoDatosHuesped({ rooms, convenios, onNext, onCancel, initialData }) {
  const [formData, setFormData] = useState({
  nombre: initialData.nombre || '',

  personas: initialData.personas ? parseInt(initialData.personas) : 1,
  
  fechaEntrada: initialData.fechaEntrada || new Date().toISOString().split('T')[0],
  fechaSalida: initialData.fechaSalida || '',
  fechaNacimiento: initialData.fechaNacimiento || '',
  telefono: initialData.telefono || '',
  email: initialData.email || '',
  habitacion_id: initialData.habitacion_id || '',
  empresa: initialData.empresa || '',
  cargo: initialData.cargo || '',
  convenio_id: initialData.convenio_id || '',
  rfc: initialData.rfc || ''
});

  // Buscar la habitación seleccionada para obtener su capacidad real
  const roomSelectedData = useMemo(() => {
    return rooms.find(r => r.id.toString() === formData.habitacion_id.toString());
  }, [rooms, formData.habitacion_id]);

  const maxCapacity = roomSelectedData ? CAPACIDADES[roomSelectedData.type] : 99;
  const isOverCapacity = formData.personas > maxCapacity;
  const isEjecutiva = roomSelectedData?.type === 'Ejecutiva';

  // Validación de mayoría de edad
  const isUnderage = useMemo(() => {
    if (!formData.fechaNacimiento) return false;
    const diff = Date.now() - new Date(formData.fechaNacimiento).getTime();
    const age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
    return age < 18;
  }, [formData.fechaNacimiento]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isOverCapacity || isUnderage || !formData.habitacion_id) return;
    onNext(formData); // Avanza al paso de pagos con los datos limpios
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Selección de Habitación */}
        <div className="space-y-1 col-span-2">
          <label className="text-sm font-semibold text-slate-700">Habitación a Asignar</label>
          <select
            name="habitacion_id"
            value={formData.habitacion_id}
            onChange={handleChange}
            required
            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="">Selecciona una habitación disponible...</option>
            
            {/*  SOLUCIÓN: Filtramos las disponibles O la que coincide con el ID que ya viene precargado */}
            {rooms
              .filter(r => r.status === 'disponible' || r.id.toString() === formData.habitacion_id?.toString())
              .map(r => (
                <option key={r.id} value={r.id}>
                  Hab. {r.id} ({r.type} - ${r.precio}/Noche) {r.status === 'reservada' ? ' (Tu Reserva)' : ''}
                </option>
              ))
            }
          </select>
        </div>

        {/* Nombre del Huésped */}
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-semibold text-slate-600">Nombre Completo del Huésped</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Ej. Juan Pérez"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Cantidad de Personas */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">No. de Personas</label>
          <input
            type="number"
            name="personas"
            min="1"
            value={formData.personas}
            onChange={(e) => setFormData(prev => ({ ...prev, personas: parseInt(e.target.value) || 1 }))}
            className={`w-full p-2.5 border rounded-xl bg-slate-50 outline-none text-sm ${isOverCapacity ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`}
          />
          {isOverCapacity && (
            <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
              <img src="/icons.svg#alert" className="w-3 h-3" alt="" /> Excede la capacidad máxima de {maxCapacity}.
            </p>
          )}
        </div>

        {/* Fecha de Nacimiento */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Fecha de Nacimiento</label>
          <input
            type="date"
            name="fechaNacimiento"
            value={formData.fechaNacimiento}
            onChange={handleChange}
            required
            className={`w-full p-2.5 border rounded-xl bg-slate-50 outline-none text-sm ${isUnderage ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`}
          />
          {isUnderage && (
            <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> El huésped debe ser mayor de edad (18+).
            </p>
          )}
        </div>

        {/* Calendario Entrada / Salida */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Fecha de Entrada</label>
          <input
            type="date"
            name="fechaEntrada"
            min={new Date().toISOString().split('T')[0]}
            value={formData.fechaEntrada}
            onChange={handleChange}
            required
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Fecha de Salida</label>
          <input
            type="date"
            name="fechaSalida"
            min={formData.fechaEntrada}
            value={formData.fechaSalida}
            onChange={handleChange}
            required
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm"
          />
        </div>

        {/* Teléfono y Email */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Teléfono de Contacto</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="10 dígitos corporativos"
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Correo Electrónico</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="huesped@empresa.com"
            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm"
          />
        </div>

        {/* Bloque Condicional Inyección de Campos Corporativos (HU Habitaciones Ejecutivas) */}
        {isEjecutiva && (
          <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl mt-2 animate-fade-in">
            <div className="col-span-2">
              <label className="text-xs font-bold text-amber-700 uppercase tracking-wider">Convenio Comercial Autorizado</label>
              <select
                name="convenio_id"
                value={formData.convenio_id}
                onChange={(e) => {
                  const id = e.target.value;
                  const targetConv = convenios.find(c => c.id.toString() === id);
                  setFormData(prev => ({
                    ...prev,
                    convenio_id: id,
                    empresa: targetConv ? targetConv.empresa : prev.empresa
                  }));
                }}
                className="w-full mt-1 p-2.5 border border-amber-200 rounded-xl bg-white text-sm outline-none"
              >
                <option value="">Ninguno / Tarifa Regular de Mostrador</option>
                {convenios.filter(c => c.estado === 'Activo').map(c => (
                  <option key={c.id} value={c.id}>{c.empresa} (Descuento: {c.descuento})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-amber-800">Empresa *</label>
              <input type="text" name="empresa" value={formData.empresa} onChange={handleChange} required className="w-full mt-1 p-2 border border-amber-200 rounded-lg text-sm bg-white outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-amber-800">Cargo del Ejecutivo *</label>
              <input type="text" name="cargo" value={formData.cargo} onChange={handleChange} required className="w-full mt-1 p-2 border border-amber-200 rounded-lg text-sm bg-white outline-none" placeholder="Ej. Gerente Regional" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-amber-800">RFC Corporativo Facturación *</label>
              <input type="text" name="rfc" value={formData.rfc} onChange={handleChange} required className="w-full mt-1 p-2 border border-amber-200 rounded-lg text-sm bg-white outline-none" placeholder="13 caracteres fiscales" />
            </div>
          </div>
        )}
      </div>

      {/* Botones de Control de Navegación del Wizard */}
      <div className="pt-4 flex gap-3 border-t border-slate-100 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 text-sm transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isOverCapacity || isUnderage || !formData.habitacion_id}
          className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar a Pago
        </button>
      </div>
    </form>
  );
}