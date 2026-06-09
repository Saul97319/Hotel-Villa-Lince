import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, CreditCard, Smartphone, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function PasoPagos({ datosReserva, rooms, onBack, onSuccess }) {
  const [metodoPago, setMetodoPago] = useState('Efectivo'); 
  const [loading, setLoading] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  // Estados de EFECTIVO
  const [montoPagado, setMontoPagado] = useState('');

  // Estados de TARJETA (Simulación Local)
  const [tarjetaData, setTarjetaData] = useState({ numero: '', titular: '', vencimiento: '', cvv: '' });

  // Estados de TERMINAL POS
  const [posStatus, setPosStatus] = useState('IDLE'); // IDLE, WAITING, SUCCESS
  const [txId, setTxId] = useState(null);

  // --- CALCULADORA DE TARIFAS ---
  const roomInfo = useMemo(() => rooms.find(r => r.id.toString() === datosReserva.habitacion_id.toString()), [rooms, datosReserva]);
  
  const noches = useMemo(() => {
    if (!datosReserva.fechaEntrada || !datosReserva.fechaSalida) return 1;
    const diff = new Date(datosReserva.fechaSalida).getTime() - new Date(datosReserva.fechaEntrada).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
  }, [datosReserva.fechaEntrada, datosReserva.fechaSalida]);

  const totalAPagar = useMemo(() => {
    let subtotal = (roomInfo?.precio || 0) * noches;
    if (datosReserva.convenio_id) {
      subtotal = subtotal * 0.85; // 15% de descuento corporativo
    }
    return Math.round(subtotal * 100) / 100;
  }, [roomInfo, noches, datosReserva.convenio_id]);

  const cambioEfectivo = useMemo(() => {
    const pagado = parseFloat(montoPagado) || 0;
    return Math.max(0, Math.round((pagado - totalAPagar) * 100) / 100);
  }, [montoPagado, totalAPagar]);

  // --- VALIDACIÓN ALGORITMO DE LUHN (TARJETA) ---
  const esTarjetaValida = useMemo(() => {
    const num = tarjetaData.numero.replace(/\D/g, '');
    if (num.length !== 16) return false;
    
    let sum = 0;
    let debeDuplicar = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let digito = parseInt(num[i], 10);
      if (debeDuplicar) {
        digito *= 2;
        if (digito > 9) digito -= 9;
      }
      sum += digito;
      debeDuplicar = !debeDuplicar;
    }
    return sum % 10 === 0;
  }, [tarjetaData.numero]);

  const esFormularioTarjetaValido = useMemo(() => {
    if (!esTarjetaValida) return false;
    if (!tarjetaData.titular.trim()) return false;
    if (tarjetaData.cvv.length !== 3) return false;
    if (!tarjetaData.vencimiento.includes('/')) return false;
    
    const [mes, anio] = tarjetaData.vencimiento.split('/').map(v => parseInt(v, 10));
    if (!mes || !anio || mes < 1 || mes > 12) return false;
    
    const dateActual = new Date();
    const anioActual = parseInt(dateActual.getFullYear().toString().slice(-2), 10);
    const mesActual = dateActual.getMonth() + 1;
    if (anio < anioActual || (anio === anioActual && mes < mesActual)) return false;

    return true;
  }, [tarjetaData, esTarjetaValida]);

  // --- ACCIÓN: PAGOS INMEDIATOS ---
  const ejecutarPagoInmediato = async (metodo) => {
    setLoading(true);
    setErrorLocal('');
    try {
      const response = await fetch('http://localhost:5000/api/pagos/procesar_inmediato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metodo_pago: metodo, monto_total: totalAPagar, datos_reserva: datosReserva })
      });
      if (response.ok) onSuccess();
      else setErrorLocal('Fallo de persistencia transaccional.');
    } catch (err) {
      setErrorLocal('Error de comunicación con Flask.');
    } finally {
      setLoading(false);
    }
  };

  const handlePagoTarjetaLocal = (e) => {
    e.preventDefault();
    if (!esFormularioTarjetaValido) return;
    setLoading(true);
    setTimeout(() => {
      ejecutarPagoInmediato(`Tarjeta (Bancaria - ${tarjetaData.numero.slice(-4)})`);
    }, 8000);
  };

  // --- ACCIÓN: MANEJO TERMINAL POS ---
  const cancelarSolicitudTerminal = async () => {
    if (!txId) {
      setPosStatus('IDLE');
      return;
    }
    try {
      await fetch(`http://localhost:5000/api/terminal/cancelar/${txId}`, { method: 'POST' });
    } catch (err) {
      console.error("Error al notificar cancelación", err);
    }
    setPosStatus('IDLE');
    setTxId(null);
  };

  useEffect(() => {
    let intervalId;
    if (posStatus === 'WAITING' && txId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/terminal/estado/${txId}`);
          const data = await res.json();
          
          if (res.ok && data.estado === 'APROBADO') {
            // 1. Detener inmediatamente las consultas repetitivas al backend
            clearInterval(intervalId);
            
            // 2. Pintar la pantalla de verde de éxito comercial en el mostrador
            setPosStatus('SUCCESS');
            
            // 3. ⏱️ NUEVO: Retener el aviso por 7 segundos para auditoría visual del recepcionista
            setTimeout(() => {
              onSuccess(); // Concluye el Wizard y refresca la cuadrícula del hotel de forma definitiva
            }, 7000);

          } else if (data.estado === 'RECHAZADO') {
            clearInterval(intervalId);
            setPosStatus('IDLE');
            setTxId(null);
            setErrorLocal('Cobro cancelado o rechazado.');
          }
        } catch (err) {
          console.error("Error en polling.");
        }
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [posStatus, txId]);

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Resumen Comercial */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-sm font-medium">
        <div>
          <p className="text-slate-500">Habitación {datosReserva.habitacion_id} • {noches} Noche(s)</p>
          <p className="text-indigo-600 text-xs font-bold">{datosReserva.convenio_id ? '✓ Tarifa Corporativa Aplicada' : 'Tarifa Regular Estándar'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total a Cobrar</p>
          <p className="text-3xl font-black text-slate-900">${totalAPagar.toLocaleString()}</p>
        </div>
      </div>

      {errorLocal && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-bold rounded-xl text-center">
          {errorLocal}
        </div>
      )}

      {/* 1. SECTOR DE PESTAÑAS (SOLO BOTONES CUADRADOS LIMPIOS) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Elige el tipo de pago</label>
        <div className="grid grid-cols-3 gap-4 my-3">
          
          <button
            type="button"
            disabled={posStatus === 'WAITING' || loading}
            onClick={() => setMetodoPago('Efectivo')}
            className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 aspect-square group ${
              metodoPago === 'Efectivo' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-600 ring-4 ring-indigo-600/5' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            } disabled:opacity-40`}
          >
            <div className={`p-3 rounded-xl mb-2 ${metodoPago === 'Efectivo' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold tracking-wide">Efectivo</span>
          </button>

          <button
            type="button"
            disabled={posStatus === 'WAITING' || loading}
            onClick={() => setMetodoPago('Tarjeta')}
            className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 aspect-square group ${
              metodoPago === 'Tarjeta' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-600 ring-4 ring-indigo-600/5' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            } disabled:opacity-40`}
          >
            <div className={`p-3 rounded-xl mb-2 ${metodoPago === 'Tarjeta' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold tracking-wide">Tarjeta</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => setMetodoPago('Terminal')}
            className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 aspect-square group ${
              metodoPago === 'Terminal' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-600 ring-4 ring-indigo-600/5' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className={`p-3 rounded-xl mb-2 ${metodoPago === 'Terminal' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold tracking-wide">Terminal POS</span>
          </button>

        </div>
      </div>

      <hr className="border-slate-100 my-4" />

      {/* 2. AREA DE RENDERIZADO COMPLETAMENTE AFUERA DE LA FIGURA SUPERIOR */}
      
      {/* PANEL 1: EFECTIVO */}
      {metodoPago === 'Efectivo' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Monto Entregado por el Huésped</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">$</span>
              <input
                type="number"
                value={montoPagado}
                onChange={(e) => setMontoPagado(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 outline-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-600">Cambio a Regresar:</span>
            <span className={`text-xl font-black ${cambioEfectivo > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
              ${cambioEfectivo.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => ejecutarPagoInmediato('Efectivo')}
            disabled={loading || parseFloat(montoPagado) < totalAPagar || !montoPagado}
            className="w-full py-3.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Confirmar Pago Realizado en Efectivo
          </button>
        </div>
      )}

      {/* PANEL 2: TARJETA LOCAL */}
      {metodoPago === 'Tarjeta' && (
        <form onSubmit={handlePagoTarjetaLocal} className="space-y-4 animate-in fade-in duration-200">
          {loading ? (
            <div className="text-center py-6 space-y-3">
              <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700 animate-pulse">Procesando pago bancario (8s)...</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Número de Tarjeta</label>
                <input
                  type="text" maxLength="19" placeholder="0000-0000-0000-0000" value={tarjetaData.numero}
                  onChange={(e) => {
                    const l = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setTarjetaData(prev => ({ ...prev, numero: l.match(/.{1,4}/g)?.join('-') || l }));
                  }}
                  className={`w-full p-2.5 border rounded-xl bg-slate-50 font-mono text-sm tracking-wider outline-none ${tarjetaData.numero && !esTarjetaValida ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Nombre del Titular</label>
                <input
                  type="text" placeholder="COMO APARECE EN LA TARJETA" value={tarjetaData.titular}
                  onChange={(e) => setTarjetaData(prev => ({ ...prev, titular: e.target.value.toUpperCase() }))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Vencimiento (MM/AA)</label>
                  <input
                    type="text" maxLength="5" placeholder="MM/AA" value={tarjetaData.vencimiento}
                    onChange={(e) => {
                      const l = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setTarjetaData(prev => ({ ...prev, vencimiento: l.length > 2 ? `${l.slice(0, 2)}/${l.slice(2)}` : l }));
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-center font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">CVV</label>
                  <input
                    type="password" maxLength="3" placeholder="3 dígitos" value={tarjetaData.cvv}
                    onChange={(e) => setTarjetaData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-center font-mono"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={!esFormularioTarjetaValido}
                className="w-full py-3.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                Procesar Pago con Tarjeta Local
              </button>
            </>
          )}
        </form>
      )}

      {/* PANEL 3: TERMINAL POS CON BOTÓN DE CANCELACIÓN */}
      {metodoPago === 'Terminal' && (
        <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
          
          {posStatus === 'IDLE' && (
            <div className="space-y-4">
              {/* Bloque Opcional de Comisión */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-left">
                <label className="text-xs font-bold text-slate-500 uppercase block">Comisión Bancaria Opcional</label>
                <select
                  value={datosReserva.comisionPercent || '0'}
                  onChange={(e) => { datosReserva.comisionPercent = e.target.value; setMontoPagado(e.target.value); }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm outline-none font-medium text-slate-700"
                >
                  <option value="0">No aplica (0% adicional)</option>
                  <option value="3">3% - Tarjeta de Crédito Estándar</option>
                  <option value="5">5% - Tarjeta Internacional / Amex</option>
                </select>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Monto Neto a Enviar</p>
                <p className="text-3xl font-black text-indigo-900">
                  ${(totalAPagar * (1 + parseInt(datosReserva.comisionPercent || '0') / 100)).toFixed(2)}
                </p>
              </div>

              <button
                onClick={async () => {
                  const p = parseInt(datosReserva.comisionPercent || '0');
                  const finalCalculado = Math.round((totalAPagar * (1 + p / 100)) * 100) / 100;
                  setPosStatus('WAITING');
                  try {
                    const r = await fetch('http://localhost:5000/api/terminal/solicitar', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ monto_total: finalCalculado, datos_reserva: datosReserva })
                    });
                    const resData = await r.json();
                    if (r.ok) setTxId(resData.tx_id);
                    else { setPosStatus('IDLE'); setErrorLocal(resData.error); }
                  } catch { setPosStatus('IDLE'); setErrorLocal('Error de enlace.'); }
                }}
                className="w-full py-3.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-md"
              >
                Enviar Monto a la Terminal Física POS
              </button>
            </div>
          )}

          {posStatus === 'WAITING' && (
            <div className="space-y-4">
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                <div className="w-8 h-8 border-4 border-t-transparent border-amber-600 rounded-full animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-amber-800">Esperando acción en la terminal móvil...</h4>
                <p className="text-xs text-amber-700 leading-normal">
                  Monto enviado: <span className="font-bold">${(totalAPagar * (1 + parseInt(datosReserva.comisionPercent || '0') / 100)).toFixed(2)}</span>.<br />
                  Inserta o desliza la tarjeta en el celular.
                </p>
              </div>

              {/* 🔴 NUEVO: BOTÓN ROJO DE CANCELACIÓN INTEGRADO */}
              <button
                type="button"
                onClick={cancelarSolicitudTerminal}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shadow-rose-500/10"
              >
                <XCircle className="w-4 h-4" />
                Cancelar Operación de Terminal
              </button>
            </div>
          )}

          {posStatus === 'SUCCESS' && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-800">¡Pago Confirmado!</h4>
            </div>
          )}
        </div>
      )}

      {/* Botón de retorno general */}
      {posStatus !== 'WAITING' && !loading && (
        <button type="button" onClick={onBack} className="w-full text-center text-xs font-bold text-indigo-600 hover:underline pt-2">
          ← Regresar y modificar datos del huésped
        </button>
      )}
    </div>
  );
}