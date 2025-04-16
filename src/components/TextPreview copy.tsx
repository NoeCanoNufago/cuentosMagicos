import { Word } from '../types'
import { memo, useEffect, useRef } from 'react'

interface TextPreviewProps {
  words: Word[]
  currentIndex: number
}

export const TextPreview = memo(({ words, currentIndex }: TextPreviewProps) => {
  if (!words.length) return null

  const containerRef = useRef<HTMLDivElement>(null)
  const currentWordRef = useRef<HTMLSpanElement>(null)
  const guideLineRef = useRef<HTMLDivElement>(null)

  // Ya no necesitamos limitar las palabras visibles - mostraremos todas
  // pero seguimos manteniendo la referencia a la palabra actual

  // Efecto para mantener la palabra actual centrada y la línea guía debajo de ella
  useEffect(() => {
    if (currentWordRef.current && containerRef.current) {
      const container = containerRef.current
      const wordElement = currentWordRef.current
      const guideLine = guideLineRef.current
      
      // Calcular posición para centrar la palabra en la vista
      const containerCenter = container.offsetHeight / 2
      const wordTop = wordElement.offsetTop
      const wordHeight = wordElement.offsetHeight
      
      container.scrollTop = wordTop - containerCenter + wordHeight / 2
      
      // Posicionar la línea guía debajo de la palabra actual
      if (guideLine) {
        guideLine.style.top = `${wordTop + wordHeight}px`
      }
    }
  }, [currentIndex])

  return (
    <div 
      ref={containerRef}
      className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-6 shadow-lg h-60 overflow-y-auto overflow-x-hidden w-[80vw] max-w-3xl mx-auto"
    >
      <div className="relative">
        {/* Línea de guía para lectura */}
        <div ref={guideLineRef} className="absolute left-0 right-0 h-[2px] bg-blue-200 dark:bg-blue-700/50 opacity-70"></div>
        
        <div className="text-slate-700 dark:text-slate-200 leading-relaxed text-lg">
          {words.map((word, index) => {
            const isCurrent = index === currentIndex
            
            return (
              <span 
                key={index}
                ref={isCurrent ? currentWordRef : null}
                className={`
                  ${                
                  isCurrent 
                    ? 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white px-1.5 py-0.5 rounded font-medium' 
                    : index < currentIndex 
                      ? 'text-slate-400 dark:text-slate-400' 
                      : ''
                } transition-all duration-300 mr-1.5 mb-1 inline-block text-xs`}
              >
                {word.text}
              </span>
            )
          })}
        </div>
      </div>
      
      <div className="mt-4 py-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
        {currentIndex + 1} / {words.length}
      </div>
    </div>
  )
}) 