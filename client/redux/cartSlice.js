import { createSlice } from "@reduxjs/toolkit";

const getStoredCart = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem("hungerFoodCart");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: getStoredCart(),
  },
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const id = item?.itemId || item?._id;
      if (!id) return;

      const existing = state.items.find((cartItem) => cartItem.itemId === id);
      if (existing) {
        existing.quantity += Number(item.quantity || 1);
        return;
      }

      state.items.push({
        itemId: id,
        name: item.name || "Menu item",
        price: Number(item.price || 0),
        image: item.image || "",
        shopId: item.shopId || item.shop?._id || "",
        shopName: item.shopName || item.shop?.name || "Nearby shop",
        quantity: Number(item.quantity || 1),
      });
    },
    increaseQuantity: (state, action) => {
      const item = state.items.find((cartItem) => cartItem.itemId === action.payload);
      if (item) item.quantity += 1;
    },
    decreaseQuantity: (state, action) => {
      const item = state.items.find((cartItem) => cartItem.itemId === action.payload);
      if (!item) return;

      item.quantity -= 1;
      if (item.quantity <= 0) {
        state.items = state.items.filter((cartItem) => cartItem.itemId !== action.payload);
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((cartItem) => cartItem.itemId !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
