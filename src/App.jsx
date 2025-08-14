import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, Save, Download, TrendingUp, Shield, ChevronRight, Home, BarChart, FileText, Clock, MapPin, Trophy, X } from 'lucide-react';

// URL del Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxG6YJ03xM1VGlQCzmEGz3wkWgnjw9Sy4cKLCA91QPckIxsBbdS9eBh7PUxO6C-vOehug/exec';

// Componente principal con navegación
const App = () => {
  const [currentPage, setCurrentPage] = useState('asistencias');
  const [jugadoras, setJugadoras] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState('');

  useEffect(() => {
    cargarJugadoras();
  }, []);

  const cargarJugadoras = async () => {
    try {
      setIsLoading(true);
      setErrorInfo('');
      console.log('🔄 Iniciando carga de jugadoras...');
      console.log('📡 URL de script:', SCRIPT_URL);
      
      const requestUrl = `${SCRIPT_URL}?action=read&timestamp=${Date.now()}`;
      console.log('🌐 URL completa:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response statusText:', response.statusText);
      console.log('📊 Response ok:', response.ok);
      console.log('📊 Response type:', response.type);
      console.log('📊 Response url:', response.url);
      
      // Verificar headers de respuesta
      console.log('📋 Response headers:');
      for (let [key, value] of response.headers.entries()) {
        console.log(`   ${key}: ${value}`);
      }
      
      if (!response.ok) {
        throw new Error(`❌ HTTP error: ${response.status} - ${response.statusText}`);
      }
      
      // Obtener texto de respuesta
      const text = await response.text();
      console.log('📄 Response text length:', text.length);
      console.log('📄 Response text (first 500 chars):', text.substring(0, 500));
      console.log('📄 Response text (last 100 chars):', text.substring(Math.max(0, text.length - 100)));
      
      // Verificar si la respuesta está vacía
      if (!text || text.trim() === '') {
        throw new Error('❌ La respuesta del servidor está vacía. Verifica que el Google Apps Script esté funcionando correctamente.');
      }
      
      // Verificar si la respuesta contiene HTML (error común)
      if (text.trim().startsWith('<')) {
        console.error('🚨 La respuesta parece ser HTML, no JSON:', text.substring(0, 200));
        throw new Error('❌ El servidor devolvió HTML en lugar de JSON. Esto indica un problema con el Google Apps Script o sus permisos.');
      }
      
      let result;
      try {
        result = JSON.parse(text);
        console.log('✅ JSON parseado exitosamente:', result);
      } catch (parseError) {
        console.error('❌ Error al parsear JSON:', parseError);
        console.error('📄 Texto que causó el error:', text);
        throw new Error(`❌ La respuesta no es un JSON válido. Error: ${parseError.message}. Respuesta recibida: "${text.substring(0, 100)}..."`);
      }
      
      // Verificar estructura de respuesta
      console.log('🔍 Analizando respuesta:', {
        success: result.success,
        message: result.message,
        code: result.code,
        hasData: !!result.data,
        dataType: typeof result.data,
        dataLength: Array.isArray(result.data) ? result.data.length : 'no es array'
      });
      
      if (result.code === 403 || result.message === 'permission error') {
        throw new Error('🚫 No tienes permisos para acceder a la API. Verifica que el script esté publicado como "Cualquier persona" puede ejecutar.');
      }
      
      if (!result.success) {
        throw new Error(`❌ Error del servidor: ${result.message || 'Error desconocido'}`);
      }
      
      if (result.success && result.data) {
        console.log('📊 Data received:', result.data);
        
        // Verificar que result.data sea un array
        if (!Array.isArray(result.data)) {
          console.error('❌ Los datos no son un array:', typeof result.data, result.data);
          throw new Error('❌ Los datos recibidos no tienen el formato esperado (no es un array)');
        }
        
        console.log(`📊 Datos recibidos: ${result.data.length} filas`);
        
        if (result.data.length === 0) {
          throw new Error('❌ La hoja de Google Sheets está vacía');
        }
        
        // Mostrar headers
        console.log('📋 Headers de la hoja:', result.data[0]);
        
        // Extraer jugadoras (saltamos la primera fila que contiene headers)
        const jugadorasExtraidas = result.data.slice(1).map((fila, index) => {
          console.log(`📝 Procesando fila ${index + 1}:`, fila);
          return {
            id: index + 1,
            idJugadora: fila[0]?.toString() || '',
            nombre: fila[1] || '',
            nombreCorto: fila[2] || '', // Nombre corto desde columna C
            division: fila[3] || ''
          };
        }).filter(jugadora => {
          const esValida = jugadora.nombre && jugadora.nombre.trim() !== '';
          if (!esValida) {
            console.log('⚠️ Jugadora filtrada (nombre vacío):', jugadora);
          }
          return esValida;
        });
        
        console.log('✅ Jugadoras extraídas:', jugadorasExtraidas);
        setJugadoras(jugadorasExtraidas);
        setErrorInfo('');
        
        if (jugadorasExtraidas.length === 0) {
          setErrorInfo('⚠️ No se encontraron jugadoras válidas en los datos. Verifica que la hoja tenga datos en las columnas correctas.');
        }
      } else {
        console.error('❌ Respuesta sin datos válidos:', result);
        throw new Error('❌ La respuesta no contiene datos válidos');
      }
    } catch (error) {
      console.error('💥 Error detallado:', error);
      setErrorInfo(error.message);
      alert(`❌ Error al cargar jugadoras: ${error.message}`);
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
            <div className="text-right">
              <p className="text-sm">
                {isLoading ? '🔄 Cargando...' : `✅ ${jugadoras.length} jugadoras cargadas`}
              </p>
              <button 
                onClick={cargarJugadoras}
                disabled={isLoading}
                className="text-xs text-blue-200 hover:text-white underline disabled:opacity-50"
              >
                🔄 Recargar datos
              </button>
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
        {/* Mensajes de error/estado */}
        {(jugadoras.length === 0 && !isLoading) && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <strong>⚠️ Atención:</strong> No se han cargado las jugadoras. 
            <button 
              onClick={cargarJugadoras}
              className="ml-2 underline hover:no-underline"
            >
              🔄 Intentar cargar nuevamente
            </button>
          </div>
        )}

        {errorInfo && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>❌ Error:</strong> {errorInfo}
            <details className="mt-2">
              <summary className="cursor-pointer text-sm underline">Ver detalles técnicos</summary>
              <div className="mt-2 text-xs font-mono bg-red-50 p-2 rounded">
                <p><strong>URL del script:</strong> {SCRIPT_URL}</p>
                <p><strong>Abre la consola del navegador (F12)</strong> para ver logs detallados</p>
              </div>
            </details>
          </div>
        )}
        
        {currentPage === 'asistencias' && <PaginaAsistencias jugadoras={jugadoras} />}
        {currentPage === 'estadisticas' && <PaginaEstadisticas jugadoras={jugadoras} />}
        {currentPage === 'formacion' && <PaginaFormacion jugadoras={jugadoras} />}
      </main>
    </div>
  );
};

