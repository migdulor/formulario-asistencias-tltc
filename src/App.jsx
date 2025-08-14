import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, Save, Download, TrendingUp, Shield, ChevronRight, Home, BarChart, FileText, Clock, MapPin, Trophy, X } from 'lucide-react';

// URL del Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxG6YJ03xM1VGlQCzmEGz3wkWgnjw9Sy4cKLCA91QPckIxsBbdS9eBh7PUxO6C-vOehug/exec';

// Componente principal con navegación
const App = () => {
  const [currentPage, setCurrentPage] = useState('asistencias');
  const [jugadoras, setJugadoras] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    cargarJugadoras();
  }, []);

  const cargarJugadoras = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${SCRIPT_URL}?action=read`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error('La respuesta no es un JSON válido');
      }
      if (result.code === 403 || result.message === 'permission error') {
        throw new Error('No tienes permisos para acceder a la API');
      }
      if (result.success && result.data) {
        const jugadorasExtraidas = result.data.slice(1).map((fila, index) => ({
          id: index + 1,
          idJugadora: fila[0]?.toString() || '',
          nombre: fila[1] || '',
          nombreCorto: fila[2] || '', // Nombre corto desde columna C
          division: fila[3] || ''
        })).filter(jugadora => jugadora.nombre);
        setJugadoras(jugadorasExtraidas);
      }
    } catch (error) {
      alert(error.message);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">TLTC Hockey 2025</h1>
                <p className="text-blue-200 text-sm">Sistema de Gestión de jugadoras</p>
              </div>
            </div>
          </div>
          
          {/* Navegación */}
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setCurrentPage('asistencias')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors min-w-max ${
                currentPage === 'asistencias' 
                  ? 'bg-blue-700 text-white' 
                  : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Asistencias
            </button>
            <button
              onClick={() => setCurrentPage('estadisticas')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors min-w-max ${
                currentPage === 'estadisticas' 
                  ? 'bg-blue-700 text-white' 
                  : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
              }`}
            >
              <BarChart className="w-4 h-4" />
              Estadísticas
            </button>
            <button
              onClick={() => setCurrentPage('formacion')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors min-w-max ${
                currentPage === 'formacion' 
                  ? 'bg-blue-700 text-white' 
                  : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Formación
            </button>
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentPage === 'asistencias' && <PaginaAsistencias jugadoras={jugadoras} />}
        {currentPage === 'estadisticas' && <PaginaEstadisticas jugadoras={jugadoras} />}
        {currentPage === 'formacion' && <PaginaFormacion jugadoras={jugadoras} />}
      </main>
    </div>
  );
};

