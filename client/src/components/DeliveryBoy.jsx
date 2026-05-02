import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HiCheckCircle,
  HiLocationMarker,
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineCurrencyRupee,
  HiPhone,
  HiUser,
  HiMap,
  HiClock,
  HiX,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { serverUrl } from "../App";
import DashboardNavbar from "./DashboardNavbar";
import socket from "../lib/socket";
import useLiveTracking from "../hooks/useLiveTracking";
import OtpVerification from "./user/OtpVerification";
import DeliveryBoyMap from "./user/DeliveryBoyMap";

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// ── OpenStreetMap embed for customer destination ──────────────────────────────
const buildMapUrl = (lat, lon) => {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return "";
  const d = 0.012;
  const bbox = [lo - d, la - d, lo + d, la + d].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${la},${lo}`;
};

// ── Blinking pin badge ────────────────────────────────────────────────────────
const BlinkingPin = () => (
  <span className="relative inline-flex h-3 w-3">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff5a36] opacity-75" />
    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#ff5a36]" />
  </span>
);

// ── Arrived button: sends OTP to customer then opens OTP panel ────────────────
const ArrivedButton = ({ orderId, onReady }) => {
  const [sending, setSending] = useState(false);

  const handleArrived = async () => {
    setSending(true);
    try {
      await axios.post(
        `${serverUrl}/api/orders/${orderId}/send-otp`,
        {},
        { withCredentials: true }
      );
      toast.success("OTP sent to customer's email");
      onReady();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to send OTP";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleArrived}
      disabled={sending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff5a36] to-[#ff4420] px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {sending ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Sending OTP to customer…
        </>
      ) : (
        <>
          <HiOutlineTruck className="text-lg" />
          I've arrived — Send OTP to Customer
        </>
      )}
    </button>
  );
};




// ── Active order banner ───────────────────────────────────────────────────────
const ActiveBanner = ({ order, onSwitch }) => (
  <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
    <HiOutlineTruck className="flex-shrink-0 text-xl text-amber-500" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-black text-amber-900">Active delivery in progress</p>
      <p className="truncate text-xs font-semibold text-amber-700">
        {order?.deliveryAddress?.text || "En route to customer"}
      </p>
    </div>
    <button
      type="button"
      onClick={onSwitch}
      className="flex-shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-black text-white hover:bg-amber-600 transition"
    >
      View
    </button>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const DeliveryBoy = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState("");
  const [otpOrderId, setOtpOrderId] = useState(null);
  const [expandedMapId, setExpandedMapId] = useState(null);

  const user = useSelector((s) => s.user.userData);

  // The one active (non-delivered) assigned order
  const activeOrder = useMemo(
    () =>
      myOrders.find(
        (o) => o.deliveryStatus === "assigned" && o.status !== "delivered"
      ),
    [myOrders]
  );
  const hasActiveOrder = Boolean(activeOrder);

  // Earnings
  const deliveredToday = useMemo(() => {
    const today = new Date().toDateString();
    return myOrders.filter(
      (o) =>
        o.status === "delivered" &&
        new Date(o.createdAt).toDateString() === today
    );
  }, [myOrders]);

  const todayTotal = useMemo(
    () => deliveredToday.reduce((s, o) => s + Number(o.totalAmount || 0), 0),
    [deliveredToday]
  );

  // ── GPS tracking: starts as soon as there is an active order ─────────────
  // Emits "send-location" via socket every ~2.5 s so the customer can track.
  // Stops automatically when activeOrder becomes null (order delivered).
  useLiveTracking(activeOrder?._id, Boolean(activeOrder?._id));

  // ── Join / leave socket order room tied to activeOrder lifecycle ──────────
  useEffect(() => {
    if (!activeOrder?._id) return;
    socket.emit("join-order", activeOrder._id);
    return () => {
      socket.emit("leave-order", activeOrder._id);
    };
  }, [activeOrder?._id]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAvailableOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${serverUrl}/api/orders/delivery/available-orders`,
        { withCredentials: true }
      );
      setAvailableOrders(res.data?.orders || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load available orders");
      setAvailableOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyOrders = useCallback(async () => {
    try {
      const res = await axios.get(
        `${serverUrl}/api/orders/delivery/my-orders`,
        { withCredentials: true }
      );
      setMyOrders(res.data?.orders || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load your orders");
      setMyOrders([]);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "deliveryBoy") return;
    fetchAvailableOrders();
    fetchMyOrders();
  }, [fetchAvailableOrders, fetchMyOrders, user?.role]);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleStatusUpdated = ({ orderId, status }) => {
      setMyOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o))
      );
    };
    const handleDelivered = ({ orderId }) => {
      setMyOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? { ...o, status: "delivered", deliveryStatus: "delivered" }
            : o
        )
      );
      // Close OTP panel if it was open for this order
      setOtpOrderId((prev) => (prev === orderId ? null : prev));
      fetchAvailableOrders();
    };
    socket.on("order_status_updated", handleStatusUpdated);
    socket.on("order-delivered", handleDelivered);
    return () => {
      socket.off("order_status_updated", handleStatusUpdated);
      socket.off("order-delivered", handleDelivered);
    };
  }, [fetchAvailableOrders]);

  // Auto-poll every 30 s
  useEffect(() => {
    const id = setInterval(() => {
      fetchAvailableOrders();
      fetchMyOrders();
    }, 30_000);
    return () => clearInterval(id);
  }, [fetchAvailableOrders, fetchMyOrders]);


  // ── Accept ────────────────────────────────────────────────────────────────
  const acceptOrder = async (orderId) => {
    if (hasActiveOrder) {
      toast.error("Finish your current delivery before accepting a new one");
      return;
    }
    setAcceptingId(orderId);
    try {
      await axios.patch(
        `${serverUrl}/api/orders/${orderId}/accept`,
        {},
        { withCredentials: true }
      );
      toast.success("Order accepted! Start your delivery now.");
      await fetchMyOrders();
      await fetchAvailableOrders();
      setActiveTab("myOrders");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to accept order");
    } finally {
      setAcceptingId("");
    }
  };

  // ── Not a delivery boy ────────────────────────────────────────────────────
  if (user?.role !== "deliveryBoy") {
    return (
      <div className="min-h-screen bg-[#fff8f5]">
        <DashboardNavbar showCart={false} showOrdersButton={false} showSearch={false} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-md">
            <h1 className="text-2xl font-black text-slate-900">Not authorized</h1>
            <p className="mt-2 text-sm text-slate-500">
              This area is reserved for delivery riders only.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = [
    { key: "available", label: "Available", count: availableOrders.length },
    { key: "myOrders", label: "My orders", count: myOrders.length },
  ];

  return (
    <div className="min-h-screen bg-[#fff8f5]">
      <DashboardNavbar
        showCart={false}
        showOrdersButton={false}
        showSearch={false}
        showLocation={true}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {/* ── Header ── */}
        <section className="rounded-[32px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <HiOutlineTruck className="text-xl text-[#ff5a36]" />
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#ff5a36]">
                  Delivery dashboard
                </p>
              </div>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                {activeTab === "available" ? "Available orders" : "My deliveries"}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab.key
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          activeTab === tab.key
                            ? "bg-[#ff5a36]/10 text-[#ff5a36]"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Live
              </div>
            </div>
          </div>

          {/* Earnings summary */}
          {myOrders.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                  <HiCheckCircle className="text-xl text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Delivered Today</p>
                  <p className="text-lg font-extrabold text-slate-800">{deliveredToday.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff5a36]/10">
                  <HiOutlineCurrencyRupee className="text-xl text-[#ff5a36]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Today's Value</p>
                  <p className="text-lg font-extrabold text-slate-800">
                    PKR {todayTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Active order banner (shown in available tab) ── */}
          {activeTab === "available" && hasActiveOrder && (
            <div className="mt-4">
              <ActiveBanner
                order={activeOrder}
                onSwitch={() => setActiveTab("myOrders")}
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="mt-6 space-y-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-100" />
                ))
              ) : activeTab === "available" ? (
                /* ═══════════════ AVAILABLE ORDERS ═══════════════ */
                availableOrders.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-14 text-center">
                    <HiOutlineClipboardList className="mx-auto text-5xl text-slate-300" />
                    <p className="mt-3 font-bold text-slate-800">No available orders</p>
                    <p className="mt-1 text-sm text-slate-500">
                      New orders will appear once shop owners confirm them.
                    </p>
                  </div>
                ) : (
                  availableOrders.map((order) => {
                    const isExpanded = expandedMapId === order._id;
                    const mapUrl = buildMapUrl(
                      order.deliveryAddress?.latitude,
                      order.deliveryAddress?.longitude
                    );
                    return (
                      <article
                        key={order._id}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl font-black text-slate-950">
                                {order.shop?.name || "Shop order"}
                              </h2>
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                {STATUS_LABELS[order.status] || order.status}
                              </span>
                              {/* Blinking location badge */}
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-[#ff5a36]">
                                <BlinkingPin />
                                Live location
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-600">
                              <HiUser className="mr-1 inline" />
                              {order.customerName || order.user?.fullName || "Customer"}
                              {(order.customerPhone || order.user?.mobile) && (
                                <span className="ml-2">
                                  <HiPhone className="mr-1 inline" />
                                  {order.customerPhone || order.user?.mobile}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">
                              <HiClock className="mr-1 inline" />
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-left lg:text-right">
                            <p className="text-xs font-bold text-slate-400">COD</p>
                            <p className="text-2xl font-black text-slate-950">
                              PKR {Number(order.totalAmount || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="mt-4 space-y-1.5">
                          {(order.items || []).map((item) => (
                            <div
                              key={`${order._id}-${item.item}`}
                              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                            >
                              <span className="font-semibold capitalize text-slate-700">{item.name}</span>
                              <span className="text-slate-500">
                                {item.quantity} × PKR {Number(item.price || 0).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery address + map toggle */}
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMapId(isExpanded ? null : order._id)
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#ff5a36]/40 hover:bg-[#fff7f3] hover:text-[#ff5a36]"
                          >
                            <HiMap />
                            {isExpanded ? "Hide map" : "View customer location"}
                            {isExpanded ? <HiChevronUp /> : <HiChevronDown />}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                              {mapUrl ? (
                                <iframe
                                  title="Customer location"
                                  src={mapUrl}
                                  className="h-56 w-full border-0"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="grid h-32 place-items-center bg-slate-100 text-sm font-semibold text-slate-400">
                                  No coordinates available
                                </div>
                              )}
                              <div className="bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                <HiLocationMarker className="mr-1 inline text-[#ff5a36]" />
                                {order.deliveryAddress?.text || "N/A"}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Accept button */}
                        <button
                          type="button"
                          disabled={acceptingId === order._id || hasActiveOrder}
                          onClick={() => acceptOrder(order._id)}
                          title={hasActiveOrder ? "Complete your active order first" : ""}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff5a36] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#e04e2d] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <HiCheckCircle />
                          {acceptingId === order._id
                            ? "Accepting…"
                            : hasActiveOrder
                            ? "Finish active order first"
                            : "Accept & Start Delivery"}
                        </button>
                      </article>
                    );
                  })
                )
              ) : (
                /* ═══════════════ MY ORDERS ═══════════════ */
                myOrders.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-14 text-center">
                    <HiOutlineClipboardList className="mx-auto text-5xl text-slate-300" />
                    <p className="mt-3 font-bold text-slate-800">No assigned deliveries</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Orders you accept will show up here.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* ── Active delivery card (pinned at top) ── */}
                    {activeOrder && (
                      <div className="rounded-3xl border-2 border-[#ff5a36]/30 bg-gradient-to-br from-[#fff7f3] to-white p-5 shadow-lg">
                        <div className="flex items-center gap-2">
                          <BlinkingPin />
                          <p className="text-xs font-black uppercase tracking-widest text-[#ff5a36]">
                            Active delivery
                          </p>
                        </div>
                        <div className="mt-2 flex items-start justify-between gap-4">
                          <div>
                            <h2 className="text-xl font-black text-slate-900">
                              {activeOrder.shop?.name || "Shop order"}
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-600">
                              <HiUser className="mr-1 inline text-[#ff5a36]" />
                              {activeOrder.customerName || "Customer"}
                              {activeOrder.customerPhone && (
                                <> &nbsp;·&nbsp;
                                  <HiPhone className="mr-1 inline text-[#ff5a36]" />
                                  {activeOrder.customerPhone}
                                </>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400">Collect (COD)</p>
                            <p className="text-xl font-black text-[#ff5a36]">
                              PKR {Number(activeOrder.totalAmount || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Live delivery map — rider's GPS + customer destination */}
                        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-[#ff5a36]/20">
                          <div className="flex items-center gap-2 bg-[#fff7f3] px-4 py-2.5">
                            <BlinkingPin />
                            <p className="text-xs font-black uppercase tracking-widest text-[#ff5a36]">
                              Live navigation — deliver to customer
                            </p>
                          </div>
                          <div className="h-64">
                            <DeliveryBoyMap
                              destLat={activeOrder.deliveryAddress?.latitude}
                              destLng={activeOrder.deliveryAddress?.longitude}
                              address={activeOrder.deliveryAddress?.text}
                            />
                          </div>
                          <div className="bg-slate-50 px-4 py-2.5">
                            <p className="text-xs font-semibold text-slate-600">
                              <HiLocationMarker className="mr-1 inline text-green-500" />
                              {activeOrder.deliveryAddress?.text || "Address not available"}
                            </p>
                          </div>
                        </div>

                        {/* OTP panel / arrived button */}
                        <div className="mt-4">
                          {otpOrderId === activeOrder._id ? (
                            <OtpVerification
                              orderId={activeOrder._id}
                              onSuccess={() => {
                                fetchMyOrders();
                                setOtpOrderId(null);
                              }}
                              onCancel={() => {
                                setOtpOrderId(null);
                              }}
                            />
                          ) : (
                            <ArrivedButton
                              orderId={activeOrder._id}
                              onReady={() => setOtpOrderId(activeOrder._id)}
                            />
                          )}
                        </div>

                        {/* Always-on GPS indicator */}
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                          GPS active — customer can see your live location
                        </div>
                      </div>
                    )}

                    {/* ── Delivered / other orders ── */}
                    {myOrders
                      .filter((o) => o.status === "delivered")
                      .map((order) => (
                        <article
                          key={order._id}
                          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm opacity-80"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-base font-black text-slate-900">
                                  {order.shop?.name || "Shop order"}
                                </h2>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                                  ✓ Delivered
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-400">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-600">
                                {order.customerName || "Customer"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {order.deliveryAddress?.text}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-400">Collected</p>
                              <p className="text-xl font-black text-slate-900">
                                PKR {Number(order.totalAmount || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                  </>
                )
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

export default DeliveryBoy;
