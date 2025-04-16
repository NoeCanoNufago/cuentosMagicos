import { Word } from '../types'

interface WordDisplayProps {
  word: Word | null
  totalCells: number
}

export const WordDisplay = ({ word, totalCells }: WordDisplayProps) => {
  if (!word) {
    return (
      <div className="bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-700 p-12 rounded-2xl shadow-xl text-center transform transition-all duration-300">
        <div className="max-w-md mx-auto">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4 font-serif">
            ¡Bienvenido al Lector Mágico! ✨
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Sube un archivo de texto o PDF para comenzar tu aventura de lectura 📚
          </p>
        </div>
      </div>
    )
  }

  const row = new Array(totalCells).fill('')
  const startIndex = 3 - word.orpIndex

  // Prefijo
  for (let i = 0; i < word.orpIndex; i++) {
    if (startIndex + i >= 0 && startIndex + i < totalCells) {
      row[startIndex + i] = word.text[i]
    }
  }

  // ORP
  row[3] = `<span class="text-blue-600 dark:text-blue-400 font-bold relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400 after:animate-pulse">${word.text[word.orpIndex]}</span>`

  // Sufijo
  let usedSuffix = 0
  for (let i = word.orpIndex + 1; i < word.text.length && (4 + usedSuffix) < totalCells; i++) {
    row[4 + usedSuffix] = word.text[i]
    usedSuffix++
  }

  return (
    <div className="w-[100%] bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-700 py-12 px-0 rounded-2xl shadow-xl transition-all duration-300">
      <div className="w-full flex justify-center flex-wrap gap-0">
        {row.map((cell, index) => (
          <div
            key={index}
            className="w-[0.7rem] h-12 flex items-center justify-center text-xl font-medium text-slate-700 dark:text-slate-200
             rounded-lg shadow-sm backdrop-blur-sm transform hover:scale-105 transition-all duration-200"
            dangerouslySetInnerHTML={{ __html: cell || '&nbsp;' }}
          />
        ))}
      </div>

      {word.text.length > totalCells && (
        <div className="flex justify-center flex-wrap gap-1 mt-6">
          {word.text.slice(totalCells).split('').map((char, index) => (
            <div
              key={index}
              className="w-[0.7rem] h-12 flex items-center justify-center text-xl font-medium text-slate-700 dark:text-slate-200
               rounded-lg shadow-sm backdrop-blur-sm transform hover:scale-105 transition-all duration-200"
            >
              {char}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 