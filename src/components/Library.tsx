import React from 'react';
import { HiBookOpen, HiTrash, HiMagnifyingGlass, HiFolderOpen } from 'react-icons/hi2';
import { FaDownload, FaArrowLeft } from 'react-icons/fa';
import { Reading, GitHubDir, GitHubFile } from '../types';

interface LibraryProps {
  onLoadStory: (storyPath: string, categoryName: string) => void;
  downloadedReadings: Reading[];
  onLoadReading: (reading: Reading) => void;
  onDeleteReading: (id: string) => void;
}

export const Library: React.FC<LibraryProps> = ({
  onLoadStory,
  downloadedReadings,
  onLoadReading,
  onDeleteReading,
}) => {
  const [categories, setCategories] = React.useState<GitHubDir[]>([]);
  const [currentFiles, setCurrentFiles] = React.useState<GitHubFile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'myreadings' | 'catalog'>('myreadings');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentCategory, setCurrentCategory] = React.useState<string | null>(null);
  const [deleteModal, setDeleteModal] = React.useState<{show: boolean, readingId: string | null}>({
    show: false,
    readingId: null
  });

  React.useEffect(() => {
    if (activeTab === 'catalog') {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://api.github.com/repos/NoeCanoNufago/cuentosMagicos/contents/src/lectere');
      
      if (!response.ok) throw new Error('Error al cargar las categorías');
      
      const data = await response.json();
      const dirs = data.filter((item: any) => item.type === 'dir').map((dir: any) => ({
        name: dir.name,
        path: dir.path,
        url: dir.url,
        type: dir.type
      }));
      
      setCategories(dirs);
      setCurrentFiles([]);
      setCurrentCategory(null);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilesFromCategory = async (category: GitHubDir) => {
    try {
      setIsLoading(true);
      const response = await fetch(category.url);
      
      if (!response.ok) throw new Error(`Error al cargar archivos de ${category.name}`);
      
      const data = await response.json();
      const files = data.filter((item: any) => item.type === 'file' && item.name.endsWith('.txt')).map((file: any) => ({
        name: file.name,
        path: file.path,
        url: file.url,
        download_url: file.download_url,
        type: file.type
      }));
      
      setCurrentFiles(files);
      setCurrentCategory(category.name);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
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

  const isReadingWithId = (item: Reading): item is Reading & { id: string } => {
    return 'id' in item && typeof item.id === 'string';
  };

  const backToCategories = () => {
    setCurrentCategory(null);
    setCurrentFiles([]);
  };

  const renderMyReadings = () => {
    // Agrupar lecturas por categoría
    const readingsByCategory: Record<string, Reading[]> = {};
    
    downloadedReadings.forEach(reading => {
      const category = reading.category || 'Sin categoría';
      if (!readingsByCategory[category]) {
        readingsByCategory[category] = [];
      }
      readingsByCategory[category].push(reading);
    });

    const categoryNames = Object.keys(readingsByCategory).sort();
    
    return (
      <div className="space-y-6 h-[50vh] overflow-y-auto">
        {categoryNames.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No tienes libros en tu biblioteca.</p>
        ) : (
          categoryNames.map(category => (
            <div key={category} className="space-y-2">
              <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-300 border-b pb-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {readingsByCategory[category].map(reading => (
                  <div
                    key={reading.id}
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
                        onClick={() => onLoadReading(reading)}
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
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderCatalog = () => {
    if (currentCategory) {
      return renderCategoryFiles();
    }
    
    const filteredCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiMagnifyingGlass className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm
                     text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                     transition-all duration-200"
          />
        </div>
        <div className="grid grid-cols-1 h-[45vh] overflow-y-auto md:grid-cols-2 lg:grid-cols-3 gap-3">
          {isLoading ? (
            <p className="text-center col-span-full">Cargando categorías...</p>
          ) : filteredCategories.length === 0 ? (
            <p className="text-center col-span-full text-gray-500 dark:text-gray-400">
              No se encontraron categorías que coincidan con tu búsqueda.
            </p>
          ) : (
            filteredCategories.map((category) => (
              <div
                key={`category-${category.path}`}
                className="p-4 bg-white/50 dark:bg-gray-700/50 rounded-md shadow hover:shadow-md transition-all cursor-pointer"
                onClick={() => fetchFilesFromCategory(category)}
              >
                <div className="flex items-center gap-3">
                  <HiFolderOpen className="text-3xl text-amber-500 dark:text-amber-400" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {category.name}
                  </h3>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderCategoryFiles = () => {
    const filteredFiles = currentFiles.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <button 
            onClick={backToCategories}
            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
          >
            <FaArrowLeft /> Volver a categorías
          </button>
          
          <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-300">
            {currentCategory}
          </h3>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiMagnifyingGlass className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar archivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm
                     text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                     transition-all duration-200"
          />
        </div>
        <div className="grid grid-cols-1 h-[40vh] overflow-y-auto md:grid-cols-3 lg:grid-cols-4 gap-3">
          {isLoading ? (
            <p className="text-center col-span-full">Cargando archivos...</p>
          ) : filteredFiles.length === 0 ? (
            <p className="text-center col-span-full text-gray-500 dark:text-gray-400">
              No se encontraron archivos que coincidan con tu búsqueda.
            </p>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={`file-${file.path}`}
                className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-md shadow hover:shadow-md transition-all"
              >
                <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-300 truncate">
                  {file.name.replace('.txt', '')}
                </h3>
                <button
                  onClick={() => onLoadStory(file.path, currentCategory || '')}
                  className="flex items-center gap-1 mt-2 px-2 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-all"
                >
                  <FaDownload className="w-4 h-4" />
                  Descargar
                </button>
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
          {activeTab === 'myreadings' ? 'Mis Lecturas' : currentCategory ? `Categoría: ${currentCategory}` : 'Catálogo'}
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
              setCurrentCategory(null);
              setCurrentFiles([]);
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
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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