import React, { useEffect, useState } from "react";
import { HiChevronRight, HiLocationMarker } from "react-icons/hi";
import { fetchOwnerItems } from "../../utils/fetchOwnerItems";

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
    <div
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
      style={{ background: `${color}18` }}
    >
      {icon}
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-800">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const OverviewTab = ({ shops, onGoToShops, onGoToItems }) => {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    fetchOwnerItems()
      .then((res) => setItems(res.items))
      .catch(() => {})
      .finally(() => setLoadingItems(false));
  }, []);

  const availableItems = items.filter((i) => i.isAvailable).length;
  const unavailableItems = items.length - availableItems;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-br from-[#ff5a36] to-[#ff8c42] p-6 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-8 h-24 w-24 rounded-full bg-white/10" />
        <p className="text-sm font-medium text-white/80">Welcome back 👋</p>
        <h2 className="text-2xl font-extrabold mt-1">Owner Dashboard</h2>
        <p className="text-sm text-white/80 mt-1">
          Manage your shops and menu items from one place.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🏪" label="Total Shops" value={shops.length} color="#ff5a36" />
        <StatCard icon="🍽️" label="Total Items" value={loadingItems ? "—" : items.length} color="#8b5cf6" />
        <StatCard icon="✅" label="Available Items" value={loadingItems ? "—" : availableItems} color="#10b981" />
        <StatCard icon="⏸️" label="Unavailable" value={loadingItems ? "—" : unavailableItems} color="#f59e0b" />
      </div>

      {/* Shops preview */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Your Shops</h3>
          <button
            onClick={onGoToShops}
            className="flex items-center gap-1 text-xs font-semibold text-[#ff5a36] hover:underline"
          >
            View all <HiChevronRight />
          </button>
        </div>

        {shops.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-6xl mb-3">🏪</p>
            <p className="text-sm text-slate-500">No shops yet. Create your first shop!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {shops.slice(0, 4).map((shop) => (
              <div
                key={shop._id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition"
              >
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  {shop.image ? (
                    <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xl">🏪</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{shop.name}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <HiLocationMarker className="text-[#ff5a36] text-xs" />
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

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onGoToShops}
          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-[#ff5a36]/20 transition text-left group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff5a36]/10 text-xl flex-shrink-0">
            🏪
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Manage Shops</p>
            <p className="text-xs text-slate-500">Create, edit and delete your shops</p>
          </div>
          <HiChevronRight className="ml-auto text-slate-300 group-hover:text-[#ff5a36] transition" />
        </button>

        <button
          onClick={onGoToItems}
          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition text-left group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-xl flex-shrink-0">
            🍽️
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Manage Items</p>
            <p className="text-xs text-slate-500">Add and manage your menu items</p>
          </div>
          <HiChevronRight className="ml-auto text-slate-300 group-hover:text-purple-400 transition" />
        </button>
      </div>
    </div>
  );
};

export default OverviewTab;
