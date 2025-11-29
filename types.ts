export interface DocumentChunk {
  id: string;
  text: string;
  source: string;
  embedding?: number[];
}

export interface SearchResult extends DocumentChunk {
  similarity: number;
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  sources?: SearchResult[]; // RAG sources used for this answer
  timestamp: number;
}

export interface AppState {
  documents: DocumentChunk[];
  isIndexing: boolean;
}
