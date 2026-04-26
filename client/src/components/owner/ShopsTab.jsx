import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiRefresh,
  HiLocationMarker,
  HiSearch,
} from "react-icons/hi";
import { serverUrl } from "../../App";
import ShopFormModal from "./ShopFormModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

const ShopsTab = ({ onSelectShop }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editShop, setEditShop] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/shop/my-shops`, {
        withCredentials: true,
      });
      setShops(res.data?.shops || []);
    } catch {
      toast.error("Failed to load shops");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`${serverUrl}/api/shop/delete-shop/${deleteTarget._id}`, {
        withCredentials: true,
      });
      toast.success("Shop deleted successfully");
      setDeleteTarget(null);
      fetchShops();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = shops.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Shops</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {shops.length} shop{shops.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search shops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition w-48"
            />
          </div>
          <button
            onClick={fetchShops}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <HiRefresh className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-[#ff5a36] px-4 py-2 text-sm font-bold text-white hover:bg-[#e04e2d] transition shadow-sm shadow-[#ff5a36]/30"
          >
            <HiPlus className="text-base" />
            New Shop
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-slate-100 animate-pulse h-56" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <p className="text-base font-semibold text-slate-700">
            {search ? "No shops found" : "No shops yet"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {search
              ? "Try a different search term"
              : "Create your first shop to get started"}
          </p>
          {!search && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-[#ff5a36] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#e04e2d] transition"
            >
              <HiPlus /> Create Shop
            </button>
          )}
        </div>
      )}

      {/* Shops grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((shop) => (
            <div
              key={shop._id}
              className="group relative rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
            >
              {/* Shop Image */}
              <div className="relative h-40 bg-slate-100 overflow-hidden">
                {shop.image ? (
                  <img
                    src={shop.image}
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-5xl">🏪</div>
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => setEditShop(shop)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 hover:bg-white shadow-sm transition"
                    title="Edit shop"
                  >
                    <HiPencil className="text-sm" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(shop)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-red-500 hover:bg-white shadow-sm transition"
                    title="Delete shop"
                  >
                    <HiTrash className="text-sm" />
                  </button>
                </div>
              </div>

              {/* Shop Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1">
                    {shop.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1 mt-1.5 text-slate-500">
                  <HiLocationMarker className="text-[#ff5a36] text-xs flex-shrink-0" />
                  <p className="text-xs truncate">
                    {shop.city}, {shop.state}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{shop.address}</p>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectShop && onSelectShop(shop)}
                    className="flex-1 rounded-lg bg-[#ff5a36]/8 py-1.5 text-xs font-semibold text-[#ff5a36] hover:bg-[#ff5a36]/15 transition"
                  >
                    Manage Items
                  </button>
                  <button
                    onClick={() => setEditShop(shop)}
                    className="flex-1 rounded-lg bg-slate-50 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(shop)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition"
                  >
                    <HiTrash className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <ShopFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            fetchShops();
          }}
        />
      )}

      {editShop && (
        <ShopFormModal
          shop={editShop}
          onClose={() => setEditShop(null)}
          onSaved={() => {
            setEditShop(null);
            fetchShops();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Shop"
          message={`Are you sure you want to delete "${deleteTarget.name}"? All associated items will also be affected.`}
          loading={deleteLoading}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default ShopsTab;
