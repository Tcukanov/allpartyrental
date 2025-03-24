// src/lib/ai/moderation.js

/**
 * AI Moderation Service
 * Handles filtering contact information, profanity and price dumping
 */

// Import OpenAI for content moderation
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const moderationService = {
  /**
   * Moderates chat messages for contact information, profanity, and price dumping
   * @param {string} content - Message content to be moderated
   * @param {Object} options - Moderation options
   * @param {boolean} options.filterContactInfo - Whether to filter contact information
   * @param {boolean} options.filterProfanity - Whether to filter profanity
   * @param {boolean} options.checkPriceDumping - Whether to check for price dumping
   * @param {number} options.medianPrice - Median price for the service (for price dumping checks)
   * @returns {Promise<Object>} - Moderation result with potentially filtered content
   */
  moderateMessage: async (content, options = {}) => {
    const {
      filterContactInfo = true,
      filterProfanity = true,
      checkPriceDumping = false,
      medianPrice = null
    } = options;
    
    try {
      // Original content for comparison and logging
      const originalContent = content;
      let moderatedContent = content;
      let isFlagged = false;
      let flagReasons = [];
      
      // Filter contact information if enabled
      if (filterContactInfo) {
        const contactInfoResult = await filterContactInformation(moderatedContent);
        if (contactInfoResult.hasContactInfo) {
          moderatedContent = contactInfoResult.filteredContent;
          isFlagged = true;
          flagReasons.push('contact_information');
        }
      }
      
      // Filter profanity if enabled
      if (filterProfanity) {
        const profanityResult = await checkProfanity(moderatedContent);
        if (profanityResult.hasProfanity) {
          moderatedContent = profanityResult.filteredContent;
          isFlagged = true;
          flagReasons.push('profanity');
        }
      }
      
      // Check for price dumping if enabled
      if (checkPriceDumping && medianPrice !== null) {
        const priceDumpingResult = await checkForPriceDumping(moderatedContent, medianPrice);
        if (priceDumpingResult.isPriceDumping) {
          isFlagged = true;
          flagReasons.push('price_dumping');
        }
      }
      
      return {
        success: true,
        data: {
          originalContent,
          moderatedContent,
          isFlagged,
          flagReasons: flagReasons.length > 0 ? flagReasons : null,
          hasChanges: originalContent !== moderatedContent
        }
      };
    } catch (error) {
      console.error('Moderation error:', error);
      return {
        success: false,
        error: {
          code: 'MODERATION_ERROR',
          message: error.message
        },
        // Return the original content if moderation fails
        data: {
          originalContent: content,
          moderatedContent: content,
          isFlagged: false,
          flagReasons: null,
          hasChanges: false
        }
      };
    }
  },
  
  /**
   * Analyzes message for potential moderation issues without applying filters
   * @param {string} content - Message content to analyze
   * @returns {Promise<Object>} - Analysis results
   */
  analyzeMessage: async (content) => {
    try {
      // Use OpenAI's moderation endpoint to analyze the content
      const moderation = await openai.moderations.create({
        input: content,
      });
      
      // Check for various flags
      const results = moderation.results[0];
      
      // Analyze for contact information
      const contactInfoResult = await detectContactInformation(content);
      
      // Combine results
      return {
        success: true,
        data: {
          flagged: results.flagged || contactInfoResult.hasContactInfo,
          categories: {
            ...results.categories,
            contactInformation: contactInfoResult.hasContactInfo
          },
          categoryScores: {
            ...results.category_scores,
            contactInformation: contactInfoResult.hasContactInfo ? 1 : 0
          }
        }
      };
    } catch (error) {
      console.error('Moderation analysis error:', error);
      return {
        success: false,
        error: {
          code: 'MODERATION_ANALYSIS_ERROR',
          message: error.message
        }
      };
    }
  }
};

/**
 * Detects contact information in text
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} - Detection result
 */
