import React, { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { clearUser } from "../../redux/userSlice";
import {
  HiOutlineLocationMarker,
  HiOutlineSearch,
  HiOutlineShoppingCart,
  HiOutlineClipboardList,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineChevronDown,
  HiX,
} from "react-icons/hi";
import useGetCity from "../hooks/useGetCity";
import NotificationBell from "./NotificationBell";
import { serverUrl } from "../App";

const getInitials = (name) => {
  const safe = String(name || "").trim();
  if (!safe) return "U";
  const parts = safe.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (first + last).toUpperCase() || "U";
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const DashboardNavbar = ({
  showSearch = false,
  showCart = false,
  showLocation = false,
  showOrdersButton = false,
  onOrdersClick,
  onHomeClick,
  activeOrderCount = 0,
  searchValue = "",
  onSearchChange,
  cartItems: cartItemsProp,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userData);
  const cartItems = useSelector((state) => state.cart.items);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const { city } = useGetCity();


  const fullName = user?.fullName || "Account";
  const firstName = fullName.split(" ")[0];
  const initials = useMemo(() => getInitials(fullName), [fullName]);

  const cartCount = useMemo(
    () => cartItems.reduce((c, item) => c + Number(item.quantity || 0), 0),
    [cartItems],
  );

  const [localSearch, setLocalSearch] = useState(searchValue);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange) onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const effectiveSearch = localSearch;

  const location = selectedLocation || city || "Peshawar";
  const locationOptions = useMemo(() => {
    return [...new Set([location, city].filter(Boolean))];
  }, [city, location]);




  const onLogout = async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed:", err?.response?.data || err?.message);
    } finally {
      dispatch(clearUser());
    }
  };

  const renderSearchBar = (className = "") => (
    <div className={`relative ${className}`}>
      <HiOutlineSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
      <input
        id="global-search"
        type="text"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder="Search shops, dishes, categories…"
        aria-label="Search food"
        autoComplete="off"
        className="w-full rounded-full border-2 border-slate-200/80 bg-white/90 py-2.5 pl-12 pr-5 text-sm text-slate-700 shadow-sm transition
          placeholder:text-slate-400
          focus:border-[#ff5a36] focus:ring-4 focus:ring-[#ff5a36]/10 focus:outline-none focus-visible:outline-none
          hover:border-slate-300"
      />
      {effectiveSearch && (
        <button
          type="button"
          onClick={() => setLocalSearch("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label="Clear search"
        >
          <HiX className="text-sm" />
        </button>
      )}
    </div>
  );

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-slate-200/60 glass shadow-sm"
      style={{ height: "var(--navbar-h)" }}
    >
      <div className="mx-auto hidden h-full w-full max-w-7xl items-center gap-4 px-6 md:flex">

        <button
          type="button"
          onClick={() => { onHomeClick?.(); navigate("/"); }}
          className="group flex flex-shrink-0 items-center gap-2.5 transition hover:scale-[1.03]"
          aria-label="Home"
        >
          <div className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-white shadow-md group-hover:shadow-lg transition">
            <span className="text-base">🍽️</span>
          </div>
          <span className="text-base font-black tracking-tight text-slate-900">
            Hunger<span className="text-[#ff5a36]">Food</span>
          </span>
        </button>

        {showLocation && (
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm hover:border-[#ff5a36]/40 transition cursor-pointer">
            <HiOutlineLocationMarker className="text-[#ff5a36] text-base flex-shrink-0" />
            <select
              value={location}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="custom-select bg-transparent text-sm font-semibold text-slate-700 outline-none max-w-[120px] cursor-pointer"
              aria-label="Delivery location"
            >
              {locationOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <HiOutlineChevronDown className="text-slate-400 text-xs" />
          </div>
        )}

        {showSearch && renderSearchBar("flex-1 max-w-2xl")}


        <div className="ml-auto flex flex-shrink-0 items-center gap-1">
          <NotificationBell />

          {showCart && (
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="relative grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-[#ff5a36]"
              aria-label={`Cart (${cartCount} items)`}
            >
              <HiOutlineShoppingCart className="text-xl" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full gradient-primary text-[10px] font-black text-white shadow animate-cartBounce">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          )}

          {showOrdersButton && (
            <button
              type="button"
              onClick={() => onOrdersClick ? onOrdersClick() : navigate("/?orders=open")}
              className="relative flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#ff5a36]/50 hover:text-[#ff5a36] hover:bg-[#fff7f3]"
              aria-label="My orders"
            >
              <HiOutlineClipboardList className="text-base" />
              Orders
              {activeOrderCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow animate-pulseSoft">
                  {activeOrderCount}
                </span>
              )}
            </button>
          )}

          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border-2 border-transparent bg-gradient-to-r from-[#ff5a36] to-[#ff7c5c] px-1 py-1 text-white shadow-md transition hover:shadow-lg hover:scale-105"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label="Profile menu"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full text-sm font-black">
                {initials}
              </span>
            </button>

            {profileOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setProfileOpen(false)}
                  aria-label="Close profile menu"
                />
                <div
                  className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.14)] animate-fadeIn"
                  role="menu"
                >

                  <div className="border-b border-slate-100 bg-gradient-to-br from-[#fff8f6] to-white px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full gradient-primary text-sm font-black text-white shadow">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">{fullName}</p>
                        <p className="truncate text-xs text-slate-500">{user?.email || ""}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-400 italic">
                      {getGreeting()}, {firstName}! 👋
                    </p>
                  </div>


                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        onOrdersClick ? onOrdersClick() : navigate("/?orders=open");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#ff5a36]"
                      role="menuitem"
                    >
                      <HiOutlineClipboardList className="text-base text-slate-400" />
                      My Orders
                    </button>
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); navigate("/cart"); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#ff5a36]"
                      role="menuitem"
                    >
                      <HiOutlineShoppingCart className="text-base text-slate-400" />
                      My Cart
                      {cartCount > 0 && (
                        <span className="ml-auto rounded-full bg-[#ff5a36] px-2 py-0.5 text-xs font-black text-white">
                          {cartCount}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="border-t border-slate-100 py-1">
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); onLogout(); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                      role="menuitem"
                    >
                      <HiOutlineLogout className="text-base" />
                      Log Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>


      <div className="flex h-full flex-col justify-center md:hidden">

        <div className="flex items-center justify-between gap-2 px-4">

          <button
            type="button"
            onClick={() => { onHomeClick?.(); navigate("/"); }}
            className="flex flex-shrink-0 items-center gap-2 transition"
            aria-label="Home"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full gradient-primary text-white shadow-md">
              <span className="text-sm">🍽️</span>
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900">
              Hunger<span className="text-[#ff5a36]">Food</span>
            </span>
          </button>

          <div className="flex items-center gap-0.5">
            <NotificationBell />
            {showSearch && (
              <button
                type="button"
                onClick={() => setMobileSearchOpen((v) => !v)}
                className="grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-[#ff5a36]"
                aria-label="Toggle search"
                aria-expanded={mobileSearchOpen}
              >
                {mobileSearchOpen ? <HiX className="text-xl" /> : <HiOutlineSearch className="text-xl" />}
              </button>
            )}
            {showCart && (
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="relative grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-[#ff5a36]"
                aria-label={`Cart (${cartCount})`}
              >
                <HiOutlineShoppingCart className="text-xl" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full gradient-primary text-[10px] font-black text-white shadow">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-sm font-black text-white shadow-md transition hover:shadow-lg"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Profile"
              >
                {initials}
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setProfileOpen(false)}
                    aria-label="Close menu"
                  />
                  <div
                    className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.14)] animate-fadeIn"
                    role="menu"
                  >
                    <div className="border-b border-slate-100 bg-gradient-to-br from-[#fff8f6] to-white px-4 py-3">
                      <p className="truncate text-sm font-black text-slate-900">{fullName}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email || ""}</p>
                    </div>
                    {showOrdersButton && (
                      <button
                        type="button"
                        onClick={() => { setProfileOpen(false); onOrdersClick?.(); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#ff5a36] transition"
                        role="menuitem"
                      >
                        <HiOutlineClipboardList className="text-base text-slate-400" />
                        My Orders
                      </button>
                    )}
                    <div className="border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => { setProfileOpen(false); onLogout(); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition"
                        role="menuitem"
                      >
                        <HiOutlineLogout className="text-base" />
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {showSearch && mobileSearchOpen && (
          <div className="px-4 pb-2 pt-1 animate-slideIn">
            {renderSearchBar("w-full")}
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardNavbar;
