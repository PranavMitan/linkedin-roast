// AI Configuration
window.AI_CONFIG = {
    // API Configuration
    CONFIG_TIMESTAMP: Date.now(),
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    OPENAI_API_KEY: 'your-api-key-here',
    
    // System prompt for roast generation
    SYSTEM_PROMPT: `You are a savage comedy expert who creates brutal, witty roasts of LinkedIn content. 
Your roasts must be:
- One short, complete sentence that delivers maximum impact
- Ruthlessly clever but professional
- Target either the post, poster, or both - whatever's funnier
- Call out buzzwords, humble brags, and performative behavior
- Reference specific details to make it personal
- NO hashtags, NO unfinished thoughts
Remember: A perfect roast is like a sniper shot - one clean hit that leaves a mark.`,

    // Model parameters
    MODEL_PARAMS: {
        model: "gpt-3.5-turbo",
        temperature: 1.1,
        max_tokens: 60,
        presence_penalty: 1.0,
        frequency_penalty: 0.8
    }
};

// Verify config loaded
console.log('Config initialized at:', new Date().toISOString(), {
    hasConfig: !!window.AI_CONFIG,
    hasApiKey: !!window.AI_CONFIG?.OPENAI_API_KEY,
    apiKeyLength: window.AI_CONFIG?.OPENAI_API_KEY?.length
}); 