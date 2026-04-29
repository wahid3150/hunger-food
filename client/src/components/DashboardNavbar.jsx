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

const DashboardNavbar = ({
  searchValue = "",
  onSearchChange,
  onOrdersClick,
  showCart = true,
  showOrdersButton = true,
  showSearch = true,
  showLocation = true,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userData);
  const cartItems = useSelector((state) => state.cart.items);
  const [open, setOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const btnRef = useRef(null);
  const { city } = useGetCity();

  const fullName = user?.fullName || "Account";
  const initials = useMemo(() => getInitials(fullName), [fullName]);
  const cartCount = useMemo(
    () =>
      cartItems.reduce((count, item) => count + Number(item.quantity || 0), 0),
    [cartItems],
  );
  const effectiveSearchValue = onSearchChange ? searchValue : localSearch;

  const handleSearchChange = (value) => {
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }
    setLocalSearch(value);
  };

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
      console.error(
        "Logout API failed:",
        error?.response?.data || error?.message,
      );
    } finally {
      dispatch(clearUser());
      navigate("/signin", { replace: true });
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-gradient-to-r from-white to-slate-50/50 backdrop-blur-sm shadow-sm">
      {/* Desktop */}
      <div className="mx-auto hidden w-full max-w-7xl items-center gap-5 px-4 py-3 md:flex">
        {/* Brand - Home Link */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="group flex items-center gap-2 transition hover:scale-105"
          aria-label="Home"
        >
          <div className="rounded-full bg-gradient-to-r from-[#ff5a36] to-[#ff4420] p-2.5 text-white shadow-md group-hover:shadow-lg transition">
            <span className="text-lg font-black">🍽️</span>
          </div>
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            Hunger Food
          </span>
        </button>

          {showLocation ? (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-5">
              <HiOutlineLocationMarker className="text-lg text-[#ff5a36]" />
              <select
                value={location}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="cursor-pointer bg-transparent text-sm font-semibold text-slate-700 outline-none transition hover:text-slate-900"
                aria-label="Location"
              >
                {locationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

        {showSearch ? (
          <div className="flex flex-1 justify-center">
            <div className="relative w-full max-w-2xl">
              <HiOutlineSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
              <input
                type="text"
                value={effectiveSearchValue}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search delicious food..."
                className="w-full rounded-full border-2 border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 outline-none shadow-md transition focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/20 hover:border-slate-300"
              />
            </div>
          </div>
        ) : null}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {showCart ? (
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="relative rounded-full p-2.5 text-slate-700 transition hover:bg-slate-100 hover:text-[#ff5a36]"
              aria-label="Cart"
            >
              <HiOutlineShoppingCart className="text-2xl" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-r from-[#ff5a36] to-[#ff4420] text-xs font-black text-white shadow-lg">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          ) : null}

          {showOrdersButton ? (
            <button
              type="button"
              onClick={onOrdersClick}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-[#ff5a36]"
            >
              📦 Orders
            </button>
          ) : null}

          {/* Profile */}
          <div className="relative">
            <button
              ref={btnRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-[#ff5a36] to-[#ff4420] text-sm font-black text-white shadow-md hover:shadow-lg transition"
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
                  className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-xl"
                  role="menu"
                >
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-4">
                    <p className="truncate text-sm font-black text-slate-900">
                      {fullName}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {user?.email || ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-[#ff5a36] transition hover:bg-[#fff7f3]"
                    role="menuitem"
                  >
                    🚪 Log Out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="mx-auto w-full max-w-7xl px-4 py-3 md:hidden">
        {/* Top bar: brand + icons */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 transition hover:scale-105 min-w-0"
            aria-label="Home"
          >
            <div className="rounded-full bg-gradient-to-r from-[#ff5a36] to-[#ff4420] p-2 text-white shadow-md">
              <span className="text-base font-black">🍽️</span>
            </div>
            <span className="text-base font-black tracking-tight text-[#ff5a36] truncate">
              Hunger
            </span>
          </button>

          <div className="flex items-center gap-1">
            {showSearch ? (
              <button
                type="button"
                onClick={() => setMobileSearchOpen((v) => !v)}
                className="rounded-full p-2.5 text-slate-700 transition hover:bg-slate-100 hover:text-[#ff5a36]"
                aria-label="Search"
                aria-expanded={mobileSearchOpen}
              >
                <HiOutlineSearch className="text-2xl" />
              </button>
            ) : null}

            {showCart ? (
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="relative rounded-full p-2.5 text-slate-700 transition hover:bg-slate-100 hover:text-[#ff5a36]"
                aria-label="Cart"
              >
                <HiOutlineShoppingCart className="text-2xl" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-r from-[#ff5a36] to-[#ff4420] text-xs font-black text-white shadow-lg">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            ) : null}

            <button
              ref={btnRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-[#ff5a36] to-[#ff4420] text-sm font-black text-white shadow-md hover:shadow-lg transition"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Profile menu"
            >
              {initials}
            </button>
          </div>
        </div>

        {/* Expandable search panel */}
        {showSearch && mobileSearchOpen ? (
          <div className="mt-3">
            <div className="relative">
              <HiOutlineSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
              <input
                type="text"
                value={effectiveSearchValue}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search food..."
                className="w-full rounded-full border-2 border-slate-200 bg-white py-3 pl-12 pr-32 text-sm text-slate-700 outline-none shadow-md transition focus:border-[#ff5a36] focus:ring-2 focus:ring-[#ff5a36]/20"
              />
              {showLocation ? (
                <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-slate-500">
                  <span>|</span>
                  <HiOutlineLocationMarker className="text-sm text-[#ff5a36]" />
                  <span className="max-w-[88px] truncate">{location}</span>
                </div>
              ) : null}
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
              className="absolute right-4 top-14 z-50 w-56 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-xl"
              role="menu"
            >
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-4">
                <p className="truncate text-sm font-black text-slate-900">
                  {fullName}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {user?.email || ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full px-4 py-3 text-left text-sm font-bold text-[#ff5a36] transition hover:bg-[#fff7f3]"
                role="menuitem"
              >
                🚪 Log Out
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default DashboardNavbar;
