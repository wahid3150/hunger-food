import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiChevronDown,
  HiSearch,
  HiX,
} from "react-icons/hi";
import { serverUrl } from "../../App";
import socket from "../../lib/socket";

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const NEXT_ACTIONS = {
  pending: [
    { status: "confirmed", label: "Confirm" },
    { status: "cancelled", label: "Cancel" },
  ],
  confirmed: [
    { status: "preparing", label: "Start preparing" },
    { status: "cancelled", label: "Cancel" },
  ],
  preparing: [],
  out_for_delivery: [],
  delivered: [],
  cancelled: [],
};

const statusClass = (status) => {
  if (status === "delivered") return "bg-emerald-50 text-emerald-600";
  if (status === "cancelled") return "bg-red-50 text-red-600";
  if (status === "out_for_delivery") return "bg-blue-50 text-blue-600";
  if (status === "preparing") return "bg-amber-50 text-amber-600";
  return "bg-[#fff0eb] text-[#ff5a36]";
};

const OrdersTab = ({ shops }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const shopMap = useMemo(
    () =>
      shops.reduce((map, shop) => {
        map[shop._id] = shop;
        return map;
      }, {}),
    [shops],
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const targetShops = selectedShopId
        ? shops.filter((shop) => shop._id === selectedShopId)
        : shops;

      const responses = await Promise.all(
        targetShops.map((shop) =>
          axios.get(`${serverUrl}/api/orders/shop/${shop._id}`, {
            withCredentials: true,
          }),
        ),
      );

      const nextOrders = responses
        .flatMap((res, index) =>
          (res.data?.orders || []).map((order) => ({
            ...order,
            shop: order.shop || targetShops[index],
            shopId: order.shop?._id || targetShops[index]?._id,
          })),
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setOrders(nextOrders);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load shop orders",
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, shops]);

  useEffect(() => {
    if (shops.length > 0) {
      fetchOrders();
      return;
    }
    setOrders([]);
    setLoading(false);
  }, [fetchOrders, shops.length]);

  // ── Socket: real-time order updates ──────────────────────────────────────
  useEffect(() => {
    const handleNewOrder = () => fetchOrders(); // refetch to get full order data

    const handleStatusUpdated = ({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o)),
      );
    };

    const handleDeliveryAssigned = ({ orderId }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? {
                ...o,
                deliveryStatus: "assigned",
                deliveryBoy: true,
                status: "out_for_delivery",
              }
            : o,
        ),
      );
    };

    const handleDelivered = ({ orderId }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? { ...o, status: "delivered", deliveryStatus: "delivered" }
            : o,
        ),
      );
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_status_updated", handleStatusUpdated);
    socket.on("delivery_boy_assigned", handleDeliveryAssigned);
    socket.on("order-delivered", handleDelivered);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_status_updated", handleStatusUpdated);
      socket.off("delivery_boy_assigned", handleDeliveryAssigned);
      socket.off("order-delivered", handleDelivered);
    };
  }, [fetchOrders]);

  const updateStatus = async (order, status) => {
    setUpdatingId(order._id);
    try {
      await axios.patch(
        `${serverUrl}/api/orders/${order._id}/status`,
        { status },
        { withCredentials: true },
      );
      // Optimistically update in-place (socket will also confirm)
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, status } : o)),
      );
      toast.success("Order status updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId("");
    }
  };
  // Client-side search + status filter
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filterStatus) result = result.filter((o) => o.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          (o.customerName || o.user?.fullName || "").toLowerCase().includes(q) ||
          (o.customerPhone || o.user?.mobile || "").includes(q) ||
          o._id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, search, filterStatus]);

  const hasActiveFilters = search || filterStatus;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Orders</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? "s" : ""} shown
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Customer, phone, order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-8 py-2 h-10 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition w-52"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <HiX className="text-sm" />
              </button>
            )}
          </div>
          {/* Status filter */}
          <label className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#ff5a36]"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </label>
          {/* Shop filter */}
          <label className="relative">
            <select
              value={selectedShopId}
              onChange={(event) => setSelectedShopId(event.target.value)}
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#ff5a36]"
            >
              <option value="">All shops</option>
              {shops.map((shop) => (
                <option key={shop._id} value={shop._id}>{shop.name}</option>
              ))}
            </select>
            <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </label>
          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(""); setFilterStatus(""); }}
              className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
            >
              Clear
            </button>
          )}
          {/* Live indicator */}
          <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-14 text-center shadow-sm">
          <HiOutlineClipboardList className="mx-auto text-5xl text-slate-300" />
          <p className="mt-3 font-bold text-slate-800">No orders found</p>
          <p className="mt-1 text-sm text-slate-500">
            New customer orders will appear here.
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-14 text-center shadow-sm">
          <HiSearch className="mx-auto text-5xl text-slate-300" />
          <p className="mt-3 font-bold text-slate-800">No matching orders</p>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search or filter.
          </p>
          <button
            onClick={() => { setSearch(""); setFilterStatus(""); }}
            className="mt-3 text-sm font-semibold text-[#ff5a36] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const shop = shopMap[order.shopId] || order.shop || {};
            const actions = NEXT_ACTIONS[order.status] || [];

            return (
              <article
                key={order._id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-800">
                        {shop.name || "Shop order"}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(order.status)}`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Customer:{" "}
                      {order.customerName || order.user?.fullName || "Customer"}
                      {order.customerPhone || order.user?.mobile
                        ? ` • ${order.customerPhone || order.user?.mobile}`
                        : ""}
                    </p>
                    <p className="mt-1 max-w-2xl text-xs font-medium text-slate-500">
                      {order.deliveryAddress?.text ||
                        "No delivery address saved"}
                    </p>
                  </div>

                  <div className="min-w-[220px]">
                    <p className="text-xs font-bold text-slate-400 xl:text-right">
                      Order total
                    </p>
                    <p className="text-xl font-extrabold text-slate-900 xl:text-right">
                      PKR {Number(order.totalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 lg:grid-cols-[1fr_260px]">
                  <div className="space-y-2">
                    {(order.items || []).map((item) => (
                      <div
                        key={`${order._id}-${item.item}`}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="font-bold capitalize text-slate-700">
                          {item.name}
                        </span>
                        <span className="font-semibold text-slate-500">
                          {item.quantity} x PKR{" "}
                          {Number(item.price || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                    <div className="space-y-2">
                      {actions.length > 0 ? (
                        actions.map((action) => (
                          <button
                            key={action.status}
                            type="button"
                            disabled={updatingId === order._id}
                            onClick={() => updateStatus(order, action.status)}
                            className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              action.status === "cancelled"
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-[#ff5a36] text-white hover:bg-[#e04e2d]"
                            }`}
                          >
                            {updatingId === order._id ? "Updating..." : action.label}
                          </button>
                        ))
                      ) : (
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                          {order.status === "out_for_delivery"
                            ? "Rider is on the way"
                            : order.status === "preparing" && !order.deliveryBoy
                            ? "Waiting for a delivery rider"
                            : "No actions available"}
                        </div>
                      )}

                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-800">Delivery status</p>
                        <p className="mt-1">
                          {String(order.deliveryStatus || "not_assigned").replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {order.deliveryBoy
                            ? <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">✓ Rider assigned &amp; en route</span>
                            : "Waiting for delivery rider"}
                        </p>
                      </div>
                    </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
