import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import {
  getCategoryBySlug,
  getProductsByCategory,
  categories,
} from "@/lib/products";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = getCategoryBySlug(params.slug);
    if (!category) throw notFound();
    return { category, products: getProductsByCategory(params.slug) };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.category.name} — TradeHub` },
          {
            name: "description",
            content: `Shop ${loaderData.category.name.toLowerCase()} from verified Nigerian sellers on TradeHub.`,
          },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Category not found</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn't find that category. Try another one below.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="rounded-full bg-muted px-4 py-1.5 text-sm hover:bg-brand-soft hover:text-brand"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ reset }) => (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
        >
          Try again
        </button>
      </div>
    </SiteLayout>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category, products } = Route.useLoaderData();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-brand">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{category.name}</span>
        </nav>

        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              {category.emoji} {category.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? "product" : "products"} from verified sellers
            </p>
          </div>
        </header>

        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface py-20 text-center">
            <p className="text-muted-foreground">No products listed in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
