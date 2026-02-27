import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Extract mime type and base64 data from data URI
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    const mimeType = match ? match[1] : "image/jpeg";
    const base64Data = match ? match[2] : image;

    const systemPrompt = `You are a waste classification expert. The user will send you a photo of waste.
Analyze the image and respond with a JSON object using tool calling.
Identify what the waste item is, which colored bin it should go in, a brief explanation, and disposal tips.

Bin colors:
- Green: Biodegradable/organic waste (food scraps, garden waste, paper)
- Blue: Recyclable waste (plastic bottles, glass, metal cans, cardboard)  
- Black: Non-recyclable waste (styrofoam, chip bags, contaminated packaging)
- Red: Hazardous/medical waste (batteries, chemicals, syringes, electronics)
- Yellow: Sanitary/biomedical waste (diapers, sanitary products)

Be specific about the item and give practical tips.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Classify this waste item. Which bin should it go in?" },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_waste",
              description: "Classify waste and return bin color, type, explanation, and tips",
              parameters: {
                type: "object",
                properties: {
                  bin_color: { type: "string", enum: ["Green", "Blue", "Black", "Red", "Yellow"], description: "Color of the bin" },
                  waste_type: { type: "string", description: "What the waste item is (e.g., 'Plastic water bottle')" },
                  explanation: { type: "string", description: "Brief explanation of why it goes in this bin" },
                  tips: { type: "array", items: { type: "string" }, description: "2-3 practical disposal tips" },
                },
                required: ["bin_color", "waste_type", "explanation", "tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_waste" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI classification failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return a classification" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-waste error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
