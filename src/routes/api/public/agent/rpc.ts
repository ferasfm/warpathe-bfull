import { createFileRoute } from '@tanstack/react-router';
import { processAiVision } from '@/lib/ai-vision.functions';

export const Route = createFileRoute('/api/public/agent/rpc')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { functionName, payload } = body;

          // Only allow specific RPC calls for agents
          switch (functionName) {
            case 'processAiVision':
              const result = await processAiVision({ data: payload });
              return new Response(JSON.stringify(result), {
                headers: { 'Content-Type': 'application/json' }
              });
            default:
              return new Response(JSON.stringify({ error: 'Unsupported RPC function' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
          }
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
  }
});
