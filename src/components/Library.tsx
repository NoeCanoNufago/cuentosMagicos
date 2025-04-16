import React from 'react';
import { HiBookOpen, HiTrash, HiMagnifyingGlass } from 'react-icons/hi2';
import { FaDownload } from 'react-icons/fa';
import { Reading } from '../types';

interface LibraryProps {
  onLoadStory: (storyName: string) => void;
  downloadedReadings: Reading[];
  onLoadReading: (reading: Reading) => void;
  onDeleteReading: (id: string) => void;
}

interface DefaultReading {
  name: string;
  path: string;
  type: 'predefined';
}

export const Library: React.FC<LibraryProps> = ({
  onLoadStory,
  downloadedReadings,
  onLoadReading,
  onDeleteReading,
}) => {
  const [availableBooks, setAvailableBooks] = React.useState<Array<{name: string, path: string}>>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'myreadings' | 'catalog'>('myreadings');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [deleteModal, setDeleteModal] = React.useState<{show: boolean, readingId: string | null}>({
    show: false,
    readingId: null
  });

  // Lecturas por defecto
  const defaultReadings: DefaultReading[] = [];

  React.useEffect(() => {
    fetchAvailableBooks();
  }, []);

  const fetchAvailableBooks = async () => {
    try {
      const response = await fetch('https://api.github.com/repos/busiris2014/7506Condor1C2014/contents/datos2011/trunk/libros');
      if (!response.ok) throw new Error('Error al cargar la lista de libros');
      const data = await response.json();
      const books = data
        .filter((file: any) => file.name.endsWith('.txt'))
        .map((file: any) => ({
          name: file.name.replace('.txt', ''),
          path: file.path
        }));
      setAvailableBooks(books);
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
                      onLoadStory(reading.name + '.txt');
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
    const filteredBooks = availableBooks
      .filter(book => {
        // Excluir libros que ya están en downloadedReadings
        const isAlreadyDownloaded = downloadedReadings.some(
          downloaded => downloaded.name === book.name
        );
        return !isAlreadyDownloaded && book.name.toLowerCase().includes(searchQuery.toLowerCase());
      });

    return (
      <div className="flex flex-col gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiMagnifyingGlass className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar libros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm
                     text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                     transition-all duration-200"
          />
        </div>
        <div className="grid grid-cols-1 h-[45vh] overflow-y-auto md:grid-cols-3 lg:grid-cols-4 gap-3">
          {isLoading ? (
            <p className="text-center col-span-full">Cargando catálogo...</p>
          ) : filteredBooks.length === 0 ? (
            <p className="text-center col-span-full text-gray-500 dark:text-gray-400">
              No se encontraron libros que coincidan con tu búsqueda.
            </p>
          ) : (
            filteredBooks.map((book, index) => (
              <div
                key={`catalog-${book.path}-${index}`}
                className="p-3 bg-white/50  dark:bg-gray-700/50 rounded-md shadow hover:shadow-md transition-all"
              >
                <h3 className="text-sm font-semibold  text-purple-600 dark:text-purple-300 truncate">
                  {book.name.split('-')[0]}
                </h3>
                <p className="text-[10px] text-gray-500 mb-2 dark:text-gray-400">
                  {book.name.split('-')[1]}
                </p>
                <button
                  onClick={() => onLoadStory(book.name + '.txt')}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-all"
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
            onClick={() => setActiveTab('catalog')}
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