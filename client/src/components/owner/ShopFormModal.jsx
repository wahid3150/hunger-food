import React, { useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { HiX, HiUpload, HiOutlineShoppingBag } from "react-icons/hi";
import { serverUrl } from "../../App";

const INITIAL = { name: "", city: "", state: "", address: "" };

const ShopFormModal = ({ shop, onClose, onSaved }) => {
  const isEdit = !!shop;
  const [form, setForm] = useState(
    isEdit
      ? { name: shop.name, city: shop.city, state: shop.state, address: shop.address }
      : INITIAL
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(shop?.image || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !imageFile) {
      toast.error("Shop image is required");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("city", form.city);
      fd.append("state", form.state);
      fd.append("address", form.address);
      if (imageFile) fd.append("image", imageFile);

      if (isEdit) {
        await axios.put(`${serverUrl}/api/shop/update-shop/${shop._id}`, fd, {
          withCredentials: true,
        });
        toast.success("Shop updated!");
      } else {
        await axios.post(`${serverUrl}/api/shop/create-shop`, fd, {
          withCredentials: true,
        });
        toast.success("Shop created!");
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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#ff5a36]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff5a36]/10">
              <HiOutlineShoppingBag className="text-[#ff5a36] text-lg" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? "Edit Shop" : "Create New Shop"}
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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Shop Image {!isEdit && <span className="text-[#ff5a36]">*</span>}
            </label>
            <div
              onClick={() => fileInputRef.current.click()}
              className="relative cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-[#ff5a36]/50 transition overflow-hidden"
              style={{ height: "150px" }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                  <HiUpload className="text-3xl text-[#ff5a36]/50" />
                  <p className="text-xs font-medium">Click to upload image</p>
                  <p className="text-[11px]">PNG, JPG, WEBP</p>
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

          {/* Shop Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Shop Name <span className="text-[#ff5a36]">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Spicy Kitchen"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition"
            />
          </div>

          {/* City & State */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                City <span className="text-[#ff5a36]">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                placeholder="e.g. Peshawar"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                State <span className="text-[#ff5a36]">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                required
                placeholder="e.g. KPK"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Address <span className="text-[#ff5a36]">*</span>
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows={2}
              placeholder="Full street address..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10 transition resize-none"
            />
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
              {loading ? "Saving..." : isEdit ? "Update Shop" : "Create Shop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopFormModal;
