/**
 * Server-side helper for AI Gateway calls.
 */
export const aiGateway = {
  chat: async ({ 
    provider, 
    model, 
    messages, 
    temperature = 0, 
    response_format, 
    timeout = 30000 
  }: {
    provider: string;
    model: string;
    messages: any[];
    temperature?: number;
    response_format?: { type: "json_object" | "text" };
    timeout?: number;
  }) => {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // The platform's AI Gateway endpoint
    const response = await fetch("https://api.lovable.app/ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: `${provider}/${model}`,
        messages,
        temperature,
        response_format,
      }),
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { error: errorText };
      }
      throw new Error(`AI Gateway Error: ${errorJson.error?.message || errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message;
  }
};
