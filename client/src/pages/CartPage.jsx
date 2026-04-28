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
        (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
        0,
      ),
    [items],
  );
  const total = subtotal > 0 ? subtotal + DELIVERY_FEE : 0;

  return (
    <div className="min-h-screen bg-[#fff8f5]">
      <DashboardNavbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-[#f1e5df] bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          <HiArrowLeft />
          Back to food
        </button>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="rounded-2xl border border-[#f1e5df] bg-white shadow-sm">
            <div className="border-b border-[#f1e5df] px-5 py-4">
              <h1 className="text-xl font-extrabold text-slate-800">Your cart</h1>
              <p className="text-xs font-medium text-slate-500">
                {items.length} item{items.length !== 1 ? "s" : ""} selected
              </p>
            </div>

            {items.length === 0 ? (
              <div className="grid min-h-[320px] place-items-center px-5 py-10 text-center">
                <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#ff5a36]/10 text-[#ff5a36]">
                    <HiOutlineShoppingBag className="text-3xl" />
                  </div>
                  <p className="mt-4 font-extrabold text-slate-800">Your cart is empty</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Add something delicious from nearby shops.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="mt-5 rounded-xl bg-[#ff5a36] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e04e2d]"
                  >
                    Browse food
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#f1e5df]">
                {items.map((item) => (
                  <div key={item.itemId} className="flex gap-4 p-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">
                          <HiOutlineShoppingBag className="text-2xl" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-extrabold capitalize text-slate-800">
                            {item.name}
                          </h2>
                          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                            {item.shopName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCart(item.itemId))}
                          className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          aria-label={`Remove ${item.name}`}
                        >
                          <HiTrash />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-base font-extrabold text-[#ff5a36]">
                          PKR {Number(item.price || 0).toLocaleString()}
                        </p>
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => dispatch(decreaseQuantity(item.itemId))}
                            className="grid h-9 w-9 place-items-center text-slate-600 transition hover:text-[#ff5a36]"
                            aria-label={`Decrease ${item.name}`}
                          >
                            <HiMinus />
                          </button>
                          <span className="w-8 text-center text-sm font-extrabold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => dispatch(increaseQuantity(item.itemId))}
                            className="grid h-9 w-9 place-items-center text-slate-600 transition hover:text-[#ff5a36]"
                            aria-label={`Increase ${item.name}`}
                          >
                            <HiPlus />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-[#f1e5df] bg-white p-5 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-800">Order summary</h2>
            <div className="mt-4 space-y-3 text-sm font-semibold">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>PKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery</span>
                <span>PKR {subtotal > 0 ? DELIVERY_FEE : 0}</span>
              </div>
              <div className="border-t border-[#f1e5df] pt-3">
                <div className="flex justify-between text-base font-extrabold text-slate-800">
                  <span>Total</span>
                  <span>PKR {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={items.length === 0}
              onClick={() => navigate("/checkout")}
              className="mt-5 w-full rounded-xl bg-[#ff5a36] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#e04e2d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proceed to checkout
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CartPage;
