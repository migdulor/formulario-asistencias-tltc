import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, Save, Download, TrendingUp, Shield, ChevronRight, Home, BarChart, FileText, Clock, MapPin, Trophy, X } from 'lucide-react';

// URL del Google Apps Script
//const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0bZ-wUA-p_1byFQcClwlkUk2GvxOCTxBd2pwmm5s1wU3v0lEdSEr-nTPtanpDaIMKog/exec';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz5Q9jKYGhvT6nDDGefSwRGzXrLo-5uDMJ06PldG-YJIstY-UEl0Q86x4DF2Cs9zLMtag/exec'
// Componente principal con navegación
const App = () => {
  const [currentPage, setCurrentPage] = useState('asistencias');
  const [jugadoras, setJugadoras] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    // Verificar URL configurada
    if (SCRIPT_URL === 'REEMPLAZA_CON_TU_URL_REAL') {
      setErrorInfo('⚠️ CONFIGURACIÓN REQUERIDA: Debes actualizar la SCRIPT_URL en src/App.jsx con la URL real de tu Google Apps Script.');
      return;
    }
    
    // Probar conexión básica primero
    probarConexionBasica();
  }, []);

  const probarConexionBasica = async () => {
    try {
      console.log('🧪 Probando conexión básica...');
      setDebugInfo('Probando conexión...');
      
      const response = await fetch(SCRIPT_URL);
      const text = await response.text();
      
      console.log('🔗 Respuesta de conexión básica:', {
        status: response.status,
        text: text.substring(0, 200)
      });
      
      if (response.ok && text.trim() !== '') {
        setDebugInfo('✅ Conexión OK - Cargando jugadoras...');
        cargarJugadoras();
      } else {
        setErrorInfo(`Conexión básica falló. Status: ${response.status}, Respuesta: "${text}"`);
      }
    } catch (error) {
      console.error('❌ Error de conexión básica:', error);
      setErrorInfo(`Error de conexión: ${error.message}`);
    }
  };

  const cargarJugadoras = async () => {
    try {
      setIsLoading(true);
      setErrorInfo('');
      console.log('🔄 Iniciando carga de jugadoras...');
      
      const requestUrl = `${SCRIPT_URL}?action=read&timestamp=${Date.now()}`;
      console.log('🌐 URL de petición:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        mode: 'cors'
      });
      
      console.log('📊 Response details:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: [...response.headers.entries()]
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log('📄 Response text details:', {
        length: text.length,
        isEmpty: text.trim() === '',
        first200: text.substring(0, 200),
        last200: text.substring(Math.max(0, text.length - 200))
      });
      
      if (!text || text.trim() === '') {
        throw new Error(`La respuesta del Google Apps Script está vacía. 

Posibles soluciones:
1. Verifica que el SHEET_ID esté configurado en el Apps Script
2. Re-implementa el Apps Script como "Aplicación web" 
3. Asegúrate de que el acceso sea "Cualquier persona"
4. Ejecuta la función testManual() en el Apps Script

URL probada: ${requestUrl}`);
      }
      
      if (text.trim().startsWith('<')) {
        throw new Error(`El servidor devolvió HTML en lugar de JSON. Esto indica:

1. El Google Apps Script no está implementado correctamente
2. Problemas de permisos
3. Error en el código del script

Respuesta HTML recibida: ${text.substring(0, 300)}...`);
      }
      
      let result;
      try {
        result = JSON.parse(text);
        console.log('✅ JSON parseado exitosamente:', result);
      } catch (parseError) {
        console.error('❌ Error al parsear JSON:', parseError);
        throw new Error(`Error al parsear JSON: ${parseError.message}

Respuesta recibida: "${text.substring(0, 500)}..."

Verifica que el Google Apps Script esté devolviendo JSON válido.`);
      }
      
      if (!result.success) {
        throw new Error(`Error del Google Apps Script: ${result.message || 'Error desconocido'}

Verifica:
1. Que el SHEET_ID esté configurado correctamente
2. Que la hoja "Jugadoras" exista
3. Los logs del Google Apps Script para más detalles`);
      }
      
      if (result.success && result.data) {
        console.log('📊 Datos recibidos:', result.data);
        
        if (!Array.isArray(result.data)) {
          throw new Error(`Los datos no son un array: ${typeof result.data}`);
        }
        
        if (result.data.length === 0) {
          throw new Error('La hoja de Google Sheets está vacía');
        }
        
        console.log('📋 Headers:', result.data[0]);
        
        // Procesar jugadoras
        const jugadorasExtraidas = result.data.slice(1).map((fila, index) => {
          console.log(`📝 Procesando fila ${index + 1}:`, fila);
          return {
            id: index + 1,
            idJugadora: fila[0]?.toString().trim() || (index + 1).toString(),
            nombre: fila[1]?.toString().trim() || '',
            nombreCorto: fila[2]?.toString().trim() || '',
            division: fila[3]?.toString().trim() || ''
          };
        }).filter(jugadora => jugadora.nombre && jugadora.nombre !== '');
        
        console.log('✅ Jugadoras procesadas:', jugadorasExtraidas);
        setJugadoras(jugadorasExtraidas);
        setDebugInfo(`✅ ${jugadorasExtraidas.length} jugadoras cargadas exitosamente`);
        setErrorInfo('');
        
        if (jugadorasExtraidas.length === 0) {
          setErrorInfo('No se encontraron jugadoras válidas en los datos');
        }
      } else {
        throw new Error('La respuesta no contiene datos válidos');
      }
    } catch (error) {
      console.error('💥 Error completo:', error);
      setErrorInfo(error.message);
      setDebugInfo(`❌ Error: ${error.message.split('\n')[0]}`);
    } finally {
      setIsLoading(false);
    }
  };

  const probarURL = async () => {
    try {
      setIsLoading(true);
      console.log('🧪 Probando URL directamente...');
      
      // Test 1: Sin parámetros
      console.log('Test 1: Sin parámetros');
      const response1 = await fetch(SCRIPT_URL);
      const text1 = await response1.text();
      console.log('Resultado 1:', { status: response1.status, text: text1.substring(0, 200) });
      
      // Test 2: Con action=test
      console.log('Test 2: Con action=test');
      const response2 = await fetch(`${SCRIPT_URL}?action=test`);
      const text2 = await response2.text();
      console.log('Resultado 2:', { status: response2.status, text: text2.substring(0, 200) });
      
      // Test 3: Con action=read
      console.log('Test 3: Con action=read');
      const response3 = await fetch(`${SCRIPT_URL}?action=read`);
      const text3 = await response3.text();
      console.log('Resultado 3:', { status: response3.status, text: text3.substring(0, 200) });
      
      alert('Tests completados. Revisa la consola para los resultados.');
      
    } catch (error) {
      console.error('Error en tests:', error);
      alert(`Error en tests: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                {isLoading ? '🔄 Cargando...' : debugInfo || `${jugadoras.length} jugadoras`}
              </p>
              <div className="flex gap-2 text-xs">
                <button 
                  onClick={cargarJugadoras}
                  disabled={isLoading || SCRIPT_URL === 'REEMPLAZA_CON_TU_URL_REAL'}
                  className="text-blue-200 hover:text-white underline disabled:opacity-50"
                >
                  🔄 Recargar
                </button>
                <button 
                  onClick={probarURL}
                  disabled={isLoading || SCRIPT_URL === 'REEMPLAZA_CON_TU_URL_REAL'}
                  className="text-blue-200 hover:text-white underline disabled:opacity-50"
                >
                  🧪 Test URL
                </button>
              </div>
            </div>
          </div>
          
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
              onClick={() => setCurrentPage('debug')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors min-w-max ${
                currentPage === 'debug' 
                  ? 'bg-blue-700 text-white' 
                  : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
              }`}
            >
              🔧 Debug
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {errorInfo && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>❌ Error:</strong>
            <pre className="mt-2 text-sm whitespace-pre-wrap">{errorInfo}</pre>
            {SCRIPT_URL !== 'REEMPLAZA_CON_TU_URL_REAL' && (
              <div className="mt-3 pt-3 border-t border-red-300 flex gap-2">
                <button 
                  onClick={cargarJugadoras}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                >
                  🔄 Reintentar
                </button>
                <button 
                  onClick={probarURL}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  🧪 Probar URL
                </button>
              </div>
            )}
          </div>
        )}

        {(jugadoras.length === 0 && !isLoading && !errorInfo && SCRIPT_URL !== 'REEMPLAZA_CON_TU_URL_REAL') && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <strong>⚠️ No hay jugadoras cargadas.</strong>
            <div className="mt-2">
              <button 
                onClick={cargarJugadoras}
                className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 mr-2"
              >
                🔄 Cargar jugadoras
              </button>
              <button 
                onClick={probarURL}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                🧪 Probar conexión
              </button>
            </div>
          </div>
        )}
        
        {currentPage === 'asistencias' && <PaginaAsistencias jugadoras={jugadoras} />}
        {currentPage === 'debug' && <PaginaDebug scriptUrl={SCRIPT_URL} />}
      </main>
    </div>
  );
};

