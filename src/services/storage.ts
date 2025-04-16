import { Reading, ReadingBookmark } from '../types';

const STORAGE_KEYS = {
  READINGS: 'readings',
  THEME: 'theme',
  SETTINGS: 'settings',
} as const;

interface Settings {
  totalCells: number;
  wordsPerMinute: number;
  volume: number;
}

const DEFAULT_SETTINGS: Settings = {
  totalCells: 13,
  wordsPerMinute: 50,
  volume: 0.5
};

class StorageService {
  private readings: Map<string, Reading>;

  constructor() {
    this.readings = new Map();
    this.loadReadings();
  }

  private loadReadings(): void {
    const savedReadings = localStorage.getItem(STORAGE_KEYS.READINGS);
    if (savedReadings) {
      const readings = JSON.parse(savedReadings) as Reading[];
      readings.forEach(reading => {
        if (reading.id) {
          this.readings.set(reading.id, {
            ...reading,
            bookmarks: reading.bookmarks || []
          });
        }
      });
    }
  }

  private saveReadings(): void {
    const readings = Array.from(this.readings.values());
    localStorage.setItem(STORAGE_KEYS.READINGS, JSON.stringify(readings));
  }

  public getReading(id: string): Reading | undefined {
    return this.readings.get(id);
  }

  public getAllReadings(): Reading[] {
    return Array.from(this.readings.values());
  }

  public addReading(reading: Omit<Reading, 'id' | 'timestamp' | 'lastPosition' | 'bookmarks'>): Reading {
    const newReading: Reading = {
      ...reading,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      lastPosition: 0,
      bookmarks: []
    };
    if (newReading.id) {
      this.readings.set(newReading.id, newReading);
      this.saveReadings();
    }
    return newReading;
  }

  public updateReadingPosition(id: string, position: number): void {
    const reading = this.readings.get(id);
    if (reading) {
      reading.lastPosition = position;
      this.saveReadings();
    }
  }

  public addBookmark(readingId: string, bookmark: Omit<ReadingBookmark, 'timestamp'>): void {
    const reading = this.readings.get(readingId);
    if (reading) {
      if (!reading.bookmarks) {
        reading.bookmarks = [];
      }
      reading.bookmarks.push({
        ...bookmark,
        timestamp: new Date().toISOString()
      });
      this.saveReadings();
    }
  }

  public removeBookmark(readingId: string, bookmarkIndex: number): void {
    const reading = this.readings.get(readingId);
    if (reading && reading.bookmarks && reading.bookmarks[bookmarkIndex]) {
      reading.bookmarks.splice(bookmarkIndex, 1);
      this.saveReadings();
    }
  }

  public deleteReading(id: string): void {
    this.readings.delete(id);
    this.saveReadings();
  }

  public getSettings(): Settings {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        return {
          ...DEFAULT_SETTINGS,
          ...parsedSettings
        };
      } catch (error) {
        console.error('Error al cargar la configuración:', error);
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  }

  public setSettings(settings: Settings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
    }
  }

  public getTheme(): 'light' | 'dark' {
    return localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark' || 'light';
  }

  public setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }
}

export const storageService = new StorageService(); 