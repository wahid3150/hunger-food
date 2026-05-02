import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  HiOutlineShoppingBag,
  HiOutlineViewGrid,
  HiOutlineCheckCircle,
  HiOutlinePause,
  HiOutlineTrendingUp,
  HiChevronRight,
  HiLocationMarker,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCurrencyDollar,
} from "react-icons/hi";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { serverUrl } from "../../App";
import { fetchOwnerItems } from "../../utils/fetchOwnerItems";
import { formatPrice, formatRelativeTime } from "../../utils/formatters";

/* ── Helpers ─────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fef3c7" },
  confirmed: { label: "Confirmed", color: "#3b82f6", bg: "#dbeafe" },
  preparing: { label: "Preparing", color: "#f97316", bg: "#ffedd5" },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "#06b6d4",
    bg: "#cffafe",
  },
  delivered: { label: "Delivered", color: "#10b981", bg: "#d1fae5" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fee2e2" },
};

const buildRevenueData = (orders) => {
  const days = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { weekday: "short" });
    days[key] = { name: key, revenue: 0, orders: 0 };
  }
  orders
    .filter((o) => o.status !== "cancelled")
    .forEach((order) => {
      const d = new Date(order.createdAt);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      if (days[key]) {
        days[key].revenue += Number(order.totalAmount || 0);
        days[key].orders += 1;
      }
    });
  return Object.values(days);
};

const buildStatusData = (orders) => {
  const counts = {};
  orders.forEach((o) => {
    const cfg = STATUS_CONFIG[o.status];
    if (!cfg) return;
    if (!counts[o.status])
      counts[o.status] = { name: cfg.label, count: 0, color: cfg.color };
    counts[o.status].count += 1;
  });
  return Object.values(counts).sort((a, b) => b.count - a.count);
};

/* ── Stat Card ───────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div
    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm
                flex items-center gap-4 hover:shadow-md transition-shadow duration-200"
  >
    <div
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
      style={{ background: `${accent}18` }}
    >
      <Icon className="text-2xl" style={{ color: accent }} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-extrabold text-slate-800 leading-none">
        {value}
      </p>
      <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ── Custom Tooltip ──────────────────────────────── */