// Página de Asistencias (resto del código igual)
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
    if (jugadorasProps.length > 0) {
      cargarAsistenciasFecha(fechaSeleccionada);
    }
  }, [jugadorasProps]);

  useEffect(() => {
    if (jugadoras.length > 0) {
      cargarAsistenciasFecha(fechaSeleccionada);
    }
  }, [fechaSeleccionada, jugadoras]);

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
      
      // Preparar datos de asistencia
      const asistenciasData = {};
      Object.keys(asistencias).forEach(jugadoraId => {
        const estado = asistencias[jugadoraId];
        switch (estado) {
          case 'presente': asistenciasData[jugadoraId] = 'P'; break;
          case 'ausente': asistenciasData[jugadoraId] = 'A'; break;
          case 'tardanza': asistenciasData[jugadoraId] = 'T'; break;
        }
      });
      
      if (Object.keys(asistenciasData).length === 0) {
        setMensaje('⚠️ No hay asistencias marcadas');
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams({
        action: 'saveAttendance',
        fecha: fechaSeleccionada,
        asistencias: JSON.stringify(asistenciasData)
      });
      
      const response = await fetch(`${SCRIPT_URL}?${params.toString()}`, {
        method: 'POST',
        mode: 'cors'
      });
      
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
        throw new Error('No tienes permisos para guardar los datos');
      }
      
      if (result.success) {
        setMensaje('✅ Asistencias guardadas exitosamente');
        setTimeout(() => setMensaje(''), 3000);
      } else {
        throw new Error(result.message || 'Error al guardar las asistencias');
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
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
          ) : jugadoras.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay jugadoras cargadas. Verifica la conexión con Google Sheets.
            </div>
          ) : jugadorasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay jugadoras en esta división
            </div>
          ) : (
            jugadorasFiltradas.map((jugadora) => (
              <div key={jugadora.id} className="px-4 py-3 border-b hover:bg-gray-50 flex flex-col sm:flex-row justify-between">
                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text