// Página de Asistencias
const PaginaAsistencias = ({ jugadoras: jugadorasProps }) => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [divisionFiltro, setDivisionFiltro] = useState('todas');
  const [asistencias, setAsistencias] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [jugadoras, setJugadoras] = useState(jugadorasProps);
  const [cargandoAsistencias, setCargandoAsistencias] = useState(false);

  useEffect(() => {
    setJugadoras(jugadorasProps);
    cargarAsistenciasFecha(fechaSeleccionada);
  }, [jugadorasProps]);

  useEffect(() => {
    cargarAsistenciasFecha(fechaSeleccionada);
  }, [fechaSeleccionada]);

  const jugadorasFiltradas = jugadoras.filter(jugadora => 
    divisionFiltro === 'todas' || jugadora.division === divisionFiltro
  );

  const cargarAsistenciasFecha = async (fecha) => {
    try {
      setCargandoAsistencias(true);
      const params = new URLSearchParams({
        action: 'readByDate',
        fecha: fecha
      });
      
      const response = await fetch(`${SCRIPT_URL}?${params.toString()}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.asistencias) {
          const nuevasAsistencias = {};
          Object.keys(result.asistencias).forEach(jugadoraId => {
            const estado = result.asistencias[jugadoraId];
            switch (estado) {
              case 'P': nuevasAsistencias[jugadoraId] = 'presente'; break;
              case 'A': nuevasAsistencias[jugadoraId] = 'ausente'; break;
              case 'T': nuevasAsistencias[jugadoraId] = 'tardanza'; break;
            }
          });
          setAsistencias(nuevasAsistencias);
        } else {
          setAsistencias({});
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargandoAsistencias(false);
    }
  };

  const handleAsistenciaChange = (jugadoraId, estado) => {
    setAsistencias(prev => ({
      ...prev,
      [jugadoraId]: estado
    }));
  };

  const marcarTodas = (estado) => {
    const nuevasAsistencias = {};
    jugadorasFiltradas.forEach(jugadora => {
      nuevasAsistencias[jugadora.idJugadora] = estado;
    });
    setAsistencias(prev => ({ ...prev, ...nuevasAsistencias }));
  };

  const guardarEnGoogleSheets = async () => {
    try {
      setIsLoading(true);
      setMensaje('💾 Guardando asistencias...');
      // ...existing code para preparar asistenciasData...
      if (Object.keys(asistenciasData).length === 0) {
        setMensaje('⚠️ No hay asistencias marcadas');
        setIsLoading(false);
        return;
      }
      const params = new URLSearchParams({
        action: 'readByDate',
        fecha: fecha
      });
      const response = await fetch(`${SCRIPT_URL}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error('La respuesta no es un JSON válido');
      }
      if (result.code === 403 || result.message === 'permission error') {
        throw new Error('No tienes permisos para acceder a la API');
      }
      if (result.success && result.asistencias) {
        const nuevasAsistencias = {};
        Object.keys(result.asistencias).forEach(jugadoraId => {
          const estado = result.asistencias[jugadoraId];
          switch (estado) {
            case 'P': nuevasAsistencias[jugadoraId] = 'presente'; break;
            case 'A': nuevasAsistencias[jugadoraId] = 'ausente'; break;
            case 'T': nuevasAsistencias[jugadoraId] = 'tardanza'; break;
          }
        });
        setAsistencias(nuevasAsistencias);
      }
    } catch (error) {
      alert(error.message);
      console.error('Error:', error);
    }
  };

  const contarAsistencias = () => {
    const presentes = Object.values(asistencias).filter(e => e === 'presente').length;
    const ausentes = Object.values(asistencias).filter(e => e === 'ausente').length;
    const tardanzas = Object.values(asistencias).filter(e => e === 'tardanza').length;
    return { presentes, ausentes, tardanzas };
  };

  const { presentes, ausentes, tardanzas } = contarAsistencias();

  return (
    <div className="space-y-6">
      {mensaje && (
        <div className={`p-4 rounded-lg ${
          mensaje.includes('❌') || mensaje.includes('⚠️') 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {mensaje}
        </div>
      )}

      <div className="bg-white p-4 md:p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              División
            </label>
            <select
              value={divisionFiltro}
              onChange={(e) => setDivisionFiltro(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="todas">Todas</option>
              <option value="7ma">7ma División</option>
              <option value="6ta">6ta División</option>
            </select>
          </div>
          <div className="flex items-end gap-2 col-span-2">
            <button
              onClick={() => marcarTodas('presente')}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex-1"
            >
              ✓ Todas
            </button>
            <button
              onClick={() => marcarTodas('ausente')}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex-1"
            >
              ✗ Todas
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-800">{presentes}</div>
          <div className="text-sm text-green-600">Presentes</div>
        </div>
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-800">{ausentes}</div>
          <div className="text-sm text-red-600">Ausentes</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-800">{tardanzas}</div>
          <div className="text-sm text-yellow-600">Tardanzas</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {cargandoAsistencias ? (
            <div className="p-8 text-center text-gray-500">
              Cargando asistencias...
            </div>
          ) : jugadorasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay jugadoras en esta división
            </div>
          ) : (
            jugadorasFiltradas.map((jugadora) => (
              <div key={jugadora.id} className="px-4 py-3 border-b hover:bg-gray-50 flex flex-col sm:flex-row justify-between">
                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    jugadora.division === '7ma' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}>
                    {jugadora.idJugadora}
                  </div>
                  <div>
                    <div className="font-medium">{jugadora.nombre}</div>
                    <div className="text-sm text-gray-500">{jugadora.division}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAsistenciaChange(jugadora.idJugadora, 'presente')}
                    className={`px-3 py-1 rounded text-sm flex-1 min-w-[90px] ${
                      asistencias[jugadora.idJugadora] === 'presente'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 hover:bg-green-100'
                    }`}
                  >
                    Presente
                  </button>
                  <button
                    onClick={() => handleAsistenciaChange(jugadora.idJugadora, 'tardanza')}
                    className={`px-3 py-1 rounded text-sm flex-1 min-w-[90px] ${
                      asistencias[jugadora.idJugadora] === 'tardanza'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 hover:bg-yellow-100'
                    }`}
                  >
                    Tardanza
                  </button>
                  <button
                    onClick={() => handleAsistenciaChange(jugadora.idJugadora, 'ausente')}
                    className={`px-3 py-1 rounded text-sm flex-1 min-w-[90px] ${
                      asistencias[jugadora.idJugadora] === 'ausente'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 hover:bg-red-100'
                    }`}
                  >
                    Ausente
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={guardarEnGoogleSheets}
        disabled={isLoading}
        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Guardando...' : 'Guardar en Google Sheets'}
      </button>
    </div>
  );
};

// Página de Estadísticas
const PaginaEstadisticas = ({ jugadoras }) => {
  const [stats, setStats] = useState({});
  const [divisionFiltro, setDivisionFiltro] = useState('todas');
  const [isLoading, setIsLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [asistenciasPorFecha, setAsistenciasPorFecha] = useState([]);

  useEffect(() => {
    cargarEstadisticas();
    cargarAsistenciasPorFecha();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${SCRIPT_URL}?action=getStats`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.stats || {});
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarAsistenciasPorFecha = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        action: 'getAttendanceByDateRange',
        start: fechaInicio,
        end: fechaFin
      });
      
      const response = await fetch(`${SCRIPT_URL}?${params.toString()}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAsistenciasPorFecha(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarAsistenciasPorFecha();
  }, [fechaInicio, fechaFin]);

  const jugadorasFiltradas = jugadoras.filter(j => 
    divisionFiltro === 'todas' || j.division === divisionFiltro
  );

  const calcularPorcentaje = (jugadoraId) => {
    const stat = stats[jugadoraId];
    if (!stat || stat.total === 0) return 0;
    return Math.round((stat.presentes / stat.total) * 100);
  };

  // Calcular estadísticas por división
  const calcularEstadisticasDivision = (division) => {
    const jugadorasDivision = jugadoras.filter(j => j.division === division);
    let totalPresentes = 0;
    let totalAusentes = 0;
    let totalTardanzas = 0;
    let totalEntrenamientos = 0;

    jugadorasDivision.forEach(jugadora => {
      const stat = stats[jugadora.idJugadora];
      if (stat) {
        totalPresentes += stat.presentes || 0;
        totalAusentes += stat.ausentes || 0;
        totalTardanzas += stat.tardanzas || 0;
        totalEntrenamientos = Math.max(totalEntrenamientos, stat.total || 0);
      }
    });

    const totalAsistencias = totalPresentes + totalAusentes + totalTardanzas;
    const porcentajeAsistencia = totalAsistencias > 0 
      ? Math.round((totalPresentes / totalAsistencias) * 100) 
      : 0;

    return {
      totalPresentes,
      totalAusentes,
      totalTardanzas,
      totalEntrenamientos,
      porcentajeAsistencia,
      jugadoras: jugadorasDivision.length
    };
  };

  const stats7ma = calcularEstadisticasDivision('7ma');
  const stats6ta = calcularEstadisticasDivision('6ta');

  // Agrupar asistencias por fecha y división
  const asistenciasAgrupadas = asistenciasPorFecha.reduce((acc, item) => {
    if (!acc[item.fecha]) {
      acc[item.fecha] = {
        '7ma': { presentes: 0, total: 0 },
        '6ta': { presentes: 0, total: 0 }
      };
    }
    
    if (item.division === '7ma') {
      acc[item.fecha]['7ma'].presentes += item.presentes;
      acc[item.fecha]['7ma'].total += item.total;
    } else if (item.division === '6ta') {
      acc[item.fecha]['6ta'].presentes += item.presentes;
      acc[item.fecha]['6ta'].total += item.total;
    }
    
    return acc;
  }, {});

  // Convertir a array para gráfico
  const datosGrafico = Object.keys(asistenciasAgrupadas)
    .sort()
    .map(fecha => {
      const datos = asistenciasAgrupadas[fecha];
      return {
        fecha,
        '7ma': datos['7ma'].total > 0 
          ? Math.round((datos['7ma'].presentes / datos['7ma'].total) * 100) 
          : 0,
        '6ta': datos['6ta'].total > 0 
          ? Math.round((datos['6ta'].presentes / datos['6ta'].total) * 100) 
          : 0
      };
    });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Estadísticas de Asistencia</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              División
            </label>
            <select
              value={divisionFiltro}
              onChange={(e) => setDivisionFiltro(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="todas">Todas las divisiones</option>
              <option value="7ma">7ma División</option>
              <option value="6ta">6ta División</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={cargarAsistenciasPorFecha}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Gráfico de asistencias por fecha */}
        <div className="mb-8">
          <h3 className="font-bold mb-4">Asistencia por Fecha</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-end h-40 gap-2 md:gap-4">
              {datosGrafico.map((dato, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {dato.fecha.split('-')[2]}
                  </div>
                  <div className="flex items-end justify-center gap-1 w-full h-32">
                    <div 
                      className="w-full bg-blue-500 rounded-t-md relative"
                      style={{ height: `${dato['7ma']}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-blue-700">
                        {dato['7ma']}%
                      </div>
                    </div>
                    <div 
                      className="w-full bg-purple-500 rounded-t-md relative"
                      style={{ height: `${dato['6ta']}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-purple-700">
                        {dato['6ta']}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 mr-2"></div>
                <span className="text-sm">7ma División</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-500 mr-2"></div>
                <span className="text-sm">6ta División</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas individuales */}
        <div className="space-y-4">
          {jugadorasFiltradas.map(jugadora => {
            const porcentaje = calcularPorcentaje(jugadora.idJugadora);
            const stat = stats[jugadora.idJugadora] || { presentes: 0, ausentes: 0, tardanzas: 0, total: 0 };
            
            return (
              <div key={jugadora.id} className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{jugadora.nombre}</span>
                  <span className="text-sm text-gray-600">
                    {porcentaje}% asistencia
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all duration-500 flex items-center justify-center text-white text-xs"
                    style={{ width: `${porcentaje}%` }}
                  >
                    {porcentaje > 10 && `${porcentaje}%`}
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-600 flex-wrap">
                  <span>✓ {stat.presentes} presentes</span>
                  <span>⏰ {stat.tardanzas} tardanzas</span>
                  <span>✗ {stat.ausentes} ausentes</span>
                  <span>Total: {stat.total} entrenamientos</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen por división */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4 text-blue-600">7ma División</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Jugadoras:</span>
              <span className="font-medium">{stats7ma.jugadoras}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">% Asistencia promedio:</span>
              <span className="font-medium">{stats7ma.porcentajeAsistencia}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total entrenamientos:</span>
              <span className="font-medium">{stats7ma.totalEntrenamientos}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4 text-purple-600">6ta División</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Jugadoras:</span>
              <span className="font-medium">{stats6ta.jugadoras}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">% Asistencia promedio:</span>
              <span className="font-medium">{stats6ta.porcentajeAsistencia}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total entrenamientos:</span>
              <span className="font-medium">{stats6ta.totalEntrenamientos}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Página de Formación
const PaginaFormacion = ({ jugadoras }) => {
  const [divisionFormacion, setDivisionFormacion] = useState('7ma');
  const [formacion, setFormacion] = useState({
    fecha: new Date().toISOString().split('T')[0],
    equipoContrario: '',
    lugar: '',
    horaCitacion: '',
    horaPartido: '',
    division: '7ma',
    arquera: null,
    defensorDerecha: null,
    defensorIzquierda: null,
    central1: null,
    central2: null,
    volanteDerecho: null,
    volanteIzquierdo: null,
    volanteCentral: null,
    delanteroDerecha: null,
    delanteroIzquierda: null,
    delanteroPunta: null,
    suplente1: null,
    suplente2: null,
    suplente3: null,
    suplente4: null,
    suplente5: null,
    suplente6: null,
    suplente7: null,
    suplente8: null,
    suplente9: null
  });

  const [jugadoraSeleccionada, setJugadoraSeleccionada] = useState(null);
  const [posicionSeleccionada, setPosicionSeleccionada] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const canchaRef = useRef(null);

  useEffect(() => {
    setFormacion(prev => ({
      ...prev,
      division: divisionFormacion
    }));
  }, [divisionFormacion]);

  const posiciones = [
    { key: 'arquera', nombre: 'Arquera', x: 50, y: 90 },
    { key: 'defensorDerecha', nombre: 'Def. Derecha', x: 75, y: 70 },
    { key: 'defensorIzquierda', nombre: 'Def. Izquierda', x: 25, y: 70 },
    { key: 'central1', nombre: 'Central 1', x: 40, y: 65 },
    { key: 'central2', nombre: 'Central 2', x: 60, y: 65 },
    { key: 'volanteDerecho', nombre: 'Vol. Derecho', x: 75, y: 45 },
    { key: 'volanteIzquierdo', nombre: 'Vol. Izquierdo', x: 25, y: 45 },
    { key: 'volanteCentral', nombre: 'Vol. Central', x: 50, y: 40 },
    { key: 'delanteroDerecha', nombre: 'Del. Derecha', x: 70, y: 20 },
    { key: 'delanteroIzquierda', nombre: 'Del. Izquierda', x: 30, y: 20 },
    { key: 'delanteroPunta', nombre: 'Del. Punta', x: 50, y: 15 }
  ];

  const suplentes = Array.from({ length: 9 }, (_, i) => ({
    key: `suplente${i + 1}`,
    nombre: `Suplente ${i + 1}`
  }));

  const jugadorasDivision = jugadoras.filter(j => 
    j.division === divisionFormacion && 
    !Object.values(formacion).some(val => val === j.nombre)
  );

  const otrasJugadoras = jugadoras.filter(j => 
    j.division !== divisionFormacion && 
    !Object.values(formacion).some(val => val === j.nombre)
  );

  const seleccionarJugadora = (posicionKey) => {
    setPosicionSeleccionada(posicionKey);
  };

  const asignarJugadora = (jugadora) => {
    if (posicionSeleccionada) {
      setFormacion(prev => ({
        ...prev,
        [posicionSeleccionada]: jugadora.nombre
      }));
      setPosicionSeleccionada(null);
    }
  };

  const quitarJugadora = (posicionKey) => {
    setFormacion(prev => ({
      ...prev,
      [posicionKey]: null
    }));
  };

  const guardarFormacion = async () => {
    try {
      const params = new URLSearchParams({
        action: 'savePartido',
        partido: JSON.stringify(formacion)
      });
      
      const response = await fetch(`${SCRIPT_URL}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error('La respuesta no es un JSON válido');
      }
      if (result.code === 403 || result.message === 'permission error') {
        throw new Error('No tienes permisos para acceder a la API');
      }
      if (result.success) {
        setMensaje('✅ Formación guardada exitosamente');
        setTimeout(() => setMensaje(''), 3000);
      }
    } catch (error) {
      alert(error.message);
      console.error('Error:', error);
      setMensaje('❌ Error al guardar la formación');
    }
  };

  const exportarTexto = () => {
    let texto = `FORMACIÓN - EQUIPO HOCKEY ${formacion.division.toUpperCase()}\n`;
    texto += `========================\n\n`;
    texto += `Fecha: ${formacion.fecha}\n`;
    texto += `Rival: ${formacion.equipoContrario}\n`;
    texto += `Lugar: ${formacion.lugar}\n`;
    texto += `Citación: ${formacion.horaCitacion}\n`;
    texto += `Partido: ${formacion.horaPartido}\n\n`;
    texto += `TITULARES\n`;
    texto += `---------\n`;
    posiciones.forEach(pos => {
      texto += `${pos.nombre}: ${formacion[pos.key] || 'Sin asignar'}\n`;
    });
    texto += `\nSUPLENTES\n`;
    texto += `---------\n`;
    suplentes.forEach(sup => {
      if (formacion[sup.key]) {
        texto += `${sup.nombre}: ${formacion[sup.key]}\n`;
      }
    });

    const blob = new Blob([texto], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formacion_${formacion.fecha}_${formacion.equipoContrario || 'partido'}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportarImagen = () => {
    if (!canchaRef.current) return;
    
    setVistaPrevia(true);
    setTimeout(() => {
      html2canvas(canchaRef.current).then(canvas => {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `formacion_${formacion.fecha}_${formacion.equipoContrario || 'partido'}.png`;
        link.click();
        setVistaPrevia(false);
      });
    }, 500);
  };

  const getNombreCorto = (nombreCompleto) => {
    if (!nombreCompleto) return '';
    const jugadora = jugadoras.find(j => j.nombre === nombreCompleto);
    return jugadora?.nombreCorto || nombreCompleto.split(' ')[0];
  };

  return (
    <div className="space-y-6">
      {mensaje && (
        <div className={`p-4 rounded-lg ${
          mensaje.includes('❌') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {mensaje}
        </div>
      )}

      {/* Datos del partido */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Datos del Partido</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              División
            </label>
            <select
              value={divisionFormacion}
              onChange={(e) => setDivisionFormacion(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="7ma">7ma División</option>
              <option value="6ta">6ta División</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={formacion.fecha}
              onChange={(e) => setFormacion(prev => ({ ...prev, fecha: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipo Contrario
            </label>
            <input
              type="text"
              value={formacion.equipoContrario}
              onChange={(e) => setFormacion(prev => ({ ...prev, equipoContrario: e.target.value }))}
              className="w-full p-2 border rounded"
              placeholder="Universitario"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lugar
            </label>
            <input
              type="text"
              value={formacion.lugar}
              onChange={(e) => setFormacion(prev => ({ ...prev, lugar: e.target.value }))}
              className="w-full p-2 border rounded"
              placeholder="TLTC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora Citación
            </label>
            <input
              type="time"
              value={formacion.horaCitacion}
              onChange={(e) => setFormacion(prev => ({ ...prev, horaCitacion: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora Partido
            </label>
            <input
              type="time"
              value={formacion.horaPartido}
              onChange={(e) => setFormacion(prev => ({ ...prev, horaPartido: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cancha de hockey */}
        <div className="bg-white p-6 rounded-lg shadow" ref={canchaRef}>
          <h3 className="text-lg font-bold mb-4">Formación Titular</h3>
          <div className="relative bg-green-500 rounded-lg p-4" style={{ minHeight: '500px' }}>
            {/* Líneas de la cancha */}
            <div className="absolute inset-x-4 top-1/2 border-t-2 border-white opacity-50"></div>
            <div className="absolute left-1/2 top-4 bottom-4 border-l-2 border-white opacity-50"></div>
            
            {/* Área grande */}
            <div className="absolute bottom-0 left-1/4 right-1/4 h-24 border-2 border-white opacity-50 rounded-t-full"></div>
            
            {/* Área chica */}
            <div className="absolute bottom-0 left-1/3 right-1/3 h-16 border-2 border-white opacity-50 rounded-t-full"></div>

            {/* Posiciones */}
            {posiciones.map(pos => (
              <div
                key={pos.key}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onClick={() => seleccionarJugadora(pos.key)}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  posicionSeleccionada === pos.key
                    ? 'bg-yellow-400 text-black scale-110'
                    : formacion[pos.key]
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700'
                }`}>
                  {formacion[pos.key] ? (
                    <div className="text-center">
                      <div className="text-[10px]">{getNombreCorto(formacion[pos.key])}</div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-center">{pos.nombre}</div>
                  )}
                </div>
                {formacion[pos.key] && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      quitarJugadora(pos.key);
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lista de jugadoras y suplentes */}
        <div className="space-y-6">
          {/* Jugadoras disponibles */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">
              {posicionSeleccionada ? `Seleccionar para: ${posiciones.find(p => p.key === posicionSeleccionada)?.nombre || suplentes.find(s => s.key === posicionSeleccionada)?.nombre}` : 'Jugadoras Disponibles'}
            </h3>
            
            <h4 className="font-medium mb-2">Jugadoras de {divisionFormacion}</h4>
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
              {jugadorasDivision.length === 0 ? (
                <div className="text-center text-gray-500 py-2">
                  Todas las jugadoras están asignadas
                </div>
              ) : (
                jugadorasDivision.map(jugadora => (
                  <div
                    key={jugadora.id}
                    onClick={() => asignarJugadora(jugadora)}
                    className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                      posicionSeleccionada 
                        ? 'hover:bg-blue-100 border border-gray-200'
                        : 'bg-gray-50 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="text-sm">{jugadora.nombre}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      jugadora.division === '7ma' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {jugadora.division}
                    </span>
                  </div>
                ))
              )}
            </div>

            <h4 className="font-medium mb-2">Otras jugadoras</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {otrasJugadoras.map(jugadora => (
                <div
                  key={jugadora.id}
                  onClick={() => asignarJugadora(jugadora)}
                  className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                    posicionSeleccionada 
                      ? 'hover:bg-blue-100 border border-gray-200'
                      : 'bg-gray-50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span className="text-sm">{jugadora.nombre}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    jugadora.division === '7ma' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {jugadora.division}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suplentes */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Suplentes</h3>
            <div className="grid grid-cols-3 gap-2">
              {suplentes.map(sup => (
                <div
                  key={sup.key}
                  onClick={() => seleccionarJugadora(sup.key)}
                  className={`p-2 rounded text-center cursor-pointer text-sm ${
                    posicionSeleccionada === sup.key
                      ? 'bg-yellow-400 text-black'
                      : formacion[sup.key]
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {formacion[sup.key] ? getNombreCorto(formacion[sup.key]) : sup.nombre}
                  {formacion[sup.key] && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        quitarJugadora(sup.key);
                      }}
                      className="ml-2 text-red-300 hover:text-red-500"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vista previa */}
      {vistaPrevia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Vista Previa - Formación</h2>
                <button
                  onClick={() => setVistaPrevia(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Encabezado estilo presentación */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">TLTC HOCKEY</h1>
                    <p className="text-xl">{formacion.division.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formacion.horaPartido || '00:00'}</p>
                    <p className="text-lg">{formacion.equipoContrario || 'Rival'}</p>
                  </div>
                </div>
              </div>

              {/* Información del partido */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-bold">{formacion.fecha}</p>
                </div>
                <div className="text-center">
                  <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-600">Lugar</p>
                  <p className="font-bold">{formacion.lugar || 'Por definir'}</p>
                </div>
                <div className="text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-600">Citación</p>
                  <p className="font-bold">{formacion.horaCitacion || 'Por definir'}</p>
                </div>
              </div>

              {/* Formación */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-3 text-blue-600">TITULARES</h3>
                  <div className="space-y-2">
                    {posiciones.map((pos, index) => (
                      <div key={pos.key} className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">{formacion[pos.key] || 'Por definir'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3 text-gray-600">SUPLENTES</h3>
                  <div className="space-y-2">
                    {suplentes.filter(sup => formacion[sup.key]).map((sup, index) => (
                      <div key={sup.key} className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 12}
                        </span>
                        <span className="text-sm font-medium">{formacion[sup.key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={exportarTexto}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Exportar como Texto
                </button>
                <button
                  onClick={exportarImagen}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Exportar como Imagen
                </button>
                <button
                  onClick={() => setVistaPrevia(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={guardarFormacion}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          Guardar Formación
        </button>
        <button
          onClick={() => setVistaPrevia(true)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <FileText className="w-5 h-5" />
          Vista Previa
        </button>
        <button
          onClick={exportarTexto}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Exportar Texto
        </button>
        <button
          onClick={exportarImagen}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Exportar Imagen
        </button>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-bold text-blue-900 mb-2">📝 Instrucciones</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Haz clic en una posición en la cancha o en un lugar de suplente</li>
          <li>• Luego selecciona la jugadora de la lista</li>
          <li>• Puedes quitar jugadoras con el botón × </li>
          <li>• Guarda la formación cuando esté completa</li>
          <li>• Exporta como texto o imagen para compartir</li>
        </ul>
      </div>
    </div>
  );
};

export default App;