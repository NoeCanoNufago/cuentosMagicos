import React from 'react';
import { HiBookOpen, HiTrash, HiMagnifyingGlass, HiFolderOpen, HiArrowLeft } from 'react-icons/hi2';
import { FaDownload } from 'react-icons/fa';
import { Reading } from '../types';

interface LibraryProps {
  onLoadStory: (storyName: string, folderPath: string) => void;
  downloadedReadings: Reading[];
  onLoadReading: (reading: Reading) => void;
  onDeleteReading: (id: string) => void;
}

interface DefaultReading {
  name: string;
  path: string;
  type: 'predefined';
}

interface GithubItem {
  name: string;
  path: string;
  type: string;
}

export const Library: React.FC<LibraryProps> = ({
  onLoadStory,
  downloadedReadings,
  onLoadReading,
  onDeleteReading,
}) => {
  const [items, setItems] = React.useState<GithubItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'myreadings' | 'catalog'>('myreadings');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [deleteModal, setDeleteModal] = React.useState<{show: boolean, readingId: string | null}>({
    show: false,
    readingId: null
  });
  const [currentPath, setCurrentPath] = React.useState('');
  const [navigationHistory, setNavigationHistory] = React.useState<string[]>([]);

  // Lecturas por defecto
  const defaultReadings: DefaultReading[] = [];

  React.useEffect(() => {
    fetchItems(currentPath);
  }, [currentPath]);

  const fetchItems = async (path: string) => {
    try {
      setIsLoading(true);
      const apiUrl = path 
        ? `https://api.github.com/repos/NoeCanoNufago/cuentosMagicos/contents/src/lectere/${path}`
        : 'https://api.github.com/repos/NoeCanoNufago/cuentosMagicos/contents/src/lectere';
      
      console.log('Consultando API:', apiUrl);
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Error al cargar los elementos');
      
      const data = await response.json();
      console.log('Elementos cargados:', data);
      setItems(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemClick = (item: GithubItem) => {
    console.log('Item seleccionado:', item);
    
    if (item.type === 'dir') {
      setNavigationHistory([...navigationHistory, currentPath]);
      // Eliminar el prefijo "src/lectere/" si existe y almacenar solo la ruta relativa
      const newPath = item.path.replace('src/lectere/', '');
      console.log('Nueva ruta de navegación:', newPath);
      setCurrentPath(newPath);
    } else if (item.type === 'file' && item.name.endsWith('.txt')) {
      // Procesamos la ruta para evitar duplicación de "src/lectere/"
      const cleanPath = item.path.replace(item.name, '').replace('src/lectere/', '');
      console.log('Descargando archivo desde ruta:', cleanPath);
      onLoadStory(item.name, cleanPath);
    }
  };

  const handleBackNavigation = () => {
    if (navigationHistory.length > 0) {
      const previousPath = navigationHistory.pop() || '';
      setNavigationHistory([...navigationHistory]);
      setCurrentPath(previousPath);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteModal({ show: true, readingId: id });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.readingId) {
      onDeleteReading(deleteModal.readingId);
      setDeleteModal({ show: false, readingId: null });
    }
  };

  const isReadingWithId = (item: DefaultReading | Reading): item is Reading & { id: string } => {
    return 'id' in item && typeof item.id === 'string';
  };

  const renderMyReadings = () => {
    const allReadings = [...defaultReadings, ...downloadedReadings];
    
    return (
      <div className="grid grid-cols-1 h-[50vh] overflow-y-auto md:grid-cols-3 lg:grid-cols-4 gap-3">
        {allReadings.length === 0 ? (
          <p key="no-books" className="text-center text-gray-500 dark:text-gray-400 col-span-full">No tienes libros en tu biblioteca.</p>
        ) : (
          allReadings.map((reading, index) => (
            <div
              key={reading.type === 'predefined' ? `predefined-${reading.name}-${index}` : `downloaded-${reading.id}`}
              className="px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 rounded-md shadow hover:shadow-md transition-all"
            >
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-300 truncate">
                {reading.name.split('-')[0]}
              </h3>
              <p className="text-[10px] text-gray-500 mb-1 dark:text-gray-400">
                {reading.name.split('-')[1]}
              </p>
              <div className="flex items-center justify-between pb-1.5">
                <button
                  onClick={() => {
                    if (reading.type === 'predefined') {
                      onLoadReading(reading as Reading);
                    } else {
                      onLoadReading(reading as Reading);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-all"
                >
                  <HiBookOpen className="w-4 h-4" />
                  Leer
                </button>
                {isReadingWithId(reading) && (
                  <button
                    onClick={() => handleDeleteClick(reading.id)}
                    className="flex items-center gap-1 px-2 py-0.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-all"
                  >
                    <HiTrash className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderCatalog = () => {
    const filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiMagnifyingGlass className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm
                     text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                     transition-all duration-200"
          />
        </div>
        
        {currentPath && (
          <button
            onClick={handleBackNavigation}
            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 mb-2"
          >
            <HiArrowLeft className="w-5 h-5" />
            Regresar
          </button>
        )}
        
        <div className="grid grid-cols-1 h-[45vh] overflow-y-auto md:grid-cols-3 lg:grid-cols-4 gap-3">
          {isLoading ? (
            <p className="text-center col-span-full">Cargando catálogo...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center col-span-full text-gray-500 dark:text-gray-400">
              No se encontraron elementos que coincidan con tu búsqueda.
            </p>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={`catalog-${item.path}-${index}`}
                className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-md shadow hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                {item.type === 'dir' ? (
                  <>
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-300">
                      <HiFolderOpen className="w-5 h-5" />
                      <h3 className="text-sm font-semibold truncate">{item.name}</h3>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2 dark:text-gray-400">Carpeta</p>
                  </>
                ) : item.name.endsWith('.txt') ? (
                  <>
                    <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-300 truncate">
                      {item.name.replace('.txt', '')}
                    </h3>
                    <p className="text-[10px] text-gray-500 mb-2 dark:text-gray-400">
                      Documento de texto
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const cleanPath = item.path.replace(item.name, '').replace('src/lectere/', '');
                        onLoadStory(item.name, cleanPath);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-all"
                    >
                      <FaDownload className="w-4 h-4" />
                      Descargar
                    </button>
                  </>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-300">
          {activeTab === 'myreadings' ? 'Mis Lecturas' : 'Catálogo'}
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('myreadings')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'myreadings'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-gray-600'
            }`}
          >
            Mis Lecturas
          </button>
          <button
            onClick={() => {
              setActiveTab('catalog');
              setCurrentPath('');
              setNavigationHistory([]);
            }}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'catalog'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-gray-600'
            }`}
          >
            Catálogo
          </button>
        </div>
      </div>

      {activeTab === 'myreadings' ? renderMyReadings() : renderCatalog()}

      {/* Modal de confirmación */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 dark:bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas eliminar esta lectura? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteModal({ show: false, readingId: null })}
                className="px-4 py-2 text-sm font-medium text-gray-100 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 