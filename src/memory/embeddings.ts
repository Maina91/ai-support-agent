import { OpenAIEmbeddings } from '@langchain/openai';
import { CacheBackedEmbeddings } from '@langchain/core/embeddings';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import config from '../config/index.js';

/**
 * Manages the generation and caching of embeddings
 */
export class EmbeddingsManager {
  private embeddingsModel: OpenAIEmbeddings;
  private vectorStore: MemoryVectorStore;
  private cache: Map<string, number[]> = new Map();
  
  constructor() {
    // Initialize the embeddings model
    this.embeddingsModel = new OpenAIEmbeddings({
      openAIApiKey: config.openai.apiKey,
      modelName: 'text-embedding-3-small',
      dimensions: 1536,
    });
    
    // Initialize a local vector store for testing
    this.vectorStore = new MemoryVectorStore(this.embeddingsModel);
  }

  /**
   * Generates an embedding for a text string
   * @param text The text to generate an embedding for
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.cache.has(text)) {
      return this.cache.get(text)!;
    }
    
    // Generate embedding
    const embeddings = await this.embeddingsModel.embedQuery(text);
    
    // Cache the result
    this.cache.set(text, embeddings);
    
    return embeddings;
  }

  /**
   * Add a document to the vector store
   * @param text The document text
   * @param metadata Optional metadata
   */
  async addDocument(text: string, metadata: Record<string, any> = {}): Promise<string> {
    const ids = await this.vectorStore.addDocuments(
      [{ pageContent: text, metadata }]
    );
    return ids[0];
  }

  /**
   * Search the vector store for similar documents
   * @param query The query text
   * @param limit Maximum number of results to return
   */
  async similaritySearch(query: string, limit = 5) {
    const results = await this.vectorStore.similaritySearch(query, limit);
    return results;
  }
}