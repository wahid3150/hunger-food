import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineViewGrid,
  HiOutlineClipboardList,
  HiMenuAlt2,
  HiX,
  HiChevronDown,
} from "react-icons/hi";
import { clearUser } from "../../redux/userSlice";
import { serverUrl } from "../App";
import OverviewTab from "./owner/OverviewTab";
import ShopsTab from "./owner/ShopsTab";
import ItemsTab from "./owner/ItemsTab";
import OrdersTab from "./owner/OrdersTab";

/* ── helpers ────────────────────────────────────── */
const getInitials = (name) => {
  const safe = String(name || "").trim();
  if (!safe) return "U";
  const parts = safe.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : ""))
    .toUpperCase() || "U";
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: <HiOutlineHome className="text-lg" /> },
  { id: "shops", label: "My Shops", icon: <HiOutlineShoppingBag className="text-lg" /> },
  { id: "items", label: "Menu Items", icon: <HiOutlineViewGrid className="text-lg" /> },
  { id: "orders", label: "Orders", icon: <HiOutlineClipboardList className="text-lg" /> },
];

/* ── component ──────────────────────────────────── */
const OwnerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userData);

  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  // When the user clicks "Manage Items" from a specific shop card
  const [selectedShop, setSelectedShop] = useState(null);

  const profileRef = useRef(null);
  const fullName = user?.fullName || "Owner";
  const initials = useMemo(() => getInitials(fullName), [fullName]);

  /* fetch owner shops once (for sidebar count + ItemsTab shop selector) */
  const fetchShops = useCallback(async () => {
    setShopsLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/shop/my-shops`, {
        withCredentials: true,
      });
      setShops(res.data?.shops || []);
    } catch {
      setShops([]);
    } finally {
      setShopsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  /* close profile dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onLogout = async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true });
    } catch {
      setProfileOpen(false);
    }
    dispatch(clearUser());
    navigate("/signin", { replace: true });
  };

  const goToTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    if (tab !== "items") setSelectedShop(null);
  };

  const handleSelectShop = (shop) => {
    setSelectedShop(shop);
    setActiveTab("items");
    setSidebarOpen(false);
  };

  /* when shops tab saves a shop, refresh shop list */
  const handleShopsSaved = () => {
    fetchShops();
  };

  /* ── sidebar content ─── */
  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff5a36] text-white text-sm font-extrabold shadow">
          HF
        </div>
        <div>
          <p className="text-sm font-extrabold text-slate-800 tracking-tight">Hunger Food</p>
          <p className="text-[10px] text-slate-400 font-medium">Owner Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => goToTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#ff5a36] text-white shadow-sm shadow-[#ff5a36]/30"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className={isActive ? "text-white" : "text-slate-400"}>{item.icon}</span>
              {item.label}
              {item.id === "shops" && !shopsLoading && (
                <span
                  className={`ml-auto text-[10px] font-bold rounded-full px-2 py-0.5 ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {shops.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#ff5a36] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{fullName}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || ""}</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── render ── */
  return (
    <div className="flex h-screen bg-[#f8f9fb] overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col border-r border-slate-100 bg-white">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl md:hidden">
            <div className="flex items-center justify-end px-4 py-3 border-b border-slate-100">
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition"
              >
                <HiX className="text-lg" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 border-b border-slate-100 bg-white px-4 py-3 flex-shrink-0">
          {/* Mobile burger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition md:hidden"
          >
            <HiMenuAlt2 className="text-lg" />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-800 leading-none">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label || "Dashboard"}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeTab === "overview" && "Your business at a glance"}
              {activeTab === "shops" && "Create and manage your shops"}
              {activeTab === "items" && "Manage your menu items"}
              {activeTab === "orders" && "Prepare and manage customer orders"}
            </p>
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 pl-1 pr-3 py-1.5 hover:bg-slate-50 transition"
            >
              <div className="h-7 w-7 rounded-full bg-[#ff5a36] flex items-center justify-center text-white text-[11px] font-bold">
                {initials}
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:block max-w-[100px] truncate">
                {fullName}
              </span>
              <HiChevronDown
                className={`text-slate-400 text-sm transition-transform ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 truncate">{fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email || ""}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setProfileOpen(false); goToTab("overview"); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm font-semibold text-[#ff5a36] hover:bg-[#fff7f3] transition"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
          {activeTab === "overview" && (
            <OverviewTab
              shops={shops}
              onGoToShops={() => goToTab("shops")}
              onGoToItems={() => goToTab("items")}
            />
          )}
          {activeTab === "shops" && (
            <ShopsTab
              onSelectShop={handleSelectShop}
              onShopSaved={handleShopsSaved}
            />
          )}
          {activeTab === "items" && (
            <ItemsTab
              shops={shops}
              preSelectedShop={selectedShop}
              onBack={selectedShop ? () => { setSelectedShop(null); goToTab("shops"); } : null}
            />
          )}
          {activeTab === "orders" && <OrdersTab shops={shops} />}
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
