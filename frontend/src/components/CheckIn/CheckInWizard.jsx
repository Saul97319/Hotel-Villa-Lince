import React, { useState } from 'react';
import PasoDatosHuesped from './PasoDatosHuesped';
import PasoPagos from './PasoPagos';

// 1. Agregamos "initialData" a las propiedades destructuradas
export default function CheckInWizard({ rooms, convenios, initialData, onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  
  // 2. Inicializamos el estado directamente con la información de la reserva express
  const [datosReserva, setDatosReserva] = useState(initialData || {});

  // Transición del Paso 1 al Paso 2
  const handleDatosCompletos = (datosValidados) => {
    setDatosReserva(datosValidados);
    setStep(2);
  };

  // Callback final cuando el pago es exitoso
  const handlePagoExitoso = () => {
    onComplete(); // Llama a la recarga de habitaciones en MostradorApp
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Barra de progreso UI */}
      <div className="flex items-center justify-center mb-6 space-x-4">
        <div className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${step === 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-emerald-100 text-emerald-700'}`}>
          1. Datos Huésped
        </div>
        <div className="h-1 w-12 bg-slate-200 rounded">
          <div className={`h-full bg-indigo-600 transition-all duration-500 ${step === 2 ? 'w-full' : 'w-0'}`}></div>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${step === 2 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
          2. Procesar Pago
        </div>
      </div>

      {/* Renderizado de Fases */}
      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <PasoDatosHuesped 
            rooms={rooms} 
            convenios={convenios} 
            onNext={handleDatosCompletos} 
            onCancel={onCancel}
            initialData={datosReserva} // Ahora este objeto sí viaja con los datos completos
          />
        )}
        
        {step === 2 && (
          <PasoPagos 
            datosReserva={datosReserva} 
            rooms={rooms}
            onBack={() => setStep(1)}
            onSuccess={handlePagoExitoso}
          />
        )}
      </div>
    </div>
  );
}