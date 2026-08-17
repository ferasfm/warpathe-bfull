import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/manifest")({
  server: {
    handlers: {
      GET: async () => {
        const manifest = {
          name: "شركة الهدى للمحروقات",
          short_name: "الهدى",
          description: "تحديث فوري لتوفر الوقود في محطات شركة الهدى",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#ef4444",
          icons: [
            {
              src: "https://alhuda.ps/wp-content/uploads/2025/03/cropped-cropped-434028226_889142969677554_7540231448891951221_n-1.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "https://alhuda.ps/wp-content/uploads/2025/03/cropped-cropped-434028226_889142969677554_7540231448891951221_n-1.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        };

        return new Response(JSON.stringify(manifest), {
          headers: {
            "Content-Type": "application/manifest+json",
          },
        });
      },
    },
  },
});
