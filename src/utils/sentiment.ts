import { SentimentAnalysis } from '../agent/types.js';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import config from '../config/index.js';

/**
 * Utility for analyzing message sentiment
 */
export class SentimentAnalyzer {
  private llm: ChatOpenAI;
  
  constructor() {
    // Initialize the LLM
    this.llm = new ChatOpenAI({
      modelName: config.openai.model,
      temperature: 0.1, // Use lower temperature for more consistent analysis
      openAIApiKey: config.openai.apiKey,
    });
  }
  
  /**
   * Analyze the sentiment of a message
   * @param message Message to analyze
   * @returns Sentiment analysis result
   */
  async analyzeSentiment(message: string): Promise<SentimentAnalysis> {
    try {
      // Define system prompt for sentiment analysis
      const systemPrompt = `Analyze the sentiment of the following message. 
Provide a JSON response with:
- score: a number from -1 (extremely negative) to 1 (extremely positive)
- category: one of "negative", "neutral", or "positive"
- emotions: an object containing detected emotions and their intensity from 0-1

Example response format:
{
  "score": -0.7,
  "category": "negative",
  "emotions": {
    "frustration": 0.8,
    "anger": 0.6,
    "disappointment": 0.7
  }
}`;

      const result = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(message)
      ]);
      
      try {
        // Parse the response as JSON
        const jsonString = result.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
          
        const sentimentResult = JSON.parse(jsonString) as SentimentAnalysis;
        
        // Validate that required fields are present
        if (typeof sentimentResult.score !== 'number' || !sentimentResult.category) {
          throw new Error('Invalid sentiment analysis result format');
        }
        
        return sentimentResult;
      } catch (error) {
        console.error('Error parsing sentiment analysis result:', error);
        
        // Fallback to basic sentiment analysis
        const content = result.content.toLowerCase();
        let score = 0;
        
        // Extremely simple fallback based on keywords
        if (content.includes('negative')) score = -0.5;
        else if (content.includes('positive')) score = 0.5;
        
        // Determine category based on score
        let category: 'negative' | 'neutral' | 'positive' = 'neutral';
        if (score < -0.1) category = 'negative';
        else if (score > 0.1) category = 'positive';
        
        return {
          score,
          category,
          emotions: {},
        };
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      
      // Return neutral sentiment in case of error
      return {
        score: 0,
        category: 'neutral',
        emotions: {},
      };
    }
  }
  
  /**
   * Check if a message contains sensitive topics
   * @param message Message to analyze
   * @returns Object indicating if sensitive topics were detected
   */
  async checkSensitiveTopics(message: string): Promise<{
    containsSensitiveTopics: boolean;
    detectedTopics: string[];
  }> {
    try {
      const sensitiveTopics = config.agent.humanHandoff.sensitiveTopics;
      const topicsStr = sensitiveTopics.join(', ');
      
      // Define system prompt for topic detection
      const systemPrompt = `Analyze the following message and determine if it contains any of these sensitive topics: ${topicsStr}.
Provide a JSON response with:
- containsSensitiveTopics: boolean
- detectedTopics: array of strings (empty if none detected)

Example response format:
{
  "containsSensitiveTopics": true,
  "detectedTopics": ["billing dispute", "refund request"]
}`;

      const result = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(message)
      ]);
      
      try {
        // Parse the response as JSON
        const jsonString = result.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
          
        const topicResult = JSON.parse(jsonString) as {
          containsSensitiveTopics: boolean;
          detectedTopics: string[];
        };
        
        // Ensure detectedTopics is an array
        if (!Array.isArray(topicResult.detectedTopics)) {
          topicResult.detectedTopics = [];
        }
        
        return topicResult;
      } catch (error) {
        console.error('Error parsing topic detection result:', error);
        
        // Fallback to basic check using keyword matching
        let containsSensitiveTopics = false;
        const detectedTopics: string[] = [];
        
        const lowerMessage = message.toLowerCase();
        for (const topic of sensitiveTopics) {
          if (lowerMessage.includes(topic.toLowerCase())) {
            containsSensitiveTopics = true;
            detectedTopics.push(topic);
          }
        }
        
        return {
          containsSensitiveTopics,
          detectedTopics,
        };
      }
    } catch (error) {
      console.error('Error checking sensitive topics:', error);
      
      // Return no sensitive topics in case of error
      return {
        containsSensitiveTopics: false,
        detectedTopics: [],
      };
    }
  }
}

// Export singleton instance
export const sentimentAnalyzer = new SentimentAnalyzer();