import { HiPlay, HiPause, HiForward, HiArrowPath, HiBookmark, HiXMark } from 'react-icons/hi2'
import { ReadingBookmark } from '../types'
import { ReadingProgress } from './ReadingProgress'

interface ReadingControlsProps {
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onReset: () => void
  disabled: boolean
  currentPosition: number
  totalWords: number
  words: { text: string }[]
  bookmarks: ReadingBookmark[]
  onAddBookmark: (position: number, note?: string) => void
  onJumpToBookmark: (position: number) => void
  onRemoveBookmark: (index: number) => void
  onPositionChange: (position: number) => void
}

export const ReadingControls = ({
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onReset,
  disabled,
  currentPosition,
  totalWords,
  words,
  bookmarks,
  onAddBookmark,
  onJumpToBookmark,
  onRemoveBookmark,
  onPositionChange
}: ReadingControlsProps) => {
  const buttonBaseClasses = `
    w-14 h-14 flex items-center justify-center rounded-full
    transition-all duration-200 transform
    ${disabled 
      ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed opacity-50' 
      : 'hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl'
    }
  `

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={onReset}
          disabled={disabled}
          className={`${buttonBaseClasses} ${
            disabled ? '' : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
          title="Reiniciar"
        >
          <HiArrowPath className="w-7 h-7" />
        </button>

        {isPlaying ? (
          <button
            onClick={onPause}
            disabled={disabled}
            className={`${buttonBaseClasses} ${
              disabled ? '' : 'bg-red-500 text-white hover:bg-red-600'
            }`}
            title="Pausar"
          >
            <HiPause className="w-7 h-7" />
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={disabled}
            className={`${buttonBaseClasses} ${
              disabled ? '' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            title="Reproducir"
          >
            <HiPlay className="w-7 h-7" />
          </button>
        )}

        <button
          onClick={onNext}
          disabled={disabled}
          className={`${buttonBaseClasses} ${
            disabled ? '' : 'bg-violet-500 text-white hover:bg-violet-600'
          }`}
          title="Siguiente"
        >
          <HiForward className="w-7 h-7" />
        </button>

        <button
          onClick={() => onAddBookmark(currentPosition)}
          disabled={disabled}
          className={`${buttonBaseClasses} ${
            disabled ? '' : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
          title="Agregar marcador"
        >
          <HiBookmark className="w-7 h-7" />
        </button>
      </div>

      <ReadingProgress
        currentPosition={currentPosition}
        totalWords={totalWords}
        words={words}
        onPositionChange={onPositionChange}
        disabled={disabled || isPlaying}
      />

      {bookmarks.length > 0 && (
        <div className="w-full max-w-2xl">
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <HiBookmark className="w-5 h-5 text-emerald-500" />
            Marcadores
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bookmarks.map((bookmark, index) => (
              <div
                key={bookmark.timestamp}
                className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <button
                  onClick={() => onJumpToBookmark(bookmark.position)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <HiBookmark className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Posición {bookmark.position}
                  </span>
                </button>
                <button
                  onClick={() => onRemoveBookmark(index)}
                  className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-all"
                  title="Eliminar marcador"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 