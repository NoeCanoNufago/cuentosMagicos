import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// Interfaces
interface Word {
  text: string
}

interface ReadingProgressProps {
  currentPosition: number
  totalWords: number
  words: Word[]
  onPositionChange: (position: number) => void
  disabled: boolean
  percentageStep?: number
}

// Constantes
const CONTEXT_SIZE = 30 // Palabras visibles en la vista previa

export const ReadingProgress = ({
  currentPosition,
  totalWords,
  words,
  onPositionChange,
  disabled
}: ReadingProgressProps) => {
  // Referencias
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Estados
  const [previewPosition, setPreviewPosition] = useState(currentPosition)
  const [showPreview, setShowPreview] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Valores calculados
  const progressPercentage = useMemo(() => 
    totalWords > 0 ? (currentPosition / (totalWords - 1)) * 100 : 0,
    [currentPosition, totalWords]
  )

  const previewPercentage = useMemo(() => 
    totalWords > 0 ? ((previewPosition) / (totalWords)) * 100 : 0,
    [previewPosition, totalWords]
  )

  const currentPercentageText = useMemo(() => 
    Math.floor(progressPercentage),
    [progressPercentage]
  )

  // Sincronización de previewPosition con currentPosition
  useEffect(() => {
    if (!isDragging) {
      setPreviewPosition(currentPosition)
    }
  }, [currentPosition, isDragging])

  // Cierra la vista previa cuando se desactiva
  useEffect(() => {
    if (disabled) {
      setShowPreview(false)
    }
  }, [disabled])

  // Gestión del evento de click afuera para cerrar la vista previa
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showPreview && 
        progressBarRef.current && 
        !progressBarRef.current.contains(e.target as Node)
      ) {
        setShowPreview(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPreview])

  // Obtiene las palabras de contexto alrededor de una posición
  const getContextWords = useCallback((position: number) => {
    if (!words.length) return '...'
    
    const start = Math.max(0, position - Math.floor(CONTEXT_SIZE / 2))
    const end = Math.min(words.length, start + CONTEXT_SIZE)
    
    return words.slice(start, end).map(w => w.text).join(' ')
  }, [words])

  // Calcula la posición basándose en un evento de mouse/touch
  const calculatePositionFromEvent = useCallback((clientX: number) => {
    if (!progressBarRef.current) return null

    const rect = progressBarRef.current.getBoundingClientRect()
    const offsetX = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width))
    
    return Math.min(Math.round(percentage * totalWords), totalWords - 1)
  }, [totalWords])

  // Manejadores de eventos
  const handleProgressBarClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return

    const newPosition = calculatePositionFromEvent(e.clientX)
    if (newPosition !== null) {
      onPositionChange(newPosition)
    }
    setShowPreview(false)
  }, [disabled, calculatePositionFromEvent, onPositionChange])

  const handleProgressMouseMove = useCallback((e: React.MouseEvent) => {
    if (disabled) return
    
    const position = calculatePositionFromEvent(e.clientX)
    if (position !== null) {
      setPreviewPosition(position)
      setShowPreview(true)
    }
  }, [disabled, calculatePositionFromEvent])

  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])




  return (
    <div className="w-full max-w-4xl">
      {/* Encabezado con información de posición */}
      <div className="flex justify-end mb-2 text-sm text-slate-600 dark:text-slate-400">
        <span className="font-mono text-xs">
          {currentPosition + 1} / {totalWords} ({currentPercentageText}%)
        </span>
      </div>

      {/* Barra de progreso principal */}
      <div className="relative mb-8" ref={progressBarRef}>
        <div 
          className={`
            relative w-full h-8 bg-slate-200 dark:bg-slate-700 
            rounded-full overflow-hidden cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onClick={!disabled ? handleProgressBarClick : undefined}
          onMouseMove={!disabled ? handleProgressMouseMove : undefined}
          onMouseDown={!disabled ? handleMouseDown : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Barra de progreso */}
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
          
          {/* Indicador de posición actual */}
          <div
            className="absolute top-0 bottom-0 flex items-center justify-center w-4 h-4 transform -translate-x-1/2"
            style={{ left: `${progressPercentage}%` }}
          >
            <div className="w-4 h-4 bg-white dark:bg-slate-200 border-2 border-violet-600 rounded-full shadow-lg" />
          </div>
        </div>

        {/* Ventana emergente de vista previa */}
        {showPreview && (
          <div className="absolute top-10 left-0 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4 text-sm z-10 border border-slate-200 dark:border-slate-700">
            <div className="relative">
              {/* Indicador de posición de vista previa */}
              <div
                className="absolute -top-10 w-1 h-3 bg-violet-500"
                style={{ left: `${previewPercentage}%` }}
              />

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                    Posición {previewPosition + 1} ({Math.round(previewPercentage)}%)
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                    ...{getContextWords(previewPosition)}...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

