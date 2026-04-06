import React, { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { clearUser } from "../../redux/userSlice";
import {
  HiOutlineLocationMarker,
  HiOutlineSearch,
  HiOutlineShoppingCart,
} from "react-icons/hi";
import useGetCity from "../hooks/useGetCity";
import { serverUrl } from "../App";

const getInitials = (name) => {
  const safe = String(name || "").trim();
  if (!safe) return "U";
  const parts = safe.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (first + last).toUpperCase() || "U";
};

const DashboardNavbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userData);
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const btnRef = useRef(null);
  const { city } = useGetCity();

  const fullName = user?.fullName || "Account";
  const initials = useMemo(() => getInitials(fullName), [fullName]);

  const location = selectedLocation || city || "Peshawar";
  const locationOptions = useMemo(() => {
    const baseOptions = [location, city].filter(Boolean);
    return [...new Set(baseOptions.filter(Boolean))];
  }, [city, location]);

  const onLogout = async () => {
    try {
      await axios.post(
        `${serverUrl}/api/auth/logout`,
        {},
        { withCredentials: true },
      );
    } catch (error) {
      console.error("Logout API failed:", error?.response?.data || error?.message);
    } finally {
      dispatch(clearUser());
      navigate("/signin", { replace: true });
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b border-[#f1e5df] bg-white">
      {/* Desktop */}
      <div className="mx-auto hidden w-full max-w-6xl items-center gap-4 px-4 py-3 md:flex">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="text-xl font-extrabold tracking-tight text-[#ff5a36]">
            Hunger Food
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <HiOutlineLocationMarker className="text-lg text-[#ff5a36]" />
            <select
              value={location}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="cursor-pointer bg-transparent text-sm font-medium text-slate-700 outline-none"
              aria-label="Location"
            >
              {locationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search (center, big with shadow like screenshot) */}
        <div className="flex flex-1 justify-center">
          <div className="relative w-full max-w-2xl">
            <HiOutlineSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
            <input
              type="text"
              placeholder="search delicious food..."
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 outline-none shadow-[0_10px_25px_rgba(15,23,42,0.10)] transition focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative rounded-full p-2 text-slate-700 transition hover:bg-slate-50"
            aria-label="Cart"
          >
            <HiOutlineShoppingCart className="text-2xl" />
            <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#ff5a36] text-[10px] font-bold text-white">
              0
            </span>
          </button>

          <button
            type="button"
            className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            My Orders
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              ref={btnRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#ff5a36] text-sm font-bold text-white shadow-sm"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Profile menu"
            >
              {initials}
            </button>

            {open ? (
              <>
                {/* click outside backdrop */}
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                />

                <div
                  className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                  role="menu"
                >
                  <div className="px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {fullName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {user?.email || ""}
                    </p>
                  </div>
                  <div className="border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#ff5a36] transition hover:bg-[#fff7f3]"
                    role="menuitem"
                  >
                    Log Out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="mx-auto w-full max-w-6xl px-4 py-3 md:hidden">
        {/* Top bar (like screenshot): brand + icons */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-lg font-extrabold tracking-tight text-[#ff5a36]">
              Hunger Food
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="rounded-full p-2 text-slate-700 transition hover:bg-slate-50"
              aria-label="Search"
              aria-expanded={mobileSearchOpen}
            >
              <HiOutlineSearch className="text-2xl" />
            </button>

            <button
              type="button"
              className="relative rounded-full p-2 text-slate-700 transition hover:bg-slate-50"
              aria-label="Cart"
            >
              <HiOutlineShoppingCart className="text-2xl" />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#ff5a36] text-[10px] font-bold text-white">
                0
              </span>
            </button>

            <button
              ref={btnRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#ff5a36] text-sm font-bold text-white shadow-sm"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Profile menu"
            >
              {initials}
            </button>
          </div>
        </div>

        {/* Expandable search panel */}
        {mobileSearchOpen ? (
          <div className="mt-3">
            <div className="relative">
              <HiOutlineSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
              <input
                type="text"
                placeholder="search delicious food..."
                className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-32 text-sm text-slate-700 outline-none shadow-[0_10px_25px_rgba(15,23,42,0.10)] transition focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/10"
              />
              <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] font-medium text-slate-500">
                <span>|</span>
                <HiOutlineLocationMarker className="text-[13px] text-[#ff5a36]" />
                <span className="max-w-[88px] truncate">{location}</span>
              </div>
            </div>
          </div>
        ) : null}

        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            />

            <div
              className="absolute right-4 top-14 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
              role="menu"
            >
              <div className="px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {fullName}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {user?.email || ""}
                </p>
              </div>
              <div className="border-t border-slate-100" />
              <button
                type="button"
                onClick={onLogout}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#ff5a36] transition hover:bg-[#fff7f3]"
                role="menuitem"
              >
                Log Out
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default DashboardNavbar;
