export function productImageUrl(ref?: string | null) {
  if (!ref) return null;
  if (ref.startsWith("/api/public/product-image")) return ref;
  if ((ref.startsWith("http://") || ref.startsWith("https://")) && !ref.includes("/product-images/")) {
    return ref;
  }
  return `/api/public/product-image?path=${encodeURIComponent(ref)}`;
}
