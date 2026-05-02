import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiRefresh,
  HiSearch,
  HiChevronDown,
  HiArrowLeft,
  HiOutlineViewGrid,
  HiOutlinePhotograph,
} from "react-icons/hi";
import { serverUrl } from "../../App";
import ItemFormModal from "./ItemFormModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

const PAGE_LIMIT = 50;

const FOOD_TYPE_COLORS = {
  veg: "bg-emerald-50 text-emerald-600 border-emerald-200",
  "non-veg": "bg-orange-50 text-orange-600 border-orange-200",
};

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
];

const ItemsTab = ({ shops, preSelectedShop, onBack }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterShop, setFilterShop] = useState(preSelectedShop?._id || "");
  const [filterFoodType, setFilterFoodType] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");
  const [sort, setSort] = useState("latest");
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      if (filterShop) params.shopId = filterShop;
      if (filterFoodType) params.foodType = filterFoodType;
      if (filterAvailability !== "") params.isAvailable = filterAvailability;
      if (search) params.search = search;
      if (sort) params.sort = sort;
      const res = await axios.get(`${serverUrl}/api/item/my-items`, {
        params,
        withCredentials: true,
      });
      setItems(res.data?.items || []);
      setTotalItems(Number(res.data?.totalItems || 0));
      setTotalPages(Number(res.data?.totalPages || 1));
    } catch {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [filterShop, filterFoodType, filterAvailability, search, sort, page]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [fetchItems]);

  useEffect(() => {
    setPage(1);
  }, [filterShop, filterFoodType, filterAvailability, search, sort]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`${serverUrl}/api/item/items/${deleteTarget._id}`, {
        withCredentials: true,
      });
      toast.success("Item deleted");
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    setTogglingId(item._id);
    try {
      const res = await axios.patch(
        `${serverUrl}/api/item/items/${item._id}/toggle-availability`,
        {},
        { withCredentials: true }
      );
      toast.success(res.data?.message || "Availability updated");
      fetchItems();
    } catch {
      toast.error("Failed to toggle availability");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
            >
              <HiArrowLeft />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {preSelectedShop ? `Items — ${preSelectedShop.name}` : "All Items"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {items.length} of {totalItems} item{totalItems !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchItems}
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
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition w-44"
          />
        </div>

        {/* Shop filter */}
        {!preSelectedShop && shops && shops.length > 0 && (
          <div className="relative">
            <select
              value={filterShop}
              onChange={(e) => setFilterShop(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition"
            >
              <option value="">All Shops</option>
              {shops.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <HiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          </div>
        )}

        {/* Food type filter */}
        <div className="relative">
          <select
            value={filterFoodType}
            onChange={(e) => setFilterFoodType(e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition"
          >
            <option value="">All Types</option>
            <option value="veg">🥦 Veg</option>
            <option value="non-veg">🍗 Non-Veg</option>
          </select>
          <HiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        </div>

        {/* Availability filter */}
        <div className="relative">
          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition"
          >
            <option value="">All Status</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
          <HiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <HiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        </div>

        {/* Clear filters */}
        {(search || filterShop || filterFoodType || filterAvailability || sort !== "latest") && (
          <button
            onClick={() => {
              setSearch("");
              setFilterShop(preSelectedShop?._id || "");
              setFilterFoodType("");
              setFilterAvailability("");
              setSort("latest");
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-slate-100 animate-pulse h-20" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-4">
            <HiOutlineViewGrid className="text-4xl text-slate-400" />
          </div>
          <p className="text-base font-semibold text-slate-700">No items found</p>
          <p className="text-sm text-slate-500 mt-1">
            {search || filterFoodType || filterAvailability
              ? "Try adjusting your filters"
              : "Add your first menu item"}
          </p>
          {!search && !filterFoodType && !filterAvailability && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-[#ff5a36] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#e04e2d] transition"
            >
              <HiPlus /> Add Item
            </button>
          )}
        </div>
      )}

      {/* Items list */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition group"
            >
              {/* Image */}
              <div className="h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <HiOutlinePhotograph className="text-slate-400 text-2xl" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 text-sm capitalize line-clamp-1">
                    {item.name}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      FOOD_TYPE_COLORS[item.foodType] || "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    {item.foodType === "veg" ? "🥦 Veg" : "🍗 Non-Veg"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm font-bold text-[#ff5a36]">
                    PKR {item.price}
                  </span>
                  <span className="text-xs text-slate-400 capitalize bg-slate-50 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  {item.shop?.name && (
                    <span className="text-xs text-slate-400">
                      🏪 {item.shop.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Availability toggle */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleAvailability(item)}
                  disabled={togglingId === item._id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    item.isAvailable ? "bg-[#ff5a36]" : "bg-slate-200"
                  } ${togglingId === item._id ? "opacity-50" : ""}`}
                  title={item.isAvailable ? "Mark unavailable" : "Mark available"}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      item.isAvailable ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-[10px] font-medium text-slate-400">
                  {item.isAvailable ? "Live" : "Off"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setEditItem(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-[#ff5a36]/30 hover:text-[#ff5a36] hover:bg-[#ff5a36]/5 transition"
                  title="Edit item"
                >
                  <HiPencil className="text-sm" />
                </button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition"
                  title="Delete item"
                >
                  <HiTrash className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="rounded-xl bg-[#ff5a36] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#e04e2d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <ItemFormModal
          shops={shops}
          defaultShopId={preSelectedShop?._id || ""}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            fetchItems();
          }}
        />
      )}

      {editItem && (
        <ItemFormModal
          item={editItem}
          shops={shops}
          onClose={() => setEditItem(null)}
          onSaved={() => {
            setEditItem(null);
            fetchItems();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Item"
          message={`Are you sure you want to delete "${deleteTarget.name}"?`}
          loading={deleteLoading}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default ItemsTab;
