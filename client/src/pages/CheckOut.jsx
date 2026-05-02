import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  HiArrowLeft,
  HiCheckCircle,
  HiLocationMarker,
  HiPhone,
  HiRefresh,
  HiShoppingBag,
  HiUser,
  HiAnnotation,
  HiClock,
  HiTruck,
  HiCash,
  HiChevronRight,
  HiShieldCheck,
} from "react-icons/hi";
import { clearCart } from "../../redux/cartSlice";
import { serverUrl } from "../App";
import DashboardNavbar from "../components/DashboardNavbar";

const DELIVERY_FEE = 120;
const ESTIMATED_MINUTES = "30–45";

const buildMapUrl = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";
  const delta = 0.01;
  const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
};

const STEPS = ["Delivery Details", "Review Order", "Confirmed"];

// ── tiny helpers ──────────────────────────────────────────────────────────────
const Field = ({ label, error, icon: Icon, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#ff5a36]" />
      )}
      {children}
    </div>
    {error && (
      <p className="text-xs font-semibold text-red-500 animate-fadeIn">{error}</p>
    )}
  </div>
);

const inputCls = (hasIcon, error) =>
  `w-full rounded-2xl border-2 bg-white py-3 text-sm font-semibold text-slate-900 outline-none transition
   focus:ring-2 focus:ring-[#ff5a36]/20
   ${hasIcon ? "pl-12 pr-4" : "px-4"}
   ${error ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#ff5a36]"}`;

// ─────────────────────────────────────────────────────────────────────────────

const CheckOut = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.user.userData);
  const items = useSelector((s) => s.cart.items);
  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  const [step, setStep] = useState(0); // 0 = details, 1 = review, 2 = done
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.mobile || "",
    address: "",
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (t, i) => t + Number(i.price || 0) * Number(i.quantity || 0),
        0
      ),
    [items]
  );
  const total = subtotal > 0 ? subtotal + DELIVERY_FEE : 0;
  const mapUrl = useMemo(
    () => buildMapUrl(location?.latitude, location?.longitude),
    [location]
  );

  const update = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const clearError = (field) =>
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });

  // ── geolocation ─────────────────────────────────────────────────────────────
  const resolveAddress = useCallback(
    async (lat, lon) => {
      if (!apiKey) return `Lat ${lat.toFixed(5)}, Lng ${lon.toFixed(5)}`;
      const res = await axios.get(
        "https://api.geoapify.com/v1/geocode/reverse",
        { params: { lat, lon, format: "json", apiKey } }
      );
      const p = res?.data?.results?.[0] || {};
      return (
        p.formatted ||
        [p.name, p.street, p.suburb, p.city, p.state].filter(Boolean).join(", ") ||
        `Lat ${lat.toFixed(5)}, Lng ${lon.toFixed(5)}`
      );
    },
    [apiKey]
  );

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setLocation({ latitude, longitude });
        try {
          const address = await resolveAddress(latitude, longitude);
          update("address", address);
          clearError("address");
          toast.success("Location detected");
        } catch {
          update("address", `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`);
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        toast.error("Allow location access or enter your address manually");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, [resolveAddress]);

  useEffect(() => { detectLocation(); }, [detectLocation]);

  // ── validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^0[0-9]{9,10}$/.test(form.phone.trim()))
      e.phone = "Enter a valid Pakistani number (e.g. 03001234567)";
    if (!form.address.trim()) e.address = "Delivery address is required";
    if (!location) e.location = "Allow location access to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── step navigation ──────────────────────────────────────────────────────────
  const goToReview = (e) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("Your cart is empty"); navigate("/"); return; }
    if (validate()) setStep(1);
    else toast.error("Please fix the errors before continuing");
  };

  const placeOrder = async () => {
    setOrderLoading(true);
    try {
      await axios.post(
        `${serverUrl}/api/orders`,
        {
          items: items.map((i) => ({ itemId: i.itemId, quantity: Number(i.quantity || 1) })),
          deliveryAddress: {
            text: form.address.trim(),
            latitude: location.latitude,
            longitude: location.longitude,
          },
          paymentMethod: "cod",
          note: form.note.trim(),
          customerName: form.fullName.trim(),
          customerPhone: form.phone.trim(),
        },
        { withCredentials: true }
      );
      dispatch(clearCart());
      setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to place order");
    } finally {
      setOrderLoading(false);
    }
  };

  // ── step 2: confirmed screen ─────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <DashboardNavbar />
        <main className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center animate-fadeIn">
          <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl shadow-emerald-200">
            <HiCheckCircle className="text-5xl text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Order Placed!</h1>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Your order has been confirmed. Pay <span className="font-black text-[#ff5a36]">PKR {total.toLocaleString()}</span> in cash on delivery.
          </p>

          <div className="mt-8 w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-md text-left space-y-4">
            <div className="flex items-center gap-3">
              <HiTruck className="text-2xl text-[#ff5a36]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Estimated arrival</p>
                <p className="font-black text-slate-900">{ESTIMATED_MINUTES} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HiLocationMarker className="text-2xl text-[#ff5a36]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Delivering to</p>
                <p className="font-semibold text-slate-700 line-clamp-2">{form.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HiCash className="text-2xl text-[#ff5a36]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Payment</p>
                <p className="font-black text-slate-900">Cash on Delivery</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[#ff5a36] to-[#ff4420] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:shadow-xl"
          >
            Back to Home
          </button>
        </main>
      </div>
    );
  }

  // ── step progress bar ────────────────────────────────────────────────────────
  const StepBar = () => (
    <div className="mb-8 flex items-center gap-0">
      {STEPS.slice(0, 2).map((label, i) => (
        <React.Fragment key={label}>
          <button
            type="button"
            onClick={() => i < step && setStep(i)}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black transition
                ${i < step ? "bg-[#ff5a36] text-white shadow-md shadow-orange-200"
                  : i === step ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-200 text-slate-500"}`}
            >
              {i < step ? <HiCheckCircle className="text-lg" /> : i + 1}
            </div>
            <span className={`text-xs font-bold whitespace-nowrap ${i === step ? "text-slate-900" : "text-slate-400"}`}>
              {label}
            </span>
          </button>
          {i < STEPS.length - 2 && (
            <div className={`mx-2 mb-4 h-0.5 flex-1 rounded transition ${i < step ? "bg-[#ff5a36]" : "bg-slate-200"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ── shared order summary sidebar ─────────────────────────────────────────────
  const OrderSummary = () => (
    <aside className="h-fit rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
        <HiShoppingBag className="text-[#ff5a36]" /> Order Summary
      </h2>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.itemId} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-200">
              {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold capitalize text-slate-900">{item.name}</p>
              <p className="text-xs font-semibold text-slate-500">
                {item.quantity} × PKR {Number(item.price || 0).toLocaleString()}
              </p>
            </div>
            <p className="text-sm font-black text-[#ff5a36] flex-shrink-0">
              PKR {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
        <div className="flex justify-between text-slate-500 font-semibold">
          <span>Subtotal</span>
          <span className="font-black text-slate-800">PKR {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-500 font-semibold">
          <span>Delivery fee</span>
          <span className="font-black text-slate-800">PKR {subtotal > 0 ? DELIVERY_FEE : 0}</span>
        </div>
        <div className="flex justify-between rounded-2xl bg-[#fff7f3] px-3 py-2.5 text-base font-black text-slate-900">
          <span>Total</span>
          <span className="text-[#ff5a36]">PKR {total.toLocaleString()}</span>
        </div>
      </div>

      {/* estimated delivery */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 px-4 py-3">
        <HiClock className="flex-shrink-0 text-[#ff5a36]" />
        <p className="text-xs font-bold text-slate-700">
          Estimated delivery: <span className="text-[#ff5a36]">{ESTIMATED_MINUTES} min</span>
        </p>
      </div>

      {/* COD badge */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-[#ff5a36]/30 bg-[#fff7f3] px-4 py-3">
        <HiCash className="flex-shrink-0 text-2xl text-[#ff5a36]" />
        <div>
          <p className="text-sm font-black text-slate-900">Cash on Delivery</p>
          <p className="text-xs font-semibold text-slate-500">Pay when your order arrives</p>
        </div>
        <HiCheckCircle className="ml-auto flex-shrink-0 text-xl text-green-500" />
      </div>

      {/* trust badges */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
        <HiShieldCheck className="text-green-500" />
        Secure & encrypted checkout
      </div>
    </aside>
  );

  // ── STEP 0: delivery details ─────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <DashboardNavbar />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 animate-fadeIn">
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-[#ff5a36] hover:text-[#ff5a36]"
          >
            <HiArrowLeft /> Back to cart
          </button>

          <StepBar />

          <form onSubmit={goToReview} className="grid gap-6 lg:grid-cols-[1fr_380px]" noValidate>
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md space-y-6">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#ff5a36]">Step 1 of 2</p>
                <h1 className="mt-1 text-2xl font-black text-slate-900">Delivery Details</h1>
                <p className="mt-1 text-sm text-slate-500">Tell us where to deliver your order.</p>
              </div>

              {/* name + phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" error={errors.fullName} icon={HiUser}>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => { update("fullName", e.target.value); clearError("fullName"); }}
                    className={inputCls(true, errors.fullName)}
                    placeholder="Your full name"
                  />
                </Field>

                <Field label="Phone Number" error={errors.phone} icon={HiPhone}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => { update("phone", e.target.value); clearError("phone"); }}
                    className={inputCls(true, errors.phone)}
                    placeholder="03xx xxxxxxx"
                    maxLength={11}
                  />
                </Field>
              </div>

              {/* map */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Delivery Location
                  </span>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locationLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-[#ff5a36] hover:text-[#ff5a36] disabled:opacity-60"
                  >
                    <HiRefresh className={locationLoading ? "animate-spin" : ""} />
                    {locationLoading ? "Detecting…" : "Use my location"}
                  </button>
                </div>

                <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-100">
                  {mapUrl ? (
                    <iframe
                      title="Delivery location map"
                      src={mapUrl}
                      className="h-56 w-full border-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-56 place-items-center text-center">
                      <div>
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-100 text-[#ff5a36]">
                          <HiLocationMarker className="text-2xl" />
                        </div>
                        <p className="mt-3 text-sm font-bold text-slate-700">Waiting for location</p>
                        <p className="mt-1 text-xs text-slate-400">Allow access or type your address below</p>
                      </div>
                    </div>
                  )}
                </div>
                {errors.location && (
                  <p className="mt-1 text-xs font-semibold text-red-500 animate-fadeIn">{errors.location}</p>
                )}
              </div>

              {/* address textarea */}
              <Field label="Delivery Address" error={errors.address} icon={HiLocationMarker}>
                <textarea
                  value={form.address}
                  onChange={(e) => { update("address", e.target.value); clearError("address"); }}
                  rows={3}
                  className={`${inputCls(true, errors.address)} resize-none pt-3 align-top`}
                  placeholder="House / flat, street, area, city"
                />
              </Field>

              {/* note */}
              <Field label="Delivery Note (optional)" error={null} icon={HiAnnotation}>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => update("note", e.target.value)}
                  className={inputCls(true, null)}
                  placeholder="E.g. Ring the bell, leave at gate…"
                />
              </Field>
            </section>

            <div className="flex flex-col gap-4">
              <OrderSummary />
              <button
                type="submit"
                disabled={items.length === 0}
                className="w-full rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-4 text-sm font-black text-white shadow-lg transition hover:from-[#ff5a36] hover:to-[#ff4420] hover:shadow-xl hover:shadow-orange-200 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Review Order <HiChevronRight className="text-lg" />
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  // ── STEP 1: review & confirm ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <DashboardNavbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 animate-fadeIn">
        <button
          type="button"
          onClick={() => setStep(0)}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-[#ff5a36] hover:text-[#ff5a36]"
        >
          <HiArrowLeft /> Edit Details
        </button>

        <StepBar />

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* review card */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md space-y-6">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#ff5a36]">Step 2 of 2</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">Review Your Order</h1>
              <p className="mt-1 text-sm text-slate-500">Double-check everything before confirming.</p>
            </div>

            {/* delivery info summary */}
            <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {[
                { icon: HiUser, label: "Name", value: form.fullName },
                { icon: HiPhone, label: "Phone", value: form.phone },
                { icon: HiLocationMarker, label: "Address", value: form.address },
                ...(form.note ? [{ icon: HiAnnotation, label: "Note", value: form.note }] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4 px-4 py-3.5">
                  <div className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-orange-50 text-[#ff5a36]">
                    <Icon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 break-words">{value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="ml-auto flex-shrink-0 text-xs font-bold text-[#ff5a36] hover:underline"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>

            {/* map preview */}
            {mapUrl && (
              <div className="overflow-hidden rounded-2xl border-2 border-slate-200">
                <iframe
                  title="Delivery location map"
                  src={mapUrl}
                  className="h-48 w-full border-0"
                  loading="lazy"
                />
              </div>
            )}

            {/* COD notice */}
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
              <HiCash className="mt-0.5 flex-shrink-0 text-2xl text-amber-500" />
              <div>
                <p className="text-sm font-black text-amber-900">Cash on Delivery</p>
                <p className="mt-0.5 text-xs font-semibold text-amber-700">
                  Please keep <span className="font-black">PKR {total.toLocaleString()}</span> ready when our rider arrives. No prepayment required.
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-4">
            <OrderSummary />
            <button
              type="button"
              onClick={placeOrder}
              disabled={orderLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#ff5a36] to-[#ff4420] px-4 py-4 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {orderLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Placing order…
                </>
              ) : (
                <>
                  <HiCheckCircle className="text-lg" /> Confirm & Place Order
                </>
              )}
            </button>
            <p className="text-center text-xs font-semibold text-slate-400">
              By placing your order you agree to our terms of service.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckOut;
