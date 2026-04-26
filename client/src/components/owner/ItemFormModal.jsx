import React, { useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HiX,
  HiUpload,
  HiChevronDown,
} from "react-icons/hi";
import { serverUrl } from "../../App";

const CATEGORIES = [
  "snacks", "desserts", "pizza", "burger", "sandwich", "wrap",
  "salad", "pasta", "rice", "noodles", "chicken", "beef",
  "pork", "vegetable", "fruit", "drink", "other",
];

const INITIAL = {
  name: "",
  price: "",
  category: "",
  foodType: "",
  isAvailable: true,
};

const ItemFormModal = ({ item, shops, defaultShopId, onClose, onSaved }) => {
  const isEdit = !!item;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: item.name,
          price: item.price,
          category: item.category,
          foodType: item.foodType,
          isAvailable: item.isAvailable,
        }
      : INITIAL
  );
  const [selectedShopId, setSelectedShopId] = useState(
    isEdit ? item.shop?._id || item.shop : defaultShopId || shops?.[0]?._id || ""
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(item?.image || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !imageFile) {
      toast.error("Item image is required");
      return;
    }
    if (!selectedShopId) {
      toast.error("Please select a shop");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("price", form.price);
      fd.append("category", form.category);
      fd.append("foodType", form.foodType);
      fd.append("isAvailable", form.isAvailable);
      if (imageFile) fd.append("image", imageFile);

      if (isEdit) {
        await axios.put(`${serverUrl}/api/item/items/${item._id}`, fd, {
          withCredentials: true,
        });
        toast.success("Item updated!");
      } else {
        await axios.post(`${serverUrl}/api/item/shops/${selectedShopId}/items`, fd, {
          withCredentials: true,
        });
        toast.success("Item created!");
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#ff5a36]/5 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff5a36]/10 text-xl">
              🍔
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? "Edit Item" : "Add New Item"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <HiX className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Shop Selector (only on create) */}
          {!isEdit && shops && shops.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Select Shop <span className="text-[#ff5a36]">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  required
                  className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition pr-9"
                >
                  <option value="">-- Select a shop --</option>
                  {shops.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Item Image {!isEdit && <span className="text-[#ff5a36]">*</span>}
            </label>
            <div
              onClick={() => fileInputRef.current.click()}
              className="relative cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-[#ff5a36]/50 transition overflow-hidden"
              style={{ height: "130px" }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                  <HiUpload className="text-3xl text-[#ff5a36]/50" />
                  <p className="text-xs font-medium">Click to upload image</p>
                </div>
              )}
              {imagePreview && (
                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                  <p className="text-white text-xs font-semibold">Change Image</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Item Name <span className="text-[#ff5a36]">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Chicken Burger"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Price (PKR) <span className="text-[#ff5a36]">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              min={0}
              placeholder="e.g. 350"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition"
            />
          </div>

          {/* Category & Food Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Category <span className="text-[#ff5a36]">*</span>
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition pr-9 capitalize"
                >
                  <option value="">-- Select --</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
                <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Food Type <span className="text-[#ff5a36]">*</span>
              </label>
              <div className="relative">
                <select
                  name="foodType"
                  value={form.foodType}
                  onChange={handleChange}
                  required
                  className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition pr-9"
                >
                  <option value="">-- Select --</option>
                  <option value="veg">🥦 Veg</option>
                  <option value="non-veg">🍗 Non-Veg</option>
                </select>
                <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Availability toggle */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <label className="flex-1 text-sm font-medium text-slate-700">
              Available for orders
            </label>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isAvailable ? "bg-[#ff5a36]" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  form.isAvailable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[#ff5a36] py-2.5 text-sm font-bold text-white hover:bg-[#e04e2d] disabled:opacity-60 transition"
            >
              {loading ? "Saving..." : isEdit ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemFormModal;
