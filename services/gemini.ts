import { GoogleGenAI } from "@google/genai";
import { GEMINI_CHAT_MODEL, GEMINI_EMBEDDING_MODEL } from '../constants';
import { Message, MessageRole, SearchResult } from '../types';

let genAI: GoogleGenAI | null = null;

const getAI = () => {
  if (!genAI) {
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing");
    }
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

export const getEmbeddings = async (text: string): Promise<number[]> => {
  const ai = getAI();
  try {
    // The SDK expects 'contents' (plural) and can accept a simple string for embedding.
    const result = await ai.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: text,
    });
    
    // The response contains an array of embeddings
    if (result.embeddings && result.embeddings.length > 0 && result.embeddings[0].values) {
      return result.embeddings[0].values;
    }
    throw new Error("Failed to generate embeddings: No values returned in response");
  } catch (error) {
    console.error("Embedding error:", error);
    throw error;
  }
};

export const generateLegalResponse = async (
  history: Message[],
  contextChunks: SearchResult[],
  userQuery: string
): Promise<string> => {
  const ai = getAI();
  
  // Construct a context-aware system prompt
  const contextText = contextChunks.map(c => `[Source: ${c.source}]\n${c.text}`).join("\n\n");
  
  const systemInstruction = `You are an expert legal assistant specializing in Pakistan Law. 
  Your goal is to answer the user's question accurately using ONLY the provided context snippets below.
  
  ---
  CONTEXT:
  ${contextText}
  ---
  
  INSTRUCTIONS:
  1. If the answer is found in the CONTEXT, provide a detailed, professional legal explanation.
  2. Cite the specific articles, sections, or source names provided in the context (e.g., "According to Article 1...").
  3. If the answer is NOT in the CONTEXT, politely state that you do not have that information in your current database. Do not hallucinate or use outside knowledge.
  4. Maintain a formal, authoritative tone suitable for legal counsel.
  5. Format your response with clear Markdown headings and bullet points where appropriate.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_CHAT_MODEL,
      contents: userQuery,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Low temperature for factual accuracy
      }
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Generation error:", error);
    return "I encountered an error while analyzing the legal documents. Please try again.";
  }
};