import { createFileRoute, useNavigate } from "@tanstack/react-router";
import ProductEditor from "@/components/ProductEditor";

export const Route = createFileRoute("/_authenticated/seller/products/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  return <ProductEditor mode="edit" productId={id} onDone={() => navigate({ to: "/seller" })} />;
}
