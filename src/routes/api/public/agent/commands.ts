import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/agent/commands')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { getPendingCommands } = await import('@/lib/agent-communication.functions');
          const result = await getPendingCommands({ data: body });
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
  }
});
