/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import fetch from 'node-fetch';
import cors from 'cors';
import { setTimeout } from 'timers/promises';

const corsMiddleware = cors({ 
    origin: ['https://www.linkedin.com', 'https://linkedin.com'],
    methods: ['POST']
});

// Rate limiting setup
const rateLimit = new Map();
const postRoastCount = new Map(); // Track roasts per post
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS_PER_HOUR = 30;
const MAX_ROASTS_PER_POST = 3; // Limit roasts per post

function getRemainingTime(timestamp) {
    const now = Date.now();
    const timeElapsed = now - timestamp;
    const timeRemaining = RATE_LIMIT_WINDOW - timeElapsed;
    return Math.ceil(timeRemaining / (60 * 1000)); // Convert to minutes
}

function isRateLimited(ip) {
    const now = Date.now();
    const userRequests = rateLimit.get(ip) || { count: 0, timestamp: now };
    
    // Reset if window has passed
    if (now - userRequests.timestamp >= RATE_LIMIT_WINDOW) {
        userRequests.count = 0;
        userRequests.timestamp = now;
    }
    
    // Check if limit exceeded
    if (userRequests.count >= MAX_REQUESTS_PER_HOUR) {
        return getRemainingTime(userRequests.timestamp);
    }
    
    // Update count
    userRequests.count++;
    rateLimit.set(ip, userRequests);
    return false;
}

function isPostLimitReached(postText) {
    const count = postRoastCount.get(postText) || 0;
    return count >= MAX_ROASTS_PER_POST;
}

function incrementPostCount(postText) {
    const count = postRoastCount.get(postText) || 0;
    postRoastCount.set(postText, count + 1);
}

const config = {
    // API Configuration
    CONFIG_TIMESTAMP: Date.now(),
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    get OPENAI_API_KEY() {
        try {
            // In v2, environment variables are accessed directly from process.env
            const key = process.env.OPENAI_KEY;
            
            if (!key) {
                logger.error('OpenAI API key not found in environment variables');
                return null;
            }
            
            // Log key details for debugging
            logger.info('API Key details:', {
                exists: !!key,
                length: key?.length,
                prefix: key?.substring(0, 8)
            });
            
            return key;
        } catch (error) {
            logger.error('Error accessing OpenAI API key:', error);
            return null;
        }
    },

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
        frequency_penalty: 0.8,
        top_p: 1
    }
};

// Request validation
function validateRequest(body) {
    if (!body?.postText) {
        return { valid: false, error: 'Missing required field: postText' };
    }
    if (typeof body.postText !== 'string') {
        return { valid: false, error: 'Invalid postText type: must be string' };
    }
    if (body.postText.trim().length === 0) {
        return { valid: false, error: 'Empty post content' };
    }
    if (body.postText.length > 5000) {
        return { valid: false, error: 'Post too long: maximum 5000 characters' };
    }
    return { valid: true };
}

async function checkOpenAIStatus() {
    try {
        const res = await fetch('https://status.openai.com/api/v2/status.json');
        const status = await res.json();
        return status?.status?.indicator === 'none';
    } catch (error) {
        logger.warn('Failed to check OpenAI status:', error);
        return true; // Assume service is up if we can't check
    }
}

async function makeRequestWithRetry(url, options, maxRetries = 3) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                // Exponential backoff: 1s, 2s, 4s
                await setTimeout(Math.pow(2, attempt) * 1000);
            }
            
            const res = await fetch(url, options);
            if (res.status === 500) {
                // Log the attempt number and response
                logger.error(`Attempt ${attempt + 1} failed with 500 error:`, {
                    status: res.status,
                    statusText: res.statusText,
                    body: await res.text()
                });
                continue; // Retry on 500 errors
            }
            return res;
        } catch (error) {
            lastError = error;
            logger.error(`Attempt ${attempt + 1} failed with error:`, error);
        }
    }
    throw lastError || new Error('All retry attempts failed');
}

export const generateRoast = onRequest({
    secrets: ["OPENAI_KEY"],
    cors: ['https://www.linkedin.com', 'https://linkedin.com'],
    maxInstances: 10
}, async (request, response) => {
    try {
        // Check OpenAI service status
        const isServiceUp = await checkOpenAIStatus();
        if (!isServiceUp) {
            response.status(503).json({
                error: 'Service unavailable',
                message: 'OpenAI service is currently experiencing issues. Please try again later.'
            });
            return;
        }

        // Log config state at the start
        const apiKey = process.env.OPENAI_KEY;
        logger.info('Function config:', {
            hasApiKey: !!apiKey,
            apiKeyLength: apiKey?.length || 0,
            apiKeyStart: apiKey ? apiKey.substring(0, 8) : null,
            apiUrl: config.OPENAI_API_URL
        });

        // Only allow POST
        if (request.method !== 'POST') {
            response.status(405).json({
                error: 'Method not allowed',
                message: 'Only POST requests are allowed'
            });
            return;
        }

        // Validate request
        const validation = validateRequest(request.body);
        if (!validation.valid) {
            response.status(400).json({
                error: 'Invalid request',
                message: validation.error
            });
            return;
        }

        const { postText } = request.body;
        logger.info("Generating roast for:", postText);

        // Verify API key before making request
        if (!apiKey) {
            logger.error('OpenAI API key is missing or invalid');
            response.status(500).json({
                error: 'Configuration error',
                message: 'API key is not configured properly'
            });
            return;
        }

        const res = await makeRequestWithRetry(config.OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: config.MODEL_PARAMS.model,
                messages: [
                    {
                        role: "system",
                        content: config.SYSTEM_PROMPT
                    },
                    {
                        role: "user",
                        content: `Roast this LinkedIn post (be creative and different from previous roasts): "${postText}"`
                    }
                ],
                temperature: config.MODEL_PARAMS.temperature,
                max_tokens: config.MODEL_PARAMS.max_tokens,
                presence_penalty: config.MODEL_PARAMS.presence_penalty,
                frequency_penalty: config.MODEL_PARAMS.frequency_penalty,
                top_p: config.MODEL_PARAMS.top_p
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            let parsedError = null;
            try {
                parsedError = JSON.parse(errorText);
            } catch (e) {
                // If parsing fails, use the raw error text
            }

            logger.error('OpenAI API Error:', {
                status: res.status,
                statusText: res.statusText,
                error: parsedError || errorText,
                hasApiKey: !!apiKey,
                apiKeyLength: apiKey?.length || 0
            });

            // Handle specific error cases
            if (res.status === 500) {
                response.status(503).json({
                    error: 'Service temporarily unavailable',
                    message: "The roast service is taking a quick break. Please try again in a moment! 🔄"
                });
                return;
            }

            let errorMessage = "Something went wrong with the roast generation.";
            if (parsedError?.error?.message) {
                errorMessage = parsedError.error.message;
            } else if (parsedError?.message) {
                errorMessage = parsedError.message;
            }

            response.status(res.status).json({
                error: 'Failed to generate roast',
                message: errorMessage
            });
            return;
        }

        const result = await res.json();
        
        // Validate response structure
        if (!result?.choices?.[0]?.message?.content) {
            logger.error('Invalid OpenAI response structure:', result);
            response.status(502).json({
                error: 'Invalid response',
                message: "Received an unexpected response format. Please try again."
            });
            return;
        }

        const roast = result.choices[0].message.content.trim();
        response.json({ roast });

    } catch (error) {
        logger.error('Error in generateRoast:', {
            error: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
        response.status(500).json({
            error: 'Internal server error',
            message: "Something went wrong. Give it another shot! 🎯"
        });
    }
});


