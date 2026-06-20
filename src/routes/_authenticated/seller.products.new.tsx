import { createFileRoute, useNavigate } from "@tanstack/react-router";
import ProductEditor from "@/components/ProductEditor";

export const Route = createFileRoute("/_authenticated/seller/products/new")({
  component: NewProduct,
});

function NewProduct() {
  const navigate = useNavigate();
  return <ProductEditor mode="create" onDone={() => navigate({ to: "/seller" })} />;
}
