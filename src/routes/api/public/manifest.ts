import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/manifest')({
  server: {
    handlers: {
      GET: async () => {
        const manifest = {
          "name": "شركة الهدى للمحروقات",
          "short_name": "الهدى",
          "description": "تحديث فوري لحالة الوقود في محطات شركة الهدى بالضفة الغربية.",
          "start_url": "/",
          "display": "standalone",
          "background_color": "#ffffff",
          "theme_color": "#D3302F",
          "icons": [
            {
              "src": "/favicon.png",
              "sizes": "192x192",
              "type": "image/png"
            },
            {
              "src": "/favicon.png",
              "sizes": "512x512",
              "type": "image/png"
            }
          ]
        };

        return new Response(JSON.stringify(manifest), {
          headers: {
            'Content-Type': 'application/manifest+json',
          },
        })
      }
    }
  }
})
