// Client-side cart, persisted to localStorage.
// Stores enough info to render cart/checkout without re-fetching.
import { useEffect, useState } from "react";

export type CartItem = {
  productId: string;
  sellerId: string;
  name: string;
  priceKobo: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
};

const STORAGE_KEY = "rccg-tradehub:cart:v2";
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((fn) => fn());
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const items = read();
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity = Math.min(existing.stock, existing.quantity + quantity);
  } else {
    items.push({ ...item, quantity: Math.min(item.stock, quantity) });
  }
  write(items);
}

export function updateQuantity(productId: string, quantity: number) {
  let items = read();
  if (quantity <= 0) {
    items = items.filter((i) => i.productId !== productId);
  } else {
    const existing = items.find((i) => i.productId === productId);
    if (existing) existing.quantity = Math.min(existing.stock, quantity);
  }
  write(items);
}

export function removeFromCart(productId: string) {
  write(read().filter((i) => i.productId !== productId));
}

export function clearCart() {
  write([]);
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => read());
  useEffect(() => {
    const sync = () => setItems(read());
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalKobo = items.reduce((s, i) => s + i.priceKobo * i.quantity, 0);
  return { items, count, subtotalKobo };
}
