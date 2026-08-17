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
              "src": "https://id-preview--5e463240-c1dc-4809-9cee-2e23ce39841e.lovable.app/favicon.ico",
              "sizes": "64x64",
              "type": "image/x-icon"
            },
            {
              "src": "https://alhuda.ps/wp-content/uploads/2025/03/cropped-cropped-434028226_889142969677554_7540231448891951221_n-1.png",
              "sizes": "192x192",
              "type": "image/png"
            },
            {
              "src": "https://alhuda.ps/wp-content/uploads/2025/03/cropped-cropped-434028226_889142969677554_7540231448891951221_n-1.png",
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
