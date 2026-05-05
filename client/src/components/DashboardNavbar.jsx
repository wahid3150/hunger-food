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
    <div className={`navbar-search-wrap ${className}`}>
      <HiOutlineSearch className="navbar-search-icon" />
      <input
        id="global-search"
        type="text"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder="Search shops, dishes, categories…"
        aria-label="Search food"
        autoComplete="off"
        className="navbar-search-input"
      />
      {effectiveSearch && (
        <button
          type="button"
          onClick={() => setLocalSearch("")}
          className="navbar-search-clear"
          aria-label="Clear search"
        >
          <HiX className="text-sm" />
        </button>
      )}
    </div>
  );

  return (
    <header className="navbar-root" style={{ height: "var(--navbar-h)" }}>
      {/* ── Desktop ── */}
      <div className="mx-auto hidden h-full w-full max-w-7xl items-center gap-5 px-6 md:flex">

        {/* Logo */}
        <button
          type="button"
          onClick={() => { onHomeClick?.(); navigate("/"); }}
          className="navbar-logo-btn"
          aria-label="Home"
        >
          <div className="navbar-logo-icon">
            <span className="text-base">🍽️</span>
          </div>
          <span className="navbar-logo-text">
            Hunger<span className="navbar-logo-accent">Food</span>
          </span>
        </button>

        {/* Location */}
        {showLocation && (
          <div className="navbar-location-pill">
            <HiOutlineLocationMarker className="navbar-location-icon" />
            <select
              value={location}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="navbar-location-select"
              aria-label="Delivery location"
            >
              {locationOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <HiOutlineChevronDown className="navbar-location-chevron" />
          </div>
        )}

        {/* Search */}
        {showSearch && renderSearchBar("flex-1 max-w-2xl")}

        {/* Right actions */}
        <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
          <NotificationBell />

          {showCart && (
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="navbar-icon-btn"
              aria-label={`Cart (${cartCount} items)`}
            >
              <HiOutlineShoppingCart className="text-xl" />
              {cartCount > 0 && (
                <span className="navbar-badge animate-cartBounce">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          )}

          {showOrdersButton && (
            <button
              type="button"
              onClick={() => onOrdersClick ? onOrdersClick() : navigate("/?orders=open")}
              className="navbar-orders-btn"
              aria-label="My orders"
            >
              <HiOutlineClipboardList className="text-base" />
              <span>Orders</span>
              {activeOrderCount > 0 && (
                <span className="navbar-orders-badge animate-pulseSoft">
                  {activeOrderCount}
                </span>
              )}
            </button>
          )}

          {/* Profile */}
          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="navbar-profile-btn"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label="Profile menu"
            >
              <span className="navbar-avatar">{initials}</span>
              <HiOutlineChevronDown
                className={`navbar-profile-chevron ${profileOpen ? "rotate-180" : ""}`}
              />
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
                  className="navbar-dropdown animate-fadeIn"
                  role="menu"
                >
                  {/* Profile header */}
                  <div className="navbar-dropdown-header">
                    <div className="navbar-dropdown-avatar">{initials}</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{fullName}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email || ""}</p>
                    </div>
                  </div>
                  <p className="px-4 pb-3 text-xs font-medium text-slate-400 italic">
                    {getGreeting()}, {firstName}! 👋
                  </p>

                  <div className="navbar-dropdown-divider" />

                  <div className="py-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        onOrdersClick ? onOrdersClick() : navigate("/?orders=open");
                      }}
                      className="navbar-dropdown-item"
                      role="menuitem"
                    >
                      <span className="navbar-dropdown-item-icon">
                        <HiOutlineClipboardList className="text-base" />
                      </span>
                      My Orders
                    </button>
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); navigate("/cart"); }}
                      className="navbar-dropdown-item"
                      role="menuitem"
                    >
                      <span className="navbar-dropdown-item-icon">
                        <HiOutlineShoppingCart className="text-base" />
                      </span>
                      My Cart
                      {cartCount > 0 && (
                        <span className="ml-auto rounded-full bg-[#ff5a36] px-2 py-0.5 text-xs font-bold text-white">
                          {cartCount}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="navbar-dropdown-divider" />

                  <div className="py-1.5">
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); onLogout(); }}
                      className="navbar-dropdown-item navbar-dropdown-item--danger"
                      role="menuitem"
                    >
                      <span className="navbar-dropdown-item-icon">
                        <HiOutlineLogout className="text-base" />
                      </span>
                      Log Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="flex h-full flex-col justify-center md:hidden">
        <div className="flex items-center justify-between gap-2 px-4">
          <button
            type="button"
            onClick={() => { onHomeClick?.(); navigate("/"); }}
            className="flex flex-shrink-0 items-center gap-2 transition"
            aria-label="Home"
          >
            <div className="grid h-8 w-8 place-items-center rounded-xl gradient-primary text-white shadow-md">
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
                className="navbar-icon-btn"
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
                className="navbar-icon-btn"
                aria-label={`Cart (${cartCount})`}
              >
                <HiOutlineShoppingCart className="text-xl" />
                {cartCount > 0 && (
                  <span className="navbar-badge">
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
