import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenAI, Type, Schema } from 'npm:@google/genai';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// The hardcoded list is removed. We will fetch dynamically.

const getSystemPrompt = (productListString: string) => `
### SYSTEM PROMPT: JOUDA_LIFESTYLE_COMPANION (V5.1 - Concise & Direct)
### ROLE: Smart Shopping Assistant & Celiac Guide

**CORE IDENTITY:**
You are **"Jouda Assistant"**. Your goal is to give fast, accurate, and highly concise advice. 
You must NEVER write long paragraphs or repetitive sales pitches. Be direct and helpful.

**TONE:**
- **Direct & Helpful:** No fluff, no repetitive phrases like "لا تقلق أبدًا" or "في متجر جودة لدينا". Just state the facts and alternatives directly.
- **Concise:** Keep sentences extremely short.

**STORE INVENTORY CONTEXT (Jouda Store - متجر جودة):**
You know these items are available:
${productListString}

**PROTOCOL:**

1.  **IF SAFE:** 
    - Confirm safety immediately.
    - **Upsell:** Mention one complementary product briefly.

2.  **IF UNSAFE:**
    - State clearly that it contains gluten.
    - **IMMEDIATE PIVOT:** Suggest 1 exact alternative from the inventory.
    - **CRITICAL:** You MUST place the exact name of this suggested alternative in the \`matchedStoreItem\` JSON field.

3.  **IF RISKY/UNCLEAR:**
    - State the risk briefly and suggest a guaranteed safe alternative from the inventory.
    - **CRITICAL:** You MUST place the exact name of this suggested alternative in the \`matchedStoreItem\` JSON field.

---

### OUTPUT FORMAT (ARABIC JSON)
Return JSON strictly.

**verdictTitle Guidelines:**
- SAFE: "آمن وشهي ✅"
- UNSAFE: "يحتوي جلوتين 🚫"
- RISKY: "غير مؤكد ⚠️"

**Analysis:** 1 short sentence explaining why it is safe or unsafe. NO filler words.
**Guidance:** 1 short sentence suggesting an alternative or complement. Example: "استبدل هذا المنتج بـ دقيق الأرز المتوفر في المتجر." or "آمن تماماً، جربه مع صلصة الطماطم من جودة."
`;

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    verdict: {
      type: Type.STRING,
      enum: ["SAFE", "RISKY", "UNSAFE"],
      description: "The final safety verdict. SAFE = Green, RISKY = Yellow, UNSAFE = Red.",
    },
    verdictTitle: {
      type: Type.STRING,
      description: "A short Arabic title for the verdict (e.g. 'آمن تماماً', 'خطر محتمل', 'غير آمن').",
    },
    analysis: {
      type: Type.STRING,
      description: "Detailed analysis of ingredients or visual cues in Arabic.",
    },
    guidance: {
      type: Type.STRING,
      description: "Actionable advice for the patient in Arabic.",
    },
    alternatives: {
      type: Type.STRING,
      description: "Suggested gluten-free alternatives if the item is unsafe (optional).",
    },
    matchedStoreItem: {
      type: Type.STRING,
      description: "CRITICAL: If SAFE and found in store, output its exact name here. If UNSAFE/RISKY, you MUST output the exact name of the Jouda Store ALTERNATIVE product you are recommending here.",
    },
  },
  required: ["verdict", "verdictTitle", "analysis", "guidance"],
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image, productName } = await req.json();

    if (!image && !productName) {
      return new Response(
        JSON.stringify({ error: 'Missing image or productName in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured in server environment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to Supabase to fetch live products
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products } = await supabase
      .from('products')
      .select('name, category')
      .eq('is_active', true);

    const productListString = products && products.length > 0
      ? products.map((p: any) => `- ${p.name} (قسم: ${p.category || 'عام'})`).join('\n')
      : "لا توجد منتجات مسجلة حالياً";

    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash";
    const config = {
      systemInstruction: getSystemPrompt(productListString),
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
      temperature: 0.2,
    };

    let contents;

    if (image) {
      // It's an image analysis
      // Ensure image is base64 string
      const base64Data = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      contents = {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg", 
            },
          },
          {
            text: "Analyze this image for Gluten content based on the system instructions. Check against store inventory.",
          },
        ],
      };
    } else {
      // It's a text analysis
      contents = {
        parts: [
          {
            text: `Analyze this food product name for Gluten content strictly: "${productName}". Check if it matches Jouda Store inventory.`,
          },
        ],
      };
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents,
      config,
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    const data = JSON.parse(response.text);
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    
    // Check for quota exhaustion (429)
    const errorMessage = String(error).toLowerCase();
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("exhausted")) {
      return new Response(
        JSON.stringify({ error: 'QUOTA_EXCEEDED' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
