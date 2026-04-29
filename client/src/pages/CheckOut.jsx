import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  HiArrowLeft,
  HiCash,
  HiLocationMarker,
  HiPhone,
  HiRefresh,
} from "react-icons/hi";
import { clearCart } from "../../redux/cartSlice";
import { serverUrl } from "../App";
import DashboardNavbar from "../components/DashboardNavbar";

const DELIVERY_FEE = 120;

const buildMapUrl = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";

  const delta = 0.01;
  const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join(",");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
};

const CheckOut = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userData);
  const items = useSelector((state) => state.cart.items);
  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.mobile || "",
    address: "",
    note: "",
    paymentMethod: "cod",
  });
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

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
  const mapUrl = useMemo(
    () => buildMapUrl(location?.latitude, location?.longitude),
    [location],
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resolveAddress = useCallback(
    async (latitude, longitude) => {
      if (!apiKey) {
        return `Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`;
      }

      const result = await axios.get(
        "https://api.geoapify.com/v1/geocode/reverse",
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: "json",
            apiKey,
          },
        },
      );

      const place = result?.data?.results?.[0] || {};
      return (
        place.formatted ||
        [place.name, place.street, place.suburb, place.city, place.state]
          .filter(Boolean)
          .join(", ") ||
        `Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`
      );
    },
    [apiKey],
  );

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported by this browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation({ latitude, longitude });

        try {
          const address = await resolveAddress(latitude, longitude);
          updateField("address", address);
          toast.success("Delivery location detected");
        } catch {
          updateField(
            "address",
            `Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`,
          );
          toast.success("Location detected");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        toast.error(
          "Please allow location access or enter your address manually",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }, [resolveAddress]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const placeOrder = async (event) => {
    event.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty");
      navigate("/");
      return;
    }

    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("Please complete your delivery details");
      return;
    }

    if (location?.latitude == null || location?.longitude == null) {
      toast.error(
        "Please allow location access or refresh to capture your coordinates",
      );
      return;
    }

    setOrderLoading(true);
    try {
      const orderResponse = await axios.post(
        `${serverUrl}/api/orders`,
        {
          items: items.map((item) => ({
            itemId: item.itemId,
            quantity: Number(item.quantity || 1),
          })),
          deliveryAddress: {
            text: form.address.trim(),
            latitude: location.latitude,
            longitude: location.longitude,
          },
          paymentMethod: form.paymentMethod,
          note: form.note.trim(),
          customerName: form.fullName.trim(),
          customerPhone: form.phone.trim(),
        },
        { withCredentials: true },
      );

      dispatch(clearCart());

      // Extract order data from response
      const orderData = {
        orderId: orderResponse?.data?._id,
        items: items,
        address: form.address.trim(),
        deliveryAddress: {
          text: form.address.trim(),
          latitude: location.latitude,
          longitude: location.longitude,
        },
        paymentMethod: form.paymentMethod,
        customerName: form.fullName.trim(),
        customerPhone: form.phone.trim(),
        totalAmount: total,
        subtotal: subtotal,
      };

      // Show success toast and redirect to order success page
      toast.success("🎉 Order placed successfully!", { duration: 2000 });

      setTimeout(() => {
        navigate("/order-success", {
          replace: true,
          state: { order: orderData },
        });
      }, 1000);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to place order");
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <DashboardNavbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-[#ff5a36] hover:bg-[#fff7f3] hover:text-[#ff5a36] hover:shadow-md"
        >
          <HiArrowLeft className="text-lg" />
          Back to cart
        </button>

        <form
          onSubmit={placeOrder}
          className="grid gap-6 lg:grid-cols-[1fr_380px]"
        >
          <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-6 shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#ff5a36] 🔒">
                  🔒 Secure checkout
                </p>
                <h1 className="mt-2 text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">
                  📦 Delivery details
                </h1>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Confirm your location and delivery preferences.
                </p>
              </div>
              <button
                type="button"
                onClick={detectLocation}
                disabled={locationLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 text-sm font-black text-white shadow-md transition hover:from-[#ff5a36] hover:to-[#ff4420] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HiRefresh className={locationLoading ? "animate-spin" : ""} />
                Current location
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                  Full name
                </span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border-2 border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#ff5a36] focus:from-white focus:to-white focus:ring-2 focus:ring-[#ff5a36]/20"
                  placeholder="Your full name"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                  Phone number
                </span>
                <div className="relative mt-2">
                  <HiPhone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#ff5a36] font-black text-lg" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    className="w-full rounded-2xl border-2 border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 py-3 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-[#ff5a36] focus:from-white focus:to-white focus:ring-2 focus:ring-[#ff5a36]/20"
                    placeholder="03xx xxxxxxx"
                  />
                </div>
              </label>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border-2 border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100 shadow-md">
              {mapUrl ? (
                <iframe
                  title="Delivery location map"
                  src={mapUrl}
                  className="h-72 w-full border-0"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-72 place-items-center px-6 text-center">
                  <div>
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#ff5a36]/10 to-orange-100 text-[#ff5a36]">
                      <HiLocationMarker className="text-3xl" />
                    </div>
                    <p className="mt-4 text-sm font-black text-slate-900">
                      Waiting for location
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-600">
                      Allow location access or enter address manually below.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <label className="mt-6 block">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Delivery address
              </span>
              <div className="relative mt-2">
                <HiLocationMarker className="pointer-events-none absolute left-4 top-4 text-[#ff5a36] font-black text-lg" />
                <textarea
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                  rows={4}
                  className="w-full resize-none rounded-2xl border-2 border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 py-3 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-[#ff5a36] focus:from-white focus:to-white focus:ring-2 focus:ring-[#ff5a36]/20"
                  placeholder="House/Flat, street, area, city"
                />
              </div>
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Delivery note (optional)
              </span>
              <input
                type="text"
                value={form.note}
                onChange={(event) => updateField("note", event.target.value)}
                className="mt-2 w-full rounded-2xl border-2 border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#ff5a36] focus:from-white focus:to-white focus:ring-2 focus:ring-[#ff5a36]/20"
                placeholder="Special instructions for delivery"
              />
            </label>

            <div className="mt-6">
              <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
                💳 Payment method
              </p>
              <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[#ff5a36]/40 bg-gradient-to-r from-[#fff7f3] to-orange-50/50 p-4 transition hover:border-[#ff5a36]/60 hover:shadow-md">
                <input
                  type="radio"
                  checked={form.paymentMethod === "cod"}
                  onChange={() => updateField("paymentMethod", "cod")}
                  className="accent-[#ff5a36] w-5 h-5"
                />
                <HiCash className="text-2xl text-[#ff5a36]" />
                <span className="text-sm font-black text-slate-900">
                  Cash on delivery
                </span>
              </label>
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-6 shadow-md">
            <h2 className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">
              📋 Order details
            </h2>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-2">
              {items.length === 0 ? (
                <p className="rounded-2xl bg-slate-100/50 p-4 text-center text-sm font-bold text-slate-600">
                  Your cart is empty.
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-slate-50 to-white p-3 hover:shadow-sm transition"
                  >
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 ring-2 ring-[#ff5a36]/10">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black capitalize text-slate-900">
                        {item.name}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-600">
                        {item.quantity} × PKR{" "}
                        {Number(item.price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-200/60 pt-4 text-sm font-semibold">
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
              <div className="flex justify-between text-lg font-black text-slate-900">
                <span>Total amount</span>
                <span className="text-[#ff5a36]">
                  PKR {total.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={items.length === 0 || orderLoading}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3.5 text-sm font-black text-white shadow-lg transition hover:from-[#ff5a36] hover:to-[#ff4420] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {orderLoading ? "🔄 Placing order..." : "🛍️ Place order"}
            </button>
          </aside>
        </form>
      </main>
    </div>
  );
};

export default CheckOut;
