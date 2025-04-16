import React from 'react';
import { Settings } from './Settings';
import { HiSpeakerWave } from 'react-icons/hi2';

interface SettingsPanelProps {
  totalCells: number;
  wordsPerMinute: number;
  onTotalCellsChange: (value: number) => void;
  onWordsPerMinuteChange: (value: number) => void;
  volume: number;
  onVolumeChange: (value: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  totalCells,
  wordsPerMinute,
  onTotalCellsChange,
  onWordsPerMinuteChange,
  volume,
  onVolumeChange
}) => {
  return (
    <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
      <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-8 font-serif">
        Configuración
      </h2>
      
      <div className="w-full space-y-8">
        <div>
          <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-6">
            Configuración de Lectura
          </h3>
          <Settings
            totalCells={totalCells}
            wordsPerMinute={wordsPerMinute}
            onTotalCellsChange={onTotalCellsChange}
            onWordsPerMinuteChange={onWordsPerMinuteChange}
          />
        </div>

        <div>
          <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-6">
            Configuración de Audio
          </h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <HiSpeakerWave className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-medium">Volumen de Música</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Silencio</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Máximo</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-amber-600"
                  />
                  <span className="w-16 text-center font-mono text-lg font-medium text-amber-600 dark:text-amber-400">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 