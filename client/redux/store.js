import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice";
import cartSlice from "./cartSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    cart: cartSlice,
  },
});

store.subscribe(() => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      "hungerFoodCart",
      JSON.stringify(store.getState().cart.items),
    );
  } catch {
    // Ignore storage failures so cart updates never break the UI.
  }
});
