import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, Key, ShieldCheck, Building2, LogOut, UserCircle } from 'lucide-react';

export default function App() {
  // Estado para manejar la vista actual (login o el dashboard de algún rol)
  const [currentView, setCurrentView] = useState('login');
  const [userRole, setUserRole] = useState(null);

  // Vistas disponibles: 'login', 'admin', 'gerente', 'empleado'

  const handleLogin = (role) => {
    setUserRole(role);
    setCurrentView(role);
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentView('login');
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 font-sans text-slate-100 overflow-x-hidden relative">
      
      {/* Elementos de fondo animados para darle vida a la pantalla */}
      {/* CAMBIO: Usamos "fixed inset-0" para que sea imposible que estiren la página */}
      <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="z-10 w-full max-w-md">
        {currentView === 'login' && <LoginForm onLogin={handleLogin} />}
        
        {currentView === 'admin' && (
          <DashboardPlaceholder 
            role="Administrador" 
            title="Panel de Administración y Reportes" 
            onLogout={handleLogout} 
            color="bg-purple-600"
          />
        )}
        
        {currentView === 'gerente' && (
          <DashboardPlaceholder 
            role="Gerente" 
            title="Gestión Corporativa y Convenios" 
            onLogout={handleLogout}
            color="bg-emerald-600"
          />
        )}
        
        {currentView === 'empleado' && (
          <DashboardPlaceholder 
            role="Empleado de Mostrador" 
            title="Gestión de Mostrador (Check-in/Check-out)" 
            onLogout={handleLogout}
            color="bg-amber-600"
          />
        )}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE DE LOGIN
// ==========================================
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [animateForm, setAnimateForm] = useState(false);

  useEffect(() => {
    // Pequeña animación de entrada al cargar el componente
    setAnimateForm(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Hacemos la petición real al backend de Flask
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Convertimos la respuesta a formato JSON
      const data = await response.json();

      // response.ok es true si el status es 200-299
      if (response.ok) {
        // (Opcional) Guardamos el token en localStorage para mantener la sesión
        localStorage.setItem('token', data.token);
        
        // Llamamos a la función de login pasándole el rol real que viene de la base de datos
        onLogin(data.rol);
      } else {
        // Si el backend devuelve un error (ej. 401 Credenciales inválidas), lo mostramos
        setError(data.error || 'Ocurrió un error al intentar iniciar sesión.');
      }
    } catch (err) {
      // Si el servidor de Flask está apagado o hay un problema de red
      setError('Error de conexión con el servidor. Verifica que el backend esté encendido.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`transition-all duration-700 transform ${animateForm ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      {/* Tarjeta Glassmorphism */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        
        {/* LOGO DEL HOTEL */}
        <div className="flex flex-col items-center mb-6">
          
          {/* La imagen ahora tiene su propio tamaño (w-80 h-auto) y el efecto hover */}
          <img 
            src="https://res.cloudinary.com/djwwe8i4n/image/upload/v1774884907/Copilot_20260330_091952_azezup.png" 
            alt="Logo Hotel Villa Lince"
            className="w-70 h-auto object-contain mb-2 transform hover:rotate-6 transition-transform duration-300" 
          />
          
          <p className="text-slate-400 text-sm">Portal de Colaboradores</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg mb-4 text-center animate-bounce">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Campo Correo/Usuario */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Usuario / Email corporativo</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-400 transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
                placeholder="ejemplo@hotel.com"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-400 transition-colors">
                <Key size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón de Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center space-x-2
              ${isLoading 
                ? 'bg-amber-600/70 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(245,158,11,0.3)]'
              }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>

        {/* Indicador de Seguridad (HU 1.4) */}
        <div className="mt-8 flex flex-col items-center justify-center border-t border-white/10 pt-4">
          <div className="flex items-center text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
            <ShieldCheck size={16} className="mr-2" />
            <span className="text-xs font-medium tracking-wide">Conexión Cifrada de Extremo a Extremo (SSL/TLS)</span>
          </div>
        </div>

      </div>

      {/* Instrucciones para el profesor/equipo */}
      <div className="mt-6 text-center text-slate-400 text-xs bg-black/20 p-3 rounded-lg backdrop-blur-sm border border-white/5">
        <p className="font-semibold text-slate-300 mb-1">Para pruebas (Mockup):</p>
        <p>Escribe <strong className="text-amber-400">admin</strong>@hotel.com para rol Administrador</p>
        <p>Escribe <strong className="text-amber-400">gerente</strong>@hotel.com para rol Gerente</p>
        <p>Escribe <strong className="text-amber-400">empleado</strong>@hotel.com para rol Empleado</p>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PLACEHOLDER PARA LOS DASHBOARDS
// ==========================================
function DashboardPlaceholder({ role, title, onLogout, color }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <div className={`transition-all duration-500 transform ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl text-center">
        
        <div className={`w-24 h-24 ${color} rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg`}>
          <UserCircle size={50} className="text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">{role}</h2>
        <div className="h-1 w-16 bg-amber-500 mx-auto rounded-full mb-6"></div>
        
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 mb-8">
          <p className="text-xl text-slate-200 font-medium mb-2">{title}</p>
          <p className="text-slate-400 text-sm">
            Esta es la pantalla inicial tras una autenticación exitosa. 
            El módulo de {role.toLowerCase()} está en desarrollo. <br/>
            <span className="text-amber-400 font-medium mt-2 block">Soporte próximamente.</span>
          </p>
        </div>

        <button 
          onClick={onLogout}
          className="flex items-center justify-center space-x-2 w-full py-3 bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/10 hover:border-red-500/50 rounded-xl transition-all duration-300"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
