import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/product-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const rawPath = url.searchParams.get("path");
        const path = normalizeImagePath(rawPath);

        if (!path) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from("product-images")
          .createSignedUrl(path, 60 * 60);

        if (error || !data?.signedUrl) {
          return new Response("Not found", { status: 404 });
        }

        return Response.redirect(data.signedUrl, 302);
      },
    },
  },
});

function normalizeImagePath(value: string | null) {
  if (!value) return null;
  let path = value.trim();

  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      const marker = "/product-images/";
      const idx = url.pathname.indexOf(marker);
      if (idx === -1) return null;
      path = decodeURIComponent(url.pathname.slice(idx + marker.length));
    } catch {
      return null;
    }
  }

  path = path.replace(/^\/+/, "");
  if (!path || path.includes("..") || path.includes("\\")) return null;
  return path;
}
