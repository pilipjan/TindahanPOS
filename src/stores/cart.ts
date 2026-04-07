import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartState, CartItem, DiscountType } from "@/types";
import { computeCartTotals } from "@/lib/vat";

interface CartStore extends CartState {
  // Actions
  addItem: (item: Omit<CartItem, "line_total" | "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (type: DiscountType, idNumber?: string, name?: string) => void;
  clearCart: () => void;
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  discountType: "none",
  discountAmount: 0,
  discountIdNumber: "",
  discountName: "",
  vatableSales: 0,
  vatAmount: 0,
  vatExemptSales: 0,
  totalAmount: 0,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addItem: (newItem) => {
        set((state) => {
          const qty = newItem.quantity || 1;
          const existing = state.items.find((i) => i.product_id === newItem.product_id);

          let newItems;
          if (existing) {
            newItems = state.items.map((i) =>
              i.product_id === newItem.product_id
                ? {
                    ...i,
                    quantity: i.quantity + qty,
                    line_total: (i.quantity + qty) * i.unit_price,
                  }
                : i
            );
          } else {
            newItems = [
              ...state.items,
              {
                ...newItem,
                quantity: qty,
                line_total: qty * newItem.unit_price,
              },
            ];
          }

          // Recalculate totals
          const totals = computeCartTotals(newItems, state.discountType);
          return { items: newItems, ...totals };
        });
      },

      removeItem: (productId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.product_id !== productId);
          const totals = computeCartTotals(newItems, state.discountType);
          return { items: newItems, ...totals };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter((i) => i.product_id !== productId);
            const totals = computeCartTotals(newItems, state.discountType);
            return { items: newItems, ...totals };
          }

          const newItems = state.items.map((i) =>
            i.product_id === productId
              ? { ...i, quantity, line_total: quantity * i.unit_price }
              : i
          );
          const totals = computeCartTotals(newItems, state.discountType);
          return { items: newItems, ...totals };
        });
      },

      setDiscount: (type, idNumber = "", name = "") => {
        set((state) => {
          const totals = computeCartTotals(state.items, type);
          return {
            ...totals,
            discountType: type,
            discountIdNumber: idNumber,
            discountName: name,
          };
        });
      },

      clearCart: () => {
        set(initialState);
      },
    }),
    {
      name: "tindahan-cart", // persist cart in local storage in case of accidental refresh
    }
  )
);
