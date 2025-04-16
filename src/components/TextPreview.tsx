import { Word } from '../types'
import { memo, useEffect, useRef, useMemo, useState } from 'react'

interface TextPreviewProps {
  words: Word[]
  currentIndex: number
}

interface TextLine {
  words: Word[]
  startIndex: number
  endIndex: number
}

export const TextPreview = memo(({ words, currentIndex }: TextPreviewProps) => {
  if (!words.length) return null

  const containerRef = useRef<HTMLDivElement>(null)
  const currentLineRef = useRef<HTMLDivElement>(null)
  const guideLineRef = useRef<HTMLDivElement>(null)
  const [wordsPerLine, setWordsPerLine] = useState(20)

  // Calcular palabras por línea según el ancho del contenedor
  useEffect(() => {
    const calculateWordsPerLine = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Estimamos que cada palabra ocupa aproximadamente 50px en promedio
        // Este valor puede ajustarse según el tamaño de fuente y otros factores
        const avgWordWidth = 50;
        const estimatedWordsPerLine = Math.max(5, Math.floor(containerWidth / avgWordWidth));
        setWordsPerLine(estimatedWordsPerLine);
      }
    };

    calculateWordsPerLine();
    
    // Recalcular cuando la ventana cambia de tamaño
    window.addEventListener('resize', calculateWordsPerLine);
    return () => window.removeEventListener('resize', calculateWordsPerLine);
  }, []);
  
  // Organizar palabras en líneas fijas
  const textLines = useMemo(() => {
    const lines: TextLine[] = []
    for (let i = 0; i < words.length; i += wordsPerLine) {
      const lineWords = words.slice(i, i + wordsPerLine)
      lines.push({
        words: lineWords,
        startIndex: i,
        endIndex: Math.min(i + wordsPerLine - 1, words.length - 1)
      })
    }
    return lines
  }, [words, wordsPerLine])

  // Encontrar la línea actual basada en el índice de la palabra
  const currentLineIndex = useMemo(() => {
    return Math.floor(currentIndex / wordsPerLine)
  }, [currentIndex, wordsPerLine])

  // Limitar las líneas visibles para mejorar el rendimiento
  const VISIBLE_LINES = 5 // Cantidad de líneas visibles
  const startLineIndex = Math.max(0, currentLineIndex - Math.floor(VISIBLE_LINES / 2))
  const endLineIndex = Math.min(textLines.length, startLineIndex + VISIBLE_LINES)
  const visibleLines = textLines.slice(startLineIndex, endLineIndex)

  // Efecto para mantener la línea actual visible
  useEffect(() => {
    if (currentLineRef.current && containerRef.current) {
      const container = containerRef.current
      const lineElement = currentLineRef.current
      const guideLine = guideLineRef.current
      
      // Calcular posición para centrar la línea en la vista
      const containerCenter = container.offsetHeight / 2
      const lineTop = lineElement.offsetTop
      const lineHeight = lineElement.offsetHeight
      
      container.scrollTop = lineTop - containerCenter + lineHeight / 2
      
      // Posicionar la línea guía debajo de la línea actual
      if (guideLine) {
        guideLine.style.top = `${lineTop + lineHeight}px`
      }
    }
  }, [currentLineIndex])

  return (
    <div 
      ref={containerRef}
      className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-6 shadow-lg h-76 overflow-y-auto overflow-x-hidden w-[80vw] max-w-3xl mx-auto"
    >
      <div className="relative">
        {/* Línea de guía para lectura */}
        <div ref={guideLineRef} className="absolute left-0 right-0 h-[2px] bg-blue-200 dark:bg-blue-700/50 opacity-70"></div>
        
        <div className="text-slate-700 dark:text-slate-200 leading-relaxed text-lg">
          {startLineIndex > 0 && <div className="text-gray-400 text-center">...</div>}
          
          {visibleLines.map((line, lineIdx) => {
            const isCurrentLine = startLineIndex + lineIdx === currentLineIndex;
            
            return (
              <div 
                key={line.startIndex}
                ref={isCurrentLine ? currentLineRef : null}
                className={`mb-3 flex flex-wrap justify-center`}
              >
                {line.words.map((word, wordIdx) => {
                  const actualIndex = line.startIndex + wordIdx
                  const isCurrent = actualIndex === currentIndex
                  
                  return (
                    <span 
                      key={actualIndex}
                      className={`
                        ${                
                        isCurrent 
                          ? 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white rounded font-medium' 
                          : actualIndex < currentIndex 
                            ? 'text-slate-400 dark:text-slate-400' 
                            : ''
                      }  mr-1.5 inline-block whitespace-nowrap word-break-keep-all text-xs`}
                    >
                      {word.text}
                    </span>
                  )
                })}
              </div>
            )
          })}
          
          {endLineIndex < textLines.length && <div className="text-gray-400 text-center">...</div>}
        </div>
      </div>
      
      <div className="mt-4 py-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
        {currentIndex + 1} / {words.length}
      </div>
    </div>
  )
}) 
