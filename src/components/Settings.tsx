import { HiViewColumns, HiBolt } from 'react-icons/hi2'

interface SettingsProps {
  totalCells: number
  wordsPerMinute: number
  onTotalCellsChange: (value: number) => void
  onWordsPerMinuteChange: (value: number) => void
}

export const Settings = ({
  totalCells,
  wordsPerMinute,
  onTotalCellsChange,
  onWordsPerMinuteChange,
}: SettingsProps) => {
  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
      <div className="w-full grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <HiViewColumns className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium">Celdas Visibles</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Mínimo: 10</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">Máximo: 30</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="30"
                value={totalCells}
                onChange={(e) => onTotalCellsChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-blue-600"
              />
              <span className="w-12 text-center font-mono text-lg font-medium text-blue-600 dark:text-blue-400">
                {totalCells}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 text-violet-600 dark:text-violet-400">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <HiBolt className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium">Palabras por Minuto</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Mínimo: 50</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">Máximo: 600</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="50"
                max="600"
                step="50"
                value={wordsPerMinute}
                onChange={(e) => onWordsPerMinuteChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-violet-600"
              />
              <span className="w-16 text-center font-mono text-lg font-medium text-violet-600 dark:text-violet-400">
                {wordsPerMinute}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 