// Página de Debug
const PaginaDebug = ({ scriptUrl }) => {
  const urlConfigurada = scriptUrl !== 'REEMPLAZA_CON_TU_URL_REAL';
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">🔧 Información de Debug</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Estado de configuración:</h3>
            <div className={`p-3 rounded font-mono text-sm ${
              urlConfigurada 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {urlConfigurada ? '✅ URL configurada' : '❌ URL no configurada'}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">URL del Google Apps Script:</h3>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
              {scriptUrl}
            </div>
          </div>
          
          {urlConfigurada && (
            <div>
              <h3 className="font-semibold mb-2">URLs de prueba:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Test básico:</strong>
                  <br />
                  <a href={scriptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                    {scriptUrl}
                  </a>
                </div>
                <div>
                  <strong>Test de conexión:</strong>
                  <br />
                  <a href={`${scriptUrl}?action=test`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                    {scriptUrl}?action=test
                  </a>
                </div>
                <div>
                  <strong>Leer jugadoras:</strong>
                  <br />
                  <a href={`${scriptUrl}?action=read`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                    {scriptUrl}?action=read
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={`p-4 rounded-lg ${urlConfigurada ? 'bg-blue-50' : 'bg-red-50'}`}>
        <h3 className={`font-bold mb-2 ${urlConfigurada ? 'text-blue-900' : 'text-red-900'}`}>
          {urlConfigurada ? '📝 Pasos de verificación:' : '⚠️ Configuración requerida:'}
        </h3>
        {urlConfigurada ? (
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Haz clic en las URLs de arriba para verificar que devuelvan JSON</li>
            <li>Si devuelven HTML o están vacías, re-implementa el Google Apps Script</li>
            <li>Verifica que el SHEET_ID esté configurado en el script</li>
            <li>Ejecuta testManual() en el Google Apps Script</li>
            <li>Asegúrate de que el acceso sea "Cualquier persona"</li>
          </ol>
        ) : (
          <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
            <li>Ve a tu Google Apps Script</li>
            <li>Implementar → Administrar implementaciones</li>
            <li>Copia la URL de la aplicación web</li>
            <li>Actualiza la línea SCRIPT_URL en src/App.jsx</li>
            <li>Guarda y recarga la aplicación</li>
          </ol>
        )}
      </div>
    </div>
  );
};

// Página de Asistencias
const PaginaAsistencias = ({ jugadoras: jugadorasProps }) => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [divisionFiltro, setDivisionFiltro] = useState('todas');
  const [asistencias, setAsistencias] = useState({});
  const [jugadoras, setJugadoras] = useState(jugadorasProps);

  useEffect(() => {
    setJugadoras(jugadorasProps);
  }, [jugadorasProps]);

  const jugadorasFiltradas = jugadoras.filter(jugadora => 
    divisionFiltro === 'todas' || jugadora.division === divisionFiltro
  );

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

  const contarAsistencias = () => {
    const presentes = Object.values(asistencias).filter(e => e === 'presente').length;
    const ausentes = Object.values(asistencias).filter(e => e === 'ausente').length;
    const tardanzas = Object.values(asistencias).filter(e => e === 'tardanza').length;
    return { presentes, ausentes, tardanzas };
  };

  const { presentes, ausentes, tardanzas } = contarAsistencias();

  return (
    <div className="space-y-6">
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
          {jugadoras.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-4">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-lg font-medium">No hay jugadoras cargadas</p>
                <p className="text-sm">Verifica la conexión con Google Sheets</p>
              </div>
              <p className="text-xs text-gray-400">
                Ve a la pestaña "Debug" para más información
              </p>
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
                    <div className="text-sm text-gray-500">{jugadora.division} • {jugadora.nombreCorto}</div>
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

      {jugadoras.length > 0 && (
        <button
          onClick={() => alert('Funcionalidad de guardado será implementada una vez que las jugadoras se carguen correctamente')}
          disabled={Object.keys(asistencias).length === 0}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          Guardar en Google Sheets ({Object.keys(asistencias).length} marcadas)
        </button>
      )}
    </div>
  );
};

export default App;