const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-900 px-3 py-2 shadow-xl text-white text-xs">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {prefix}
          {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

/* ── Main Component ──────────────────────────────── */
const OverviewTab = ({ shops, onGoToShops, onGoToItems, onGoToOrders }) => {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  /* Fetch items */
  useEffect(() => {
    fetchOwnerItems()
      .then((res) => setItems(res.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, []);

  /* Fetch orders from all shops */
  const fetchOrders = useCallback(async () => {
    if (!shops?.length) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    try {
      const responses = await Promise.all(
        shops.map((shop) =>
          axios.get(`${serverUrl}/api/orders/shop/${shop._id}`, {
            withCredentials: true,
          }),
        ),
      );
      const all = responses.flatMap((res) => res.data?.orders || []);
      setOrders(
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      );
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [shops]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* Derived stats */
  const availableItems = items.filter((i) => i.isAvailable).length;
  const unavailableItems = items.length - availableItems;
  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  const revenueData = useMemo(() => buildRevenueData(orders), [orders]);
  const statusData = useMemo(() => buildStatusData(orders), [orders]);
  const recentOrders = orders.slice(0, 5);

  const isLoading = loadingItems || loadingOrders;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ff5a36] to-[#ff8c42] p-6 text-white">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-[-30px] h-28 w-28 rounded-full bg-white/10" />
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/80">Welcome back 👋</p>
          <h2 className="mt-1 text-2xl font-extrabold">Owner Dashboard</h2>
          <p className="mt-1 text-sm text-white/80">
            Manage your shops, menu items, and orders from one place.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={onGoToOrders}
              className="rounded-lg bg-white/20 hover:bg-white/30 transition px-3 py-1.5 text-xs font-semibold"
            >
              View Orders →
            </button>
            <button
              onClick={onGoToShops}
              className="rounded-lg bg-white/20 hover:bg-white/30 transition px-3 py-1.5 text-xs font-semibold"
            >
              My Shops →
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={HiOutlineShoppingBag}
          label="Total Shops"
          value={shops.length}
          sub={
            shops.length === 1
              ? "1 active shop"
              : `${shops.length} active shops`
          }
          accent="#ff5a36"
        />
        <StatCard
          icon={HiOutlineViewGrid}
          label="Menu Items"
          value={loadingItems ? "—" : items.length}
          sub={loadingItems ? "" : `${availableItems} available`}
          accent="#8b5cf6"
        />
        <StatCard
          icon={HiOutlineCurrencyDollar}
          label="Total Revenue"
          value={
            loadingOrders ? "—" : `PKR ${Number(totalRevenue).toLocaleString()}`
          }
          sub="From delivered orders"
          accent="#10b981"
        />
        <StatCard
          icon={HiOutlineClipboardList}
          label="Total Orders"
          value={loadingOrders ? "—" : orders.length}
          sub={loadingOrders ? "" : `${pendingCount} pending`}
          accent="#f59e0b"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">
                Revenue — Last 7 Days
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Delivered orders only
              </p>
            </div>
            <HiOutlineTrendingUp className="text-xl text-[#ff5a36]" />
          </div>
          {loadingOrders ? (
            <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart
                data={revenueData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5a36" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ff5a36" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip prefix="PKR " />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#ff5a36"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={{ r: 3, fill: "#ff5a36" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Orders by Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {orders.length} total orders
              </p>
            </div>
            <HiOutlineCheckCircle className="text-xl text-emerald-500" />
          </div>
          {loadingOrders ? (
            <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
          ) : statusData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <HiOutlineClipboardList className="text-4xl mb-2" />
              <p className="text-sm font-medium">No orders yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={statusData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Orders" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Shops Preview + Recent Orders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Shops Preview */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HiOutlineShoppingBag className="text-[#ff5a36]" />
              <h3 className="font-bold text-slate-800">Your Shops</h3>
            </div>
            <button
              onClick={onGoToShops}
              className="flex items-center gap-1 text-xs font-semibold text-[#ff5a36] hover:underline"
            >
              View all <HiChevronRight />
            </button>
          </div>
          {shops.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <HiOutlineShoppingBag className="mx-auto text-5xl text-slate-200 mb-2" />
              <p className="text-sm text-slate-500">
                No shops yet. Create your first shop!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {shops.slice(0, 4).map((shop) => (
                <div
                  key={shop._id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition"
                >
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {shop.image ? (
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <HiOutlineShoppingBag className="text-slate-400 text-xl" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {shop.name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <HiLocationMarker className="text-[#ff5a36] text-xs flex-shrink-0" />
                      {shop.city}, {shop.state}
                    </div>
                  </div>
                  <button
                    onClick={onGoToItems}
                    className="flex-shrink-0 text-xs font-semibold text-[#ff5a36] hover:underline"
                  >
                    Items
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HiOutlineClipboardList className="text-amber-500" />
              <h3 className="font-bold text-slate-800">Recent Orders</h3>
            </div>
            <button
              onClick={onGoToOrders}
              className="flex items-center gap-1 text-xs font-semibold text-[#ff5a36] hover:underline"
            >
              View all <HiChevronRight />
            </button>
          </div>
          {loadingOrders ? (
            <div className="divide-y divide-slate-50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-100 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-slate-100 animate-pulse rounded" />
                    <div className="h-2.5 w-20 bg-slate-100 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <HiOutlineClipboardList className="mx-auto text-5xl text-slate-200 mb-2" />
              <p className="text-sm text-slate-500">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentOrders.map((order) => {
                const cfg =
                  STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={order._id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition"
                  >
                    <div
                      className="h-9 w-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ background: cfg.bg }}
                    >
                      {order.status === "pending" && (
                        <HiOutlineClock style={{ color: cfg.color }} />
                      )}
                      {order.status === "delivered" && (
                        <HiOutlineCheckCircle style={{ color: cfg.color }} />
                      )}
                      {order.status === "cancelled" && (
                        <HiOutlineExclamationCircle
                          style={{ color: cfg.color }}
                        />
                      )}
                      {!["pending", "delivered", "cancelled"].includes(
                        order.status,
                      ) && (
                        <HiOutlineClipboardList style={{ color: cfg.color }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {order.customerName ||
                          order.user?.fullName ||
                          "Customer"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatRelativeTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-800">
                        PKR {Number(order.totalAmount || 0).toLocaleString()}
                      </p>
                      <span
                        className="text-[10px] font-bold rounded-full px-2 py-0.5 mt-0.5 inline-block"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onGoToShops}
          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm
                     hover:shadow-md hover:border-[#ff5a36]/20 transition-all text-left group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff5a36]/10 flex-shrink-0">
            <HiOutlineShoppingBag className="text-[#ff5a36] text-xl" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">Manage Shops</p>
            <p className="text-xs text-slate-500">
              Create, edit and delete your shops
            </p>
          </div>
          <HiChevronRight className="text-slate-300 group-hover:text-[#ff5a36] transition" />
        </button>

        <button
          onClick={onGoToItems}
          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm
                     hover:shadow-md hover:border-purple-200 transition-all text-left group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 flex-shrink-0">
            <HiOutlineViewGrid className="text-purple-500 text-xl" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">Manage Items</p>
            <p className="text-xs text-slate-500">
              Add and manage your menu items
            </p>
          </div>
          <HiChevronRight className="text-slate-300 group-hover:text-purple-400 transition" />
        </button>
      </div>
    </div>
  );
};

export default OverviewTab;
