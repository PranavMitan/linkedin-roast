class AIService {
    constructor() {
        console.log('=== AIService Constructor Start ===');
        this.config = window.AI_CONFIG;
        this.cache = new Map();
        console.log('Config loaded:', {
            hasConfig: !!this.config,
            apiUrl: this.config?.API_URL
        });
        console.log('=== AIService Constructor End ===');
    }

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

            console.log('Making API request to:', this.config.API_URL);

            // Make API request to Supabase Edge Function
            const response = await fetch(this.config.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: postText
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

            if (!result.roast) {
                throw new Error('Invalid response format');
            }

            // Cache and return the roast
            const roast = result.roast.trim();
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