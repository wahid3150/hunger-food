import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HiOutlineRefresh,
  HiOutlineClipboardList,
  HiCheckCircle,
  HiOutlineTruck,
} from "react-icons/hi";
import { serverUrl } from "../App";
import DashboardNavbar from "./DashboardNavbar";

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const DeliveryBoy = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState("");

  const user = useSelector((state) => state.user.userData);
  const selectedOrders = useMemo(
    () => (activeTab === "available" ? availableOrders : myOrders),
    [activeTab, availableOrders, myOrders],
  );

  const fetchAvailableOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${serverUrl}/api/orders/delivery/available-orders`,
        {
          withCredentials: true,
        },
      );
      setAvailableOrders(response.data?.orders || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load available orders",
      );
      setAvailableOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${serverUrl}/api/orders/delivery/my-orders`,
        {
          withCredentials: true,
        },
      );
      setMyOrders(response.data?.orders || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load your orders",
      );
      setMyOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "deliveryBoy") return;
    if (activeTab === "available") {
      fetchAvailableOrders();
    } else {
      fetchMyOrders();
    }
  }, [activeTab, fetchAvailableOrders, fetchMyOrders, user?.role]);

  const acceptOrder = async (orderId) => {
    if (user?.role !== "deliveryBoy") {
      toast.error("Only delivery riders can accept orders");
      return;
    }

    setAcceptingId(orderId);
    try {
      await axios.patch(
        `${serverUrl}/api/orders/${orderId}/accept`,
        {},
        { withCredentials: true },
      );
      toast.success("Order accepted successfully");
      fetchAvailableOrders();
      fetchMyOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to accept order");
    } finally {
      setAcceptingId("");
    }
  };

  if (user?.role !== "deliveryBoy") {
    return (
      <div className="min-h-screen bg-[#fff8f5]">
        <DashboardNavbar
          showCart={false}
          showOrdersButton={false}
          showSearch={false}
        />
        <main className="mx-auto w-full max-w-6xl px-4 py-6">
          <div className="rounded-[32px] border border-slate-200/80 bg-white p-8 shadow-[0_18px_55px_rgba(15,23,42,0.06)] text-center">
            <h1 className="text-2xl font-black text-slate-950">
              Not authorized
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              This area is reserved for delivery riders only.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f5]">
      <DashboardNavbar
        showCart={false}
        showOrdersButton={false}
        showSearch={false}
        showLocation={true}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
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
                {activeTab === "available"
                  ? "Available orders"
                  : "My deliveries"}
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {activeTab === "available"
                  ? "Accept new delivery orders for your assigned shops."
                  : "Track orders you have already accepted."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-1">
                {[
                  { key: "available", label: "Available" },
                  { key: "myOrders", label: "My orders" },
                ].map((tab) => (
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
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={
                  activeTab === "available"
                    ? fetchAvailableOrders
                    : fetchMyOrders
                }
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <HiOutlineRefresh className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              [1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-3xl bg-slate-100"
                />
              ))
            ) : selectedOrders.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-14 text-center">
                <HiOutlineClipboardList className="mx-auto text-5xl text-slate-300" />
                <p className="mt-3 font-bold text-slate-800">
                  {activeTab === "available"
                    ? "No available orders"
                    : "No assigned deliveries"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {activeTab === "available"
                    ? "New orders will appear here once shop owners confirm them."
                    : "Orders you accept will show up here."}
                </p>
              </div>
            ) : (
              selectedOrders.map((order) => (
                <article
                  key={order._id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-slate-950">
                          {order.shop?.name || "Shop order"}
                        </h2>
                        <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        {order.customerName ||
                          order.user?.fullName ||
                          "Customer"}
                        {order.customerPhone || order.user?.mobile
                          ? ` • ${order.customerPhone || order.user?.mobile}`
                          : ""}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-xs font-bold text-slate-400">Total</p>
                      <p className="text-2xl font-black text-slate-950">
                        PKR {Number(order.totalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_260px]">
                    <div className="space-y-2">
                      {(order.items || []).map((item) => (
                        <div
                          key={`${order._id}-${item.item}`}
                          className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                        >
                          <span className="font-semibold text-slate-700 capitalize">
                            {item.name}
                          </span>
                          <span className="text-slate-500">
                            {item.quantity} x PKR{" "}
                            {Number(item.price || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Delivery status
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {String(
                            order.deliveryStatus || "not_assigned",
                          ).replaceAll("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Delivery address
                        </p>
                        <p className="mt-1">
                          {order.deliveryAddress?.text || "Not available"}
                        </p>
                      </div>
                      {activeTab === "myOrders" && order.deliveryBoy ? (
                        <p className="text-xs text-slate-500">
                          Assigned to you
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {activeTab === "available" && (
                    <button
                      type="button"
                      disabled={acceptingId === order._id}
                      onClick={() => acceptOrder(order._id)}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff5a36] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#e04e2d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <HiCheckCircle />
                      {acceptingId === order._id
                        ? "Accepting..."
                        : "Accept order"}
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DeliveryBoy;
