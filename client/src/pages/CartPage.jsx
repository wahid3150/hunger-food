import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  HiArrowLeft,
  HiMinus,
  HiOutlineShoppingBag,
  HiPlus,
  HiTrash,
} from "react-icons/hi";
import DashboardNavbar from "../components/DashboardNavbar";
import {
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
} from "../../redux/cartSlice";

const DELIVERY_FEE = 120;

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((state) => state.cart.items);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + Number(item.price || 0) * Number(item.quantity || 0),
        0,
      ),
    [items],
  );
  const total = subtotal > 0 ? subtotal + DELIVERY_FEE : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <DashboardNavbar showCart showOrdersButton />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-[#ff5a36] hover:bg-[#fff7f3] hover:text-[#ff5a36] hover:shadow-md"
        >
          <HiArrowLeft className="text-lg" />
          Back to food
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 shadow-md">
            <div className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
              <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                🛒 Your cart
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {items.length} item{items.length !== 1 ? "s" : ""} selected
              </p>
            </div>

            {items.length === 0 ? (
              <div className="grid min-h-[360px] place-items-center px-6 py-12 text-center">
                <div>
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[#ff5a36]/10 to-orange-100/50 text-[#ff5a36]">
                    <HiOutlineShoppingBag className="text-4xl" />
                  </div>
                  <p className="mt-4 font-black text-slate-900 text-lg">
                    Your cart is empty
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Add something delicious from nearby shops.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="mt-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3 text-sm font-bold text-white transition hover:from-[#ff5a36] hover:to-[#ff4420] shadow-md hover:shadow-lg"
                  >
                    📱 Browse food
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/60">
                {items.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex gap-4 p-5 hover:bg-slate-50/50 transition"
                  >
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 ring-2 ring-[#ff5a36]/10">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">
                          <HiOutlineShoppingBag className="text-2xl" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-black capitalize text-slate-900">
                            {item.name}
                          </h2>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            {item.shopName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCart(item.itemId))}
                          className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500 flex-shrink-0"
                          aria-label={`Remove ${item.name}`}
                        >
                          <HiTrash className="text-lg" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-lg font-black text-[#ff5a36]">
                          PKR {Number(item.price || 0).toLocaleString()}
                        </p>
                        <div className="flex items-center rounded-full border-2 border-slate-200 bg-white hover:border-[#ff5a36] transition">
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(decreaseQuantity(item.itemId))
                            }
                            className="grid h-8 w-8 place-items-center text-slate-400 transition hover:text-[#ff5a36] hover:bg-[#fff7f3] rounded-l-full"
                            aria-label={`Decrease ${item.name}`}
                          >
                            <HiMinus className="text-sm" />
                          </button>
                          <span className="w-8 text-center text-sm font-black text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(increaseQuantity(item.itemId))
                            }
                            className="grid h-8 w-8 place-items-center text-slate-400 transition hover:text-[#ff5a36] hover:bg-[#fff7f3] rounded-r-full"
                            aria-label={`Increase ${item.name}`}
                          >
                            <HiPlus className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-6 shadow-md">
            <h2 className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">
              💳 Order summary
            </h2>
            <div className="mt-5 space-y-3 text-sm font-semibold">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-black">
                  PKR {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery fee</span>
                <span className="font-black">
                  PKR {subtotal > 0 ? DELIVERY_FEE : 0}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="flex justify-between text-lg font-black text-slate-900">
                  <span>Total amount</span>
                  <span className="text-[#ff5a36]">
                    PKR {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={items.length === 0}
              onClick={() => navigate("/checkout")}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3.5 text-sm font-black text-white shadow-lg transition hover:from-[#ff5a36] hover:to-[#ff4420] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              🛍️ Proceed to checkout
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CartPage;
