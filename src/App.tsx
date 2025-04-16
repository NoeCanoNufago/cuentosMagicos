import { useState, useEffect, useRef } from 'react'
import { HiSun, HiMoon } from 'react-icons/hi2'
import { Word, Theme, Reading } from './types'
import { YouTubePlayer } from './components/YouTubePlayer'
import { ReadingControls } from './components/ReadingControls'
import { WordDisplay } from './components/WordDisplay'
import { TextPreview } from './components/TextPreview'
import { Library } from './components/Library'
import { SettingsPanel } from './components/SettingsPanel'
import { extractTextFromPdf } from './utils/pdfUtils'
import { storageService } from './services/storage'

function App() {
  const [theme, setTheme] = useState<Theme>({ isDark: true })
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [totalCells, setTotalCells] = useState(13)
  const [wordsPerMinute, setWordsPerMinute] = useState(50)
  const [volume, setVolume] = useState(0.5)
  const [showTextPreview, setShowTextPreview] = useState(true)
  const intervalRef = useRef<number | null>(null)
  const [currentReading, setCurrentReading] = useState<Reading | null>(null)
  const [readings, setReadings] = useState<Reading[]>([])
  const [activeSection, setActiveSection] = useState<'library' | 'reader' | 'settings'>('library')

  // Cargar lecturas y tema al inicio
  useEffect(() => {
    const savedTheme = storageService.getTheme()
    setTheme({ isDark: savedTheme === 'dark' })
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    }

    const allReadings = storageService.getAllReadings()
    setReadings(allReadings)

    // Cargar configuración guardada
    const savedSettings = storageService.getSettings()
    setTotalCells(savedSettings.totalCells)
    setWordsPerMinute(savedSettings.wordsPerMinute)
    setVolume(savedSettings.volume)

    // Si hay una lectura en progreso, cargarla
    const lastReading = allReadings.find(r => r.lastPosition && r.lastPosition > 0)
    if (lastReading) {
      loadReading(lastReading)
    }
  }, [])

  // Guardar configuración cuando cambie
  useEffect(() => {
    storageService.setSettings({
      totalCells,
      wordsPerMinute,
      volume
    })
  }, [totalCells, wordsPerMinute, volume])

  // Manejar cambios de tema
  useEffect(() => {
    if (theme.isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    storageService.setTheme(theme.isDark ? 'dark' : 'light')
  }, [theme.isDark])

  // Manejar reproducción automática
  useEffect(() => {
    if (isPlaying) {
      const msPerWord = 60000 / wordsPerMinute
      intervalRef.current = window.setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= words.length - 1) {
            setIsPlaying(false)
            return prev
          }
          const newIndex = prev + 1
          if (currentReading?.id) {
            storageService.updateReadingPosition(currentReading.id, newIndex)
          }
          return newIndex
        })
      }, msPerWord)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, wordsPerMinute, words.length, currentReading])

  const toggleTheme = () => {
    setTheme(prev => ({ isDark: !prev.isDark }))
  }

  const processText = (text: string): Word[] => {
    return text.split(/\s+/)
      .filter(w => w.length > 0)
      .map(word => ({
        text: word,
        orpIndex: Math.min(Math.floor(word.length / 2), 3)
      }))
  }

  const loadReading = (reading: Reading) => {
    if (!reading.content) {
      console.error('Error: El contenido de la lectura está vacío');
      return;
    }
    const processedWords = processText(reading.content);
    setWords(processedWords);
    setCurrentIndex(reading.lastPosition || 0);
    setCurrentReading(reading);
    setIsPlaying(false);
    setActiveSection('reader');
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      let text: string
      const fileType = file.type === 'application/pdf' ? 'pdf' : 'txt'

      if (fileType === 'pdf') {
        text = await extractTextFromPdf(file)
      } else {
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsText(file)
        })
      }

      const newReading = storageService.addReading({
        name: file.name,
        content: text,
        type: 'custom'
      })

      setReadings(storageService.getAllReadings())
      loadReading(newReading)
    } catch (error) {
      console.error('Error al procesar el archivo:', error)
      alert('Error al procesar el archivo. Por favor, intenta con otro archivo.')
    }
  }

  const loadPredefinedStory = async (storyPath: string, categoryName: string) => {
    try {
      // Primero intentamos cargar desde localStorage
      const cacheKey = `story_${storyPath}`
      const cachedStory = localStorage.getItem(cacheKey)
      let text: string

      if (cachedStory) {
        text = cachedStory
        console.log('Cargando historia desde caché local')
      } else {
        // Si no está en caché, la cargamos desde GitHub
        console.log('Cargando historia desde GitHub:', storyPath)
        
        // Construimos la URL para el contenido raw
        const rawUrl = storyPath.replace('https://api.github.com/repos/NoeCanoNufago/cuentosMagicos/contents/', 
                                        'https://raw.githubusercontent.com/NoeCanoNufago/cuentosMagicos/main/')
        const response = await fetch(rawUrl)
        
        if (!response.ok) throw new Error('Error al cargar el cuento')
        text = await response.text()

        // Guardamos en localStorage para uso offline
        localStorage.setItem(cacheKey, text)
      }

      // Extraer el nombre del archivo (sin la extensión .txt)
      const fileName = storyPath.split('/').pop()?.replace('.txt', '') || 'Sin nombre'

      // Verificar si ya existe en las lecturas
      const existingReading = readings.find(r =>
        r.type === 'predefined' && r.path === storyPath
      )

      if (existingReading) {
        loadReading(existingReading)
      } else {
        const newReading = storageService.addReading({
          name: fileName,
          content: text,
          path: storyPath,
          type: 'predefined',
          category: categoryName
        })
        setReadings(storageService.getAllReadings())
        loadReading(newReading)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar el cuento. Por favor, intenta de nuevo.')
    }
  }

  const handlePlay = () => setIsPlaying(true)
  const handlePause = () => setIsPlaying(false)

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      if (currentReading?.id) {
        storageService.updateReadingPosition(currentReading.id, newIndex);
      }
    }
  }

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
    if (currentReading?.id) {
      storageService.updateReadingPosition(currentReading.id, 0);
    }
  }

  const deleteReading = (id: string) => {
    storageService.deleteReading(id)
    setReadings(storageService.getAllReadings())
    if (currentReading?.id === id) {
      setCurrentReading(null)
      setWords([])
      setCurrentIndex(0)
    }
  }

  const handleAddBookmark = (position: number, note?: string) => {
    if (currentReading?.id) {
      storageService.addBookmark(currentReading.id, { position, note });
      setCurrentReading(prev => {
        if (!prev) return null;
        return {
          ...prev,
          bookmarks: [...(prev.bookmarks || []), { position, note, timestamp: new Date().toISOString() }]
        };
      });
    }
  };

  const handleJumpToBookmark = (position: number) => {
    setCurrentIndex(position);
    setIsPlaying(false);
    if (currentReading?.id) {
      storageService.updateReadingPosition(currentReading.id, position);
    }
  };

  const handleRemoveBookmark = (index: number) => {
    if (currentReading?.id) {
      storageService.removeBookmark(currentReading.id, index);
      setCurrentReading(prev => {
        if (!prev) return null;
        const newBookmarks = [...(prev.bookmarks || [])];
        newBookmarks.splice(index, 1);
        return {
          ...prev,
          bookmarks: newBookmarks
        };
      });
    }
  };

  return (
    <div className={`min-h-screen w-screen overflow-x-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 transition-colors duration-300 ${theme.isDark ? 'dark' : ''}`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 min-h-screen">
        <div className="relative w-full mx-auto max-w-7xl">
          <header className="text-center mb-8 relative">
            <div className="absolute top-0 right-0 z-10">
              <button
                onClick={toggleTheme}
                className="p-3 rounded-full bg-white dark:bg-slate-700 shadow-lg hover:shadow-xl 
                transform hover:scale-105 transition-all duration-200 text-amber-500 dark:text-blue-400"
                aria-label="Cambiar tema"
              >
                {theme.isDark ? <HiMoon className="text-2xl" /> : <HiSun className="text-2xl" />}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 mb-4 sm:mb-6 font-serif">
              Lector Mágico
            </h1>

            <nav className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-8">
              {['library', 'reader', 'settings'].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section as any)}
                  className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg font-medium transition-all duration-200 ${activeSection === section
                      ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </nav>
          </header>

          <main className="space-y-8">
            {activeSection === 'library' && (
              <div className="animate-fadeIn">
                <Library
                  onLoadStory={loadPredefinedStory}
                  downloadedReadings={readings}
                  onLoadReading={loadReading}
                  onDeleteReading={deleteReading}
                />
              </div>
            )}

            {activeSection === 'reader' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl py-8 px-2 shadow-xl">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setShowTextPreview(!showTextPreview)}
                      className="text-sm px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200"
                    >
                      {showTextPreview ? 'Mostrar Palabra a Palabra' : 'Mostrar por Párrafo'}
                    </button>
                  </div>
                  
                  {showTextPreview ? (
                    <div className="mb-6 flex justify-center items-center">
                      <TextPreview words={words} currentIndex={currentIndex} />
                    </div>
                  ) : (
                    <div className="mb-6 flex justify-center items-center">
                      <WordDisplay
                        word={words[currentIndex] || null}
                        totalCells={totalCells}
                      />
                    </div>
                  )}

                  <div className="mt-8">
                    <ReadingControls
                      isPlaying={isPlaying}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onNext={handleNext}
                      onReset={handleReset}
                      disabled={words.length === 0}
                      currentPosition={currentIndex}
                      totalWords={words.length}
                      words={words}
                      bookmarks={currentReading?.bookmarks || []}
                      onAddBookmark={handleAddBookmark}
                      onJumpToBookmark={handleJumpToBookmark}
                      onRemoveBookmark={handleRemoveBookmark}
                      onPositionChange={(position) => {
                        setCurrentIndex(position)
                        setIsPlaying(false)
                        if (currentReading?.id) {
                          storageService.updateReadingPosition(currentReading.id, position)
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="mt-16 pt-16">
                  <YouTubePlayer
                    videoId="OeDTVlqf8gk"
                    volume={volume}
                    onVolumeChange={setVolume}
                  />
                </div>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="animate-fadeIn">
                <SettingsPanel
                  totalCells={totalCells}
                  wordsPerMinute={wordsPerMinute}
                  onTotalCellsChange={setTotalCells}
                  onWordsPerMinuteChange={setWordsPerMinute}
                  volume={volume}
                  onVolumeChange={setVolume}
                />
              </div>
            )}
          </main>

          <input
            type="file"
            id="fileInput"
            accept=".txt,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}

export default App
