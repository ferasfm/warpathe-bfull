import { createFileRoute } from '@tanstack/react-router';

/**
 * AGENT API ROUTES
 * 
 * These routes provide standard REST endpoints for the future Windows Agent.
 * They wrap the server functions to provide a stable API.
 */

export const Route = createFileRoute('/api/public/agent/register')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { registerAgent } = await import('@/lib/agent-communication.functions');
          
          // Server functions expect the input directly
          const result = await registerAgent({ data: body });
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
  }
});
