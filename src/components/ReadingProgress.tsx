import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  HiBookOpen,
  HiOutlineBookmark
} from 'react-icons/hi2'

// Definición de interfaces
interface Word {
  text: string
}

interface Chapter {
  title: string
  position: number
}

interface ReadingProgressProps {
  currentPosition: number
  totalWords: number
  words: Word[]
  onPositionChange: (position: number) => void
  disabled: boolean
  chapters?: Chapter[]
  percentageStep?: number
}

// Constantes
const DETAILED_VIEW_WIDTH = 20 // Ancho visible en la vista detallada (%)
const CONTEXT_SIZE = 25 // Palabras de contexto en la vista previa
const BOOKMARK_STORAGE_KEY = 'readingBookmarks'
const EXPAND_DELAY = 500 // ms para expandir en presión prolongada
const PREVIEW_HIDE_DELAY = 1500 // ms para ocultar vista previa en móviles

export const ReadingProgress = ({
  currentPosition,
  totalWords,
  words,
  onPositionChange,
  disabled,
  chapters = [],
}: ReadingProgressProps) => {
  // Refs
  const progressBarRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const expandTimerRef = useRef<NodeJS.Timeout | null>(null)
  const touchActiveRef = useRef<boolean>(false)

  // Estados
  const [isExpanded, setIsExpanded] = useState(false)
  const [previewPosition, setPreviewPosition] = useState(currentPosition)
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [showChapters, setShowChapters] = useState(false)
  const [detailedViewCenter, setDetailedViewCenter] = useState(50)
  const [isInteracting, setIsInteracting] = useState(false)

  // Cálculos memorizados
  const progressPercentage = useMemo(() =>
    (currentPosition / totalWords) * 100,
    [currentPosition, totalWords]
  )

  const previewPercentage = useMemo(() =>
    (previewPosition / totalWords) * 100,
    [previewPosition, totalWords]
  )

  const currentPercentage = useMemo(() =>
    Math.floor(progressPercentage),
    [progressPercentage]
  )

  const detailedViewRange = useMemo(() => {
    const start = Math.max(0, detailedViewCenter - DETAILED_VIEW_WIDTH / 2)
    const end = Math.min(100, detailedViewCenter + DETAILED_VIEW_WIDTH / 2)
    return { start, end, width: end - start }
  }, [detailedViewCenter])

  const normalizedPreviewPosition = useMemo(() =>
    ((previewPercentage - detailedViewRange.start) / detailedViewRange.width) * 100,
    [previewPercentage, detailedViewRange]
  )

  const currentChapter = useMemo(() => {
    if (!chapters || chapters.length === 0) return null

    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentPosition >= chapters[i].position) {
        return chapters[i]
      }
    }
    return chapters[0]
  }, [chapters, currentPosition])

  // Manejar clics fuera del componente para cerrar la vista detallada
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && 
          containerRef.current && 
          !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  // Cargar marcadores del localStorage
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem(BOOKMARK_STORAGE_KEY)
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks))
      }
    } catch (e) {
      console.error('Error al cargar marcadores:', e)
    }
  }, [])

  // Actualizar previewPosition cuando cambia currentPosition (si no estamos en interacción)
  useEffect(() => {
    if (!isInteracting) {
      setPreviewPosition(currentPosition)
      setDetailedViewCenter((currentPosition / totalWords) * 100)
    }
  }, [currentPosition, isInteracting, totalWords])

  // Guardar marcadores en localStorage
  useEffect(() => {
    if (bookmarks.length > 0) {
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks))
    }
  }, [bookmarks])

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current)
      }
    }
  }, [])

  // Helpers y manejadores de eventos memoizados para evitar recreaciones
  const getContextWords = useCallback((position: number) => {
    const start = Math.max(0, position - CONTEXT_SIZE)
    const end = Math.min(words.length, position + CONTEXT_SIZE)
    return words.slice(start, end).map(w => w.text).join(' ')
  }, [words])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !progressBarRef.current) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newPosition = Math.min(Math.floor(percentage * totalWords), totalWords - 1)
    setPreviewPosition(newPosition)
    setIsExpanded(true)
  }, [disabled, totalWords, setPreviewPosition, setIsExpanded])

  const calculatePositionFromEvent = useCallback((
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    ref: React.RefObject<HTMLDivElement>,
    useDetailedView = false
  ) => {
    if (!ref.current) return null

    const rect = ref.current.getBoundingClientRect()
    let x: number

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
    } else {
      x = e.clientX - rect.left
    }

    const percentage = Math.max(0, Math.min(1, x / rect.width))

    if (useDetailedView) {
      // Para vista detallada, calcular dentro del rango visible
      const rangePosition = detailedViewRange.start / 100 + (percentage * detailedViewRange.width / 100)
      return Math.min(Math.floor(rangePosition * totalWords), totalWords - 1)
    }

    // Para vista normal
    return Math.min(Math.floor(percentage * totalWords), totalWords - 1)
  }, [totalWords, detailedViewRange])

  const handleProgressMove = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const position = calculatePositionFromEvent(e, progressBarRef, false)
    if (position !== null) {
      setPreviewPosition(position)
    }
  }, [calculatePositionFromEvent])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    
    setIsInteracting(true)
    e.preventDefault() // Prevenir comportamiento predeterminado

    expandTimerRef.current = setTimeout(() => {
      setIsExpanded(true)
    }, EXPAND_DELAY)
  }, [disabled])

  const handleMouseUp = useCallback(() => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current)
      expandTimerRef.current = null
    }
    
    // Mantenemos isInteracting para permitir la acción de clic
    setTimeout(() => {
      setIsInteracting(false)
    }, 100)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchActiveRef.current = true
    setIsInteracting(true)
    handleProgressMove(e)
    
    expandTimerRef.current = setTimeout(() => {
      setIsExpanded(true)
    }, EXPAND_DELAY)
  }, [handleProgressMove])

  const handleTouchEnd = useCallback(() => {
    touchActiveRef.current = false
    handleMouseUp()

    // Mantener vista previa visible por un momento en dispositivos táctiles
    setTimeout(() => {
      if (!touchActiveRef.current) {
        setIsInteracting(false)
      }
    }, PREVIEW_HIDE_DELAY)
  }, [handleMouseUp])

  const moveToPercentage = useCallback((percentage: number) => {
    const position = Math.min(Math.floor((percentage / 100) * totalWords), totalWords - 1)
    onPositionChange(position)
  }, [totalWords, onPositionChange])

  const moveSteps = useCallback((steps: number) => {
    const newPosition = Math.max(0, Math.min(currentPosition + steps, totalWords - 1))
    onPositionChange(newPosition)
  }, [currentPosition, totalWords, onPositionChange])

  // Nuevas funciones para manejar la vista previa
  const previewToPercentage = useCallback((percentage: number) => {
    const position = Math.min(Math.floor((percentage / 100) * totalWords), totalWords - 1)
    setPreviewPosition(position)
    setIsExpanded(true)
  }, [totalWords, setPreviewPosition, setIsExpanded])

  const previewSteps = useCallback((steps: number) => {
    const newPosition = Math.max(0, Math.min(currentPosition + steps, totalWords - 1))
    setPreviewPosition(newPosition)
    setIsExpanded(true)
  }, [currentPosition, totalWords, setPreviewPosition, setIsExpanded])

  const removeBookmark = useCallback((position: number) => {
    setBookmarks(prev => prev.filter(b => b !== position))
  }, [])

  // Renderizado optimizado con fragmentación por secciones
  const renderChaptersPanel = () => {
    if (!showChapters) return null;

    return (
      <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-md text-sm max-h-48 overflow-y-auto">
        <h3 className="font-medium mb-2 text-slate-900 dark:text-slate-100">Capítulos</h3>
        {chapters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {chapters.map((chapter, index) => (
              <button
                key={index}
                onClick={() => onPositionChange(chapter.position)}
                className={`text-left px-2 py-1 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs ${currentChapter?.title === chapter.title
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : 'text-slate-700 dark:text-slate-300'
                  }`}
              >
                {chapter.title}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-xs italic">No hay capítulos disponibles</p>
        )}
      </div>
    );
  };

  const renderProgressBar = () => (
    <div
      className="relative h-10 flex items-center select-none"
      ref={progressBarRef}
      onClick={handleProgressClick}
      onMouseMove={!disabled ? handleProgressMove : undefined}
      onMouseDown={!disabled ? handleMouseDown : undefined}
      onMouseUp={handleMouseUp}
      onTouchStart={!disabled ? handleTouchStart : undefined}
      onTouchMove={!disabled ? handleProgressMove : undefined}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Marcadores de capítulos */}
      {chapters.map((chapter, index) => {
        const position = (chapter.position / totalWords) * 100;
        return (
          <div
            key={index}
            className="absolute top-1 w-1 h-5 bg-slate-400 dark:bg-slate-500 cursor-pointer hover:h-6 transition-all"
            style={{ left: `${position}%` }}
            title={chapter.title}
            onClick={(e) => {
              e.stopPropagation();
              setPreviewPosition(chapter.position);
              setIsExpanded(true);
            }}
          />
        );
      })}

      {/* Marcadores de usuario */}
      {bookmarks.map((position, index) => {
        const positionPercentage = (position / totalWords) * 100;
        return (
          <div
            key={`bookmark-${index}`}
            className="absolute -top-1 flex flex-col items-center cursor-pointer group/bookmark z-10"
            style={{ left: `${positionPercentage}%` }}
            title={`Marcador: ${getContextWords(position)}`}
          >
            <div
              className="w-4 h-4 bg-amber-400 rounded-full hover:scale-125 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewPosition(position);
                setIsExpanded(true);
              }}
            />
            <button
              className="opacity-0 group-hover/bookmark:opacity-100 text-red-500 hover:text-red-700 text-xs -mt-1"
              onClick={(e) => {
                e.stopPropagation();
                removeBookmark(position);
              }}
              title="Eliminar marcador"
            >
              ×
            </button>
          </div>
        );
      })}

      {/* Indicador de posición actual */}
      <div
        className="absolute top-0 w-4 h-4 bg-white border-2 border-violet-600 rounded-full shadow-lg transform -translate-x-1/2 transition-all duration-300"
        style={{ left: `${progressPercentage}%` }}
      />
    </div>
  );

  const renderPreview = () => {

    return (
      <div
        className={`absolute ${isExpanded ? 'top-[122px]' : 'top-12'} left-0 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4 text-sm transition-all duration-200 z-10`}
      >
        <div className="relative">
          {/* Indicador de posición de vista previa */}
          <div
            className="absolute -top-7 w-1 h-3 bg-violet-500"
            style={{
              left: isExpanded
                ? `${normalizedPreviewPosition}%`
                : `${previewPercentage}%`
            }}
          />

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-center font-medium text-slate-900 dark:text-slate-100 mb-1">
                <span>Posición {previewPosition + 1} ({Math.round((previewPosition / totalWords) * 100)}%)</span>
                {!bookmarks.includes(previewPosition) && !disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (previewPosition !== currentPosition) {
                        setBookmarks(prev => [...prev, previewPosition].sort((a, b) => a - b));
                      }
                    }}
                    className="text-xs text-amber-500 hover:text-amber-600"
                    title="Añadir marcador"
                  >
                    <HiOutlineBookmark className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                ...{getContextWords(previewPosition)}...
              </p>
            </div>
              <button
                onClick={() => onPositionChange(previewPosition)}
                className="px-3 py-1 text-xs font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-full transition-colors"
              >
                Ir aquí
              </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl" ref={containerRef}>
      {/* Cabecera con información y acciones */}
      <div className="flex items-center justify-between mb-2 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            onClick={() => setShowChapters(prev => !prev)}
            title="Ver capítulos"
          >
            <HiBookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Capítulos</span>
          </button>

          {currentChapter && (
            <span className="hidden md:inline text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
              {currentChapter.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">
            {currentPosition + 1} / {totalWords} ({currentPercentage}%)
          </span>
        </div>
      </div>

      {/* Controles de navegación rápida */}
      <div className="flex items-center justify-between mb-2 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <button
            onClick={() => previewSteps(-1000)}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            disabled={disabled || currentPosition <= 0}
            title="Retroceder 1000 palabras"
          >
            {"<<"}-1000p
          </button>

          <button
            onClick={() => previewSteps(-100)}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            disabled={disabled || currentPosition <= 0}
            title="Retroceder 100 palabras"
          >
            {"<"}-100p
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-1">
          {Array.from({ length: 11 }, (_, i) => i * 10).map(percentage => (
            <button
              key={percentage}
              onClick={() => previewToPercentage(percentage)}
              className={`px-2 py-0.5 text-xs rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${currentPercentage >= percentage && currentPercentage < percentage + 10
                  ? 'bg-violet-100 dark:bg-violet-900/30 font-semibold text-violet-700 dark:text-violet-300'
                  : ''
                }`}
              disabled={disabled}
            >
              {percentage}%
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => previewSteps(100)}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            disabled={disabled || currentPosition >= totalWords - 1}
            title="Avanzar 100 palabras"
          > +100p {">"}
          </button>

          <button
            onClick={() => previewSteps(1000)}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            disabled={disabled || currentPosition >= totalWords - 1}
            title="Avanzar 1,000 palabras"
          >
            +1000p {">>"}
          </button>
        </div>
      </div>

      {/* Panel de capítulos desplegable */}
      {renderChaptersPanel()}

      {/* Barra de progreso principal */}
      <div className={`relative ${isExpanded ? 'h-40' : 'h-24'} transition-all duration-300`}>
        {renderProgressBar()}

        {/* Vista previa del texto */}
        {renderPreview()}
      </div>
    </div>
  )
}

