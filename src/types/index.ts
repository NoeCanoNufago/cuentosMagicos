export interface Word {
  text: string;
  orpIndex: number;
}

export interface AudioSource {
  id: string;
  name: string;
  url: string;
}

export interface Theme {
  isDark: boolean;
}

export interface Bookmark {
  fileName: string;
  index: number;
  timestamp: string;
}

export interface FileInfo {
  name: string;
  content: string;
  type: 'pdf' | 'txt';
  timestamp: string;
}

export interface ReadingBookmark {
  position: number;
  note?: string;
  timestamp: string;
}

export interface GitHubDir {
  name: string;
  path: string;
  url: string;
  type: 'dir';
}

export interface GitHubFile {
  name: string;
  path: string;
  url: string;
  download_url: string;
  type: 'file';
}

export interface Reading {
  id?: string;
  name: string;
  content?: string;
  path?: string;
  type: 'predefined' | 'custom';
  category?: string;
  timestamp?: string;
  lastPosition?: number;
  bookmarks?: ReadingBookmark[];
} 