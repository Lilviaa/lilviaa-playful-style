import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/products/product-form";

export const Route = createFileRoute("/admin/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const [initialData] = useState(() => {
    try {
      const saved = sessionStorage.getItem("duplicate_product");
      if (saved) {
        sessionStorage.removeItem("duplicate_product");
        return JSON.parse(saved);
      }
    } catch (e) {}
    return undefined;
  });

  return <ProductForm initialData={initialData} />;
}