async function detectContactInformation(text) {
  try {
    // Regular expressions for detecting common contact information
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Check for matches
    const hasPhone = phoneRegex.test(text);
    const hasEmail = emailRegex.test(text);
    const hasUrl = urlRegex.test(text);
    const hasContactInfo = hasPhone || hasEmail || hasUrl;
    
    return {
      hasContactInfo,
      types: {
        phone: hasPhone,
        email: hasEmail,
        url: hasUrl
      }
    };
  } catch (error) {
    console.error('Contact info detection error:', error);
    return {
      hasContactInfo: false,
      types: {
        phone: false,
        email: false,
        url: false
      }
    };
  }
}

/**
 * Filters contact information from text
 * @param {string} text - Text to filter
 * @returns {Promise<Object>} - Filtered result
 */
async function filterContactInformation(text) {
  try {
    // Use the detection function first
    const detection = await detectContactInformation(text);
    
    if (!detection.hasContactInfo) {
      return {
        hasContactInfo: false,
        filteredContent: text
      };
    }
    
    // Regular expressions for filtering different types of contact info
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Replace with placeholders
    let filteredContent = text;
    
    if (detection.types.phone) {
      filteredContent = filteredContent.replace(phoneRegex, '[Phone number removed]');
    }
    
    if (detection.types.email) {
      filteredContent = filteredContent.replace(emailRegex, '[Email removed]');
    }
    
    if (detection.types.url) {
      filteredContent = filteredContent.replace(urlRegex, '[URL removed]');
    }
    
    return {
      hasContactInfo: true,
      filteredContent
    };
  } catch (error) {
    console.error('Contact info filtering error:', error);
    return {
      hasContactInfo: false,
      filteredContent: text
    };
  }
}

/**
 * Checks for profanity in text
 * @param {string} text - Text to check
 * @returns {Promise<Object>} - Check result
 */
async function checkProfanity(text) {
  try {
    // Use OpenAI's moderation endpoint to check for profanity
    const moderation = await openai.moderations.create({
      input: text,
    });
    
    const results = moderation.results[0];
    const hasProfanity = results.categories.hate || results.categories.harassment || 
                          results.categories.sexual || results.categories.violence;
    
    // If profanity detected, use asterisks to censor words
    if (hasProfanity) {
      // For a simple implementation, we'll use OpenAI to help rewrite the content
      const completion = await openai.completions.create({
        model: "text-davinci-003",
        prompt: `The following text contains inappropriate language. Rewrite it by replacing inappropriate words with asterisks (e.g., "f***"), keeping the meaning intact where possible:\n\n${text}`,
        max_tokens: 150,
        temperature: 0.3,
      });
      
      return {
        hasProfanity,
        filteredContent: completion.choices[0].text.trim()
      };
    }
    
    return {
      hasProfanity,
      filteredContent: text
    };
  } catch (error) {
    console.error('Profanity check error:', error);
    return {
      hasProfanity: false,
      filteredContent: text
    };
  }
}

/**
 * Checks for price dumping in text
 * @param {string} text - Text to check
 * @param {number} medianPrice - Median price for the service
 * @returns {Promise<Object>} - Check result
 */
async function checkForPriceDumping(text, medianPrice) {
  try {
    // Extract potential price mentions using regex
    const priceRegex = /\$\s?(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s?(?:dollars|USD)/gi;
    const matches = [...text.matchAll(priceRegex)];
    
    if (matches.length === 0) {
      return {
        isPriceDumping: false
      };
    }
    
    // Extract the numerical values from the matches
    const prices = matches.map(match => {
      // The price could be in the first or second capture group
      const priceStr = match[1] || match[2];
      return parseFloat(priceStr);
    });
    
    // Check if any price is significantly lower than the median (e.g., 40% below)
    const dumpingThreshold = medianPrice * 0.6;
    const isPriceDumping = prices.some(price => price < dumpingThreshold);
    
    return {
      isPriceDumping,
      detectedPrices: prices,
      medianPrice,
      dumpingThreshold
    };
  } catch (error) {
    console.error('Price dumping check error:', error);
    return {
      isPriceDumping: false
    };
  }
}