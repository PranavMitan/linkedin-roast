/** @typedef {Object} AIConfig
 * @property {string} API_URL - The Firebase function URL
 * @property {string} SYSTEM_PROMPT - The system prompt for roast generation
 * @property {Object} MODEL_PARAMS - The model parameters
 */

/** Class representing the AI service for roast generation */
class AIService {
    constructor() {
        console.log('=== AIService Constructor Start ===');
        /** @type {AIConfig} */
        this.config = window.AI_CONFIG;
        /** @type {Map<string, string>} */
        this.cache = new Map();
        console.log('Config loaded:', {
            hasConfig: !!this.config,
            apiUrl: this.config?.API_URL
        });
        console.log('=== AIService Constructor End ===');
    }

    /**
     * Generates a roast for a LinkedIn post
     * @param {string} postText - The LinkedIn post text to roast
     * @returns {Promise<string>} The generated roast
     * @throws {Error} If the post is empty or API call fails
     */
    async generateRoast(postText) {
        try {
            // Check cache first
            const cacheKey = postText.trim().toLowerCase();
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            if (!postText?.trim()) {
                throw new Error('Empty post content');
            }

            // Make API request to Firebase function
            const response = await fetch(this.config.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    postText: postText
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const roast = result.roast;

            // Cache and return the roast
            this.cache.set(cacheKey, roast);
            return roast;

        } catch (error) {
            console.error('Failed to generate roast:', error);
            throw error;
        }
    }
}

// Export the class only, don't create an instance
window.AIService = AIService; 