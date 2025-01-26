import { serve } from 'https://deno.fresh.dev/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'

// System prompt for consistent roasting style
const SYSTEM_PROMPT = `You are a savage comedy expert who creates brutal, witty roasts of LinkedIn content. 
Your roasts must be:
- One short, complete sentence that delivers maximum impact
- Ruthlessly clever but professional
- Target either the post, poster, or both - whatever's funnier
- Call out buzzwords, humble brags, and performative behavior
- Reference specific details to make it personal
- NO hashtags, NO unfinished thoughts
Remember: A perfect roast is like a sniper shot - one clean hit that leaves a mark.`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { content } = await req.json()

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Initialize OpenAI with API key from environment variable
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })
    const openai = new OpenAIApi(configuration)

    // Generate roast using OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Roast this LinkedIn post: "${content}"`
        }
      ],
      temperature: 1.1,
      max_tokens: 60,
      presence_penalty: 1.0,
      frequency_penalty: 0.8
    })

    // Return the roast
    return new Response(JSON.stringify({
      roast: completion.data.choices[0].message.content.trim()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Error generating roast:', error)
    return new Response(JSON.stringify({
      error: 'Failed to generate roast'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}) 