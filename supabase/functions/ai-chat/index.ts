// AI Chat edge function for Intellinks East Africa
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optional: only users with ai_enabled may call
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_enabled, full_name')
      .eq('id', user.id)
      .single();

    if (profile && profile.ai_enabled === false) {
      return new Response(
        JSON.stringify({ error: 'AI assistant not enabled for this user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, userName } = await req.json();

    if (!message || typeof message !== 'string' || message.length > 4000) {
      return new Response(
        JSON.stringify({ error: 'Invalid message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const displayName = userName || profile?.full_name || 'User';
    const systemPrompt = `You are an intelligent AI assistant for Intellinks East Africa, an enterprise IT management platform. You help employees with:

1. **IT Support**: Answer questions about common IT issues, troubleshooting steps, and best practices.
2. **Company Resources**: Help navigate company apps like Helpdesk, Projects, Assets, Inventory, Finance, HRM, CRM, and Collaboration tools.
3. **General Questions**: Provide helpful, professional responses to work-related queries.
4. **Productivity Tips**: Offer suggestions for improving workflow and using company tools effectively.

Guidelines:
- Be professional, friendly, and concise
- If you don't know something specific to the company, suggest contacting the IT helpdesk
- For technical issues, provide step-by-step guidance when possible
- Keep responses helpful but brief
- Use the user's name (${displayName}) occasionally to personalize responses`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error status:', response.status);
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (_error) {
    console.error('ai-chat: request failed');
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
