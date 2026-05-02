import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import socket from "../lib/socket";
import { HiOutlineBell, HiCheckCircle } from "react-icons/hi";

const MAX_ITEMS = 25;

// Which socket events each role should receive as notifications
const ROLE_EVENTS = {
  user: [
    { name: "delivery_boy_assigned", icon: "🛵", title: "Rider Assigned", color: "text-blue-600" },
    { name: "order-delivered",        icon: "🎉", title: "Order Delivered", color: "text-emerald-600" },
    { name: "order_status_updated",   icon: "📦", title: "Order Updated",   color: "text-amber-600" },
  ],
  owner: [
    { name: "new_order",             icon: "🛍️", title: "New Order!",     color: "text-[#ff5a36]" },
    { name: "order_status_updated",  icon: "📦", title: "Order Updated",   color: "text-amber-600" },
    { name: "delivery_boy_assigned", icon: "🛵", title: "Rider Assigned",  color: "text-blue-600" },
    { name: "order-delivered",       icon: "🎉", title: "Order Delivered", color: "text-emerald-600" },
  ],
  deliveryBoy: [
    { name: "order_status_updated", icon: "📦", title: "Order Updated", color: "text-amber-600" },
  ],
};

const getMessage = (eventName, data) => {
  if (data?.message) return data.message;
  if (eventName === "order-delivered") return "Your order has been delivered!";
  if (data?.status) return `Status changed to: ${String(data.status).replaceAll("_", " ")}`;
  return "You have a new update.";
};

const NotificationBell = () => {
  const user = useSelector((state) => state.user.userData);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  const addNotification = useCallback((meta, data) => {
    const notification = {
      id: `${meta.name}-${Date.now()}-${Math.random()}`,
      icon: meta.icon,
      title: meta.title,
      color: meta.color,
      message: getMessage(meta.name, data),
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [notification, ...prev].slice(0, MAX_ITEMS));
    setUnread((prev) => prev + 1);
  }, []);

  // Register socket listeners based on role
  useEffect(() => {
    const role = user?.role;
    if (!role) return;
    const events = ROLE_EVENTS[role] || [];
    const handlers = {};
    events.forEach((meta) => {
      handlers[meta.name] = (data) => addNotification(meta, data);
      socket.on(meta.name, handlers[meta.name]);
    });
    return () => {
      events.forEach((meta) => socket.off(meta.name, handlers[meta.name]));
    };
  }, [user?.role, addNotification]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    setOpen((v) => !v);
    if (!open) {
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    setNotifications([]);
    setUnread(0);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        id="notification-bell"
        onClick={handleToggle}
        className="relative rounded-full p-2.5 text-slate-700 transition hover:bg-slate-100 hover:text-[#ff5a36]"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <HiOutlineBell className="text-2xl" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-r from-[#ff5a36] to-[#ff4420] text-[10px] font-black text-white shadow-lg animate-bounce">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          role="dialog"
          aria-label="Notification panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
            <div className="flex items-center gap-2">
              <HiOutlineBell className="text-[#ff5a36]" />
              <p className="text-sm font-extrabold text-slate-800">Notifications</p>
              {notifications.length > 0 && (
                <span className="rounded-full bg-[#fff0eb] px-2 py-0.5 text-[10px] font-bold text-[#ff5a36]">
                  {notifications.length}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-slate-400 transition hover:text-red-500"
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[340px] overflow-y-auto [scrollbar-width:thin]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <HiCheckCircle className="text-4xl text-slate-200" />
                <p className="text-sm font-bold text-slate-400">All caught up!</p>
                <p className="text-xs text-slate-300">Real-time updates will appear here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 border-b border-slate-50 px-4 py-3 transition hover:bg-slate-50 ${
                    n.read ? "" : "bg-[#fff8f5]"
                  }`}
                >
                  <span className="mt-0.5 text-xl leading-none">{n.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-extrabold ${n.color}`}>{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-600">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {n.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#ff5a36]" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer live indicator */}
          <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50 px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-semibold text-slate-400">Live updates active</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
