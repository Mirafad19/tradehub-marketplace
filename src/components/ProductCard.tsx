import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { formatNaira, type Product } from "@/lib/products";
import { ProductImage } from "./ProductImage";

const badgeStyles: Record<NonNullable<Product["badge"]>, string> = {
  hot: "bg-destructive text-destructive-foreground",
  new: "bg-foreground text-background",
  deal: "bg-warning text-warning-foreground",
};

const badgeLabel: Record<NonNullable<Product["badge"]>, string> = {
  hot: "Hot",
  new: "New",
  deal: "Deal",
};

export function ProductCard({ product }: { product: Product }) {
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group block rounded-xl bg-card ring-1 ring-border p-2 transition-all hover:shadow-[var(--shadow-elevated)] hover:ring-brand/30"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg ring-1 ring-border/60">
        <ProductImage hue={product.imageHue} label={product.name} />
        {product.badge && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeStyles[product.badge]}`}
          >
            {badgeLabel[product.badge]}
          </span>
        )}
        {discount && (
          <span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
            −{discount}%
          </span>
        )}
      </div>

      <div className="px-1 pb-2 pt-3">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
            {product.name}
          </h3>
          <div className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-muted-foreground">
            <Star className="h-3 w-3 fill-warning text-warning" />
            {product.rating.toFixed(1)}
          </div>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">{product.sellerName}</p>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-base font-semibold text-brand">
            {formatNaira(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatNaira(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
