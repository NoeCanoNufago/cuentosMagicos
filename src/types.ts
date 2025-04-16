export interface Theme {
  isDark: boolean;
}

export interface Word {
  text: string;
  orpIndex: number;
}

export interface Bookmark {
  position: number;
  note?: string;
  timestamp: string;
}

export interface Reading {
  id?: string;
  name: string;
  content: string;
  type: 'predefined' | 'custom';
  lastPosition?: number;
  bookmarks?: Bookmark[];
  path?: string; // Ruta del archivo para tracking
} 