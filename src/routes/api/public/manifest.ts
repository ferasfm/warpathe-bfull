import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const manifestSchema = z.object({
  name: z.string(),
  short_name: z.string(),
  description: z.string(),
  start_url: z.string(),
  display: z.enum(['fullscreen', 'standalone', 'minimal-ui', 'browser']),
  background_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  theme_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  prefer_related_applications: z.boolean(),
  icons: z.array(z.object({
    src: z.string(),
    sizes: z.string(),
    type: z.string(),
    purpose: z.string().optional()
  }))
})

export const Route = createFileRoute('/api/public/manifest')({
  server: {
    handlers: {
      GET: async () => {
        const manifest = {
          "name": "WARPATH Automation Platform",
          "short_name": "WARPATH",
          "description": "Advanced automation platform for mobile gaming and mission control.",
          "start_url": "/",
          "display": "standalone",
          "background_color": "#000000",
          "theme_color": "#000000",
          "prefer_related_applications": false,
          "icons": [
            {
              "src": "/favicon.png",
              "sizes": "192x192",
              "type": "image/png",
              "purpose": "any maskable"
            },
            {
              "src": "/favicon.png",
              "sizes": "512x512",
              "type": "image/png",
              "purpose": "any maskable"
            }
          ]
        };

        // Internal validation to ensure static config remains safe
        manifestSchema.parse(manifest);

        return new Response(JSON.stringify(manifest), {
          headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'public, max-age=3600',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          },
        })
      }
    }
  }
})
