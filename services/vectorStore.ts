import { DocumentChunk, SearchResult } from '../types';
import { getEmbeddings } from './gemini';

// In a real production app, this would communicate with a backend ChromaDB instance.
// Here, we simulate the Vector DB behavior in-memory for the demo.

const SIMILARITY_THRESHOLD = 0.4; // Min cosine similarity to be considered relevant

class VectorStore {
  private chunks: DocumentChunk[] = [];

  // Cosine Similarity Algorithm
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async addDocuments(documents: { title: string, content: string }[]): Promise<void> {
    for (const doc of documents) {
      // Simple chunking strategy: Split by double newlines or naive character count
      // For legal docs, paragraphs usually suffice.
      const rawChunks = doc.content.split(/\n\s*\n/); 
      
      for (let i = 0; i < rawChunks.length; i++) {
        const text = rawChunks[i].trim();
        if (text.length < 50) continue; // Skip very short noise chunks

        try {
          const embedding = await getEmbeddings(text);
          this.chunks.push({
            id: `${doc.title}-${i}-${Date.now()}`,
            text,
            source: doc.title,
            embedding
          });
        } catch (e) {
          console.error(`Failed to embed chunk from ${doc.title}`, e);
          // Continue with other chunks even if one fails
        }
      }
    }
  }

  async search(query: string, topK: number = 4): Promise<SearchResult[]> {
    if (this.chunks.length === 0) return [];

    try {
      const queryEmbedding = await getEmbeddings(query);
      
      const results: SearchResult[] = this.chunks.map(chunk => {
        if (!chunk.embedding) return { ...chunk, similarity: 0 };
        return {
          ...chunk,
          similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
        };
      });

      // Sort by similarity descending
      results.sort((a, b) => b.similarity - a.similarity);

      // Filter by threshold and return top K
      return results.filter(r => r.similarity > SIMILARITY_THRESHOLD).slice(0, topK);
    } catch (e) {
      console.error("Search failed", e);
      return [];
    }
  }

  getStats() {
    return {
      totalChunks: this.chunks.length,
      documents: new Set(this.chunks.map(c => c.source)).size
    };
  }
}

export const vectorStore = new VectorStore();
