import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HiArrowLeft,
  HiCheckCircle,
  HiChevronDown,
  HiChevronRight,
  HiClock,
  HiFire,
  HiLocationMarker,
  HiMinus,
  HiOutlineClipboardList,
  HiOutlineRefresh,
  HiOutlineShoppingBag,
  HiPlus,
  HiShoppingCart,
  HiX,
} from "react-icons/hi";
import { addToCart } from "../../redux/cartSlice";
import { serverUrl } from "../App";
import DashboardNavbar from "./DashboardNavbar";
import socket from "../lib/socket";
import LiveTracking from "./user/LiveTracking";

const PAGE_LIMIT = 12;
const TOP_SHOP_ITEM_LIMIT = 50;

const CATEGORIES = [
  "snacks",
  "desserts",
  "pizza",
  "burger",
  "sandwich",
  "wrap",
  "salad",
  "pasta",
  "rice",
  "noodles",
  "chicken",
  "beef",
  "vegetable",
  "drink",
  "other",
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
];

const QUICK_CATEGORIES = [
  { label: "🍕 Pizza", value: "pizza" },
  { label: "🍔 Burger", value: "burger" },
  { label: "🌮 Snacks", value: "snacks" },
  { label: "🍜 Noodles", value: "noodles" },
  { label: "🍗 Chicken", value: "chicken" },
  { label: "🥗 Salad", value: "salad" },
  { label: "🍰 Desserts", value: "desserts" },
  { label: "🥤 Drinks", value: "drink" },
  { label: "🥪 Sandwich", value: "sandwich" },
  { label: "🍝 Pasta", value: "pasta" },
];

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "On the way",
  delivered: "Delivered",
};

const STEPPER_STEPS = [
  { key: "pending", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "On the way" },
  { key: "delivered", label: "Delivered" },
];

const FOOD_TYPE_LABELS = {
  veg: "Veg",
  "non-veg": "Non-Veg",
};

const formatPrice = (price) => `PKR ${Number(price || 0).toLocaleString()}`;

const titleCase = (value) =>
  String(value || "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeLocation = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/city|tehsil|district|division/g, "")
    .replace(/[^a-z0-9]/g, "");

const isSameLocation = (a, b) => {
  const first = normalizeLocation(a);
  const second = normalizeLocation(b);
  if (!first || !second) return false;
  return first.includes(second) || second.includes(first);
};

const UserDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = useSelector((state) => state.cart.items);
  const detectedCity = useSelector((state) => state.user.city);

  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [foodType, setFoodType] = useState("");
  const [sort, setSort] = useState("latest");
  const [quickCategory, setQuickCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedShopLoading, setSelectedShopLoading] = useState(false);
  const [allAvailableItems, setAllAvailableItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemLoading, setSelectedItemLoading] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [similarItems, setSimilarItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const lastItemQueryRef = useRef("");
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  const activeShopId = selectedShop?._id || "";
  const isHomeView = !selectedShop && !selectedItem;

  const cartCount = useMemo(
    () =>
      cartItems.reduce((count, item) => count + Number(item.quantity || 0), 0),
    [cartItems],
  );

  const selectedShopItems = selectedShop?.items || [];
  const hasLocation = Boolean(detectedCity);

  const shopMatchesLocation = useCallback(
    (shop) => isSameLocation(shop?.city, detectedCity),
    [detectedCity],
  );

  const itemMatchesLocation = useCallback(
    (item) =>
      isSameLocation(item?.shop?.city, detectedCity) ||
      isSameLocation(selectedShop?.city, detectedCity),
    [detectedCity, selectedShop?.city],
  );

  const itemCountsByShop = useMemo(() => {
    return allAvailableItems.reduce((counts, item) => {
      const shopId = item.shop?._id || item.shop;
      if (!shopId) return counts;
      counts[shopId] = (counts[shopId] || 0) + 1;
      return counts;
    }, {});
  }, [allAvailableItems]);

  const topShops = useMemo(() => {
    const rankedShops = shops
      .map((shop) => ({
        ...shop,
        availableItemCount: itemCountsByShop[shop._id] || 0,
        isNearby: shopMatchesLocation(shop),
      }))
      .sort((a, b) => {
        if (a.isNearby !== b.isNearby) return a.isNearby ? -1 : 1;
        return b.availableItemCount - a.availableItemCount;
      });

    return (
      hasLocation ? rankedShops.filter((shop) => shop.isNearby) : rankedShops
    ).slice(0, 10);
  }, [hasLocation, itemCountsByShop, shopMatchesLocation, shops]);

  const visibleItems = useMemo(() => {
    if (activeShopId) return items;
    const locationItems = hasLocation
      ? items.filter((item) => itemMatchesLocation(item))
      : items;

    return [...locationItems].sort((a, b) => {
      const aNearby = itemMatchesLocation(a);
      const bNearby = itemMatchesLocation(b);
      if (aNearby !== bNearby) return aNearby ? -1 : 1;
      return 0;
    });
  }, [activeShopId, hasLocation, itemMatchesLocation, items]);

  const itemQueryKey = useMemo(
    () => [activeShopId, search, category || quickCategory, foodType, sort].join("|"),
    [activeShopId, category, quickCategory, foodType, search, sort],
  );

  const fetchShops = useCallback(async () => {
    setShopsLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/shop/shops`, {
        params: {
          page: 1,
          limit: 50,
          ...(search ? { search } : {}),
        },
      });
      setShops(res.data?.shops || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load shops");
      setShops([]);
    } finally {
      setShopsLoading(false);
    }
  }, [search]);

  const fetchItems = useCallback(async () => {
    if (
      !activeShopId &&
      page !== 1 &&
      lastItemQueryRef.current !== itemQueryKey
    ) {
      setPage(1);
      return;
    }

    setItemsLoading(true);
    try {
      const params = {
        sort,
        ...(search ? { search } : {}),
        ...(category ? { category } : {}),
        ...(foodType ? { foodType } : {}),
      };

      if (activeShopId) {
        const endpoint = `${serverUrl}/api/item/shops/${activeShopId}/items`;
        const firstResponse = await axios.get(endpoint, {
          params: { ...params, page: 1, limit: TOP_SHOP_ITEM_LIMIT },
        });
        const firstItems = firstResponse.data?.items || [];
        const pageCount = Number(firstResponse.data?.totalPages || 1);

        if (pageCount <= 1) {
          setItems(firstItems);
          setTotalItems(
            Number(firstResponse.data?.totalItems || firstItems.length),
          );
          setTotalPages(1);
          return;
        }

        const remainingResponses = await Promise.all(
          Array.from({ length: pageCount - 1 }, (_, index) =>
            axios.get(endpoint, {
              params: {
                ...params,
                page: index + 2,
                limit: TOP_SHOP_ITEM_LIMIT,
              },
            }),
          ),
        );
        const allShopItems = [
          ...firstItems,
          ...remainingResponses.flatMap((res) => res.data?.items || []),
        ];
        setItems(allShopItems);
        setTotalItems(
          Number(firstResponse.data?.totalItems || allShopItems.length),
        );
        setTotalPages(1);
        return;
      }

      const res = await axios.get(`${serverUrl}/api/item/items`, {
        params: {
          ...params,
          page,
          limit: PAGE_LIMIT,
        },
      });

      const nextItems = res.data?.items || [];
      setItems((currentItems) => {
        if (page === 1 || lastItemQueryRef.current !== itemQueryKey) {
          return nextItems;
        }

        const existingIds = new Set(currentItems.map((item) => item._id));
        return [
          ...currentItems,
          ...nextItems.filter((item) => !existingIds.has(item._id)),
        ];
      });
      lastItemQueryRef.current = itemQueryKey;
      setTotalItems(Number(res.data?.totalItems || 0));
      setTotalPages(Number(res.data?.totalPages || 1));
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load menu items",
      );
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setItemsLoading(false);
    }
  }, [activeShopId, category, foodType, itemQueryKey, page, search, sort]);

  const fetchAllAvailableItems = useCallback(async () => {
    try {
      const firstResponse = await axios.get(`${serverUrl}/api/item/items`, {
        params: { page: 1, limit: TOP_SHOP_ITEM_LIMIT },
      });
      const firstItems = firstResponse.data?.items || [];
      const pageCount = Number(firstResponse.data?.totalPages || 1);

      if (pageCount <= 1) {
        setAllAvailableItems(firstItems);
        return;
      }

      const remainingResponses = await Promise.all(
        Array.from({ length: pageCount - 1 }, (_, index) =>
          axios.get(`${serverUrl}/api/item/items`, {
            params: { page: index + 2, limit: TOP_SHOP_ITEM_LIMIT },
          }),
        ),
      );
      setAllAvailableItems([
        ...firstItems,
        ...remainingResponses.flatMap((res) => res.data?.items || []),
      ]);
    } catch {
      setAllAvailableItems([]);
    }
  }, []);

  const fetchMyOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/orders/my-orders`, {
        withCredentials: true,
      });
      setOrders(res.data?.orders || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShops();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchShops]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  useEffect(() => {
    fetchAllAvailableItems();
  }, [fetchAllAvailableItems]);

  useEffect(() => {
    if (showOrders) fetchMyOrders();
  }, [fetchMyOrders, showOrders]);

  useEffect(() => {
    setItems([]);
    setPage(1);
  }, [itemQueryKey]);

  // ── Socket: real-time order status updates ──────────────────────────────
  useEffect(() => {
    const handleDeliveryAssigned = ({ orderId }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? { ...o, deliveryStatus: "assigned", status: "out_for_delivery" }
            : o,
        ),
      );
      // Auto-open the live map
      setTrackingOrderId(orderId);
      socket.emit("join-order", orderId);
      toast.success("🛵 Rider assigned! Live tracking is now active.");
    };

    const handleOrderDelivered = ({ orderId }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? { ...o, status: "delivered", deliveryStatus: "delivered" }
            : o,
        ),
      );
      setTrackingOrderId((prev) => (prev === orderId ? null : prev));
      toast.success("✅ Order delivered! Thank you for ordering.");
    };

    const handleStatusUpdated = ({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o)),
      );
    };

    socket.on("delivery_boy_assigned", handleDeliveryAssigned);
    socket.on("order-delivered", handleOrderDelivered);
    socket.on("order_status_updated", handleStatusUpdated);

    return () => {
      socket.off("delivery_boy_assigned", handleDeliveryAssigned);
      socket.off("order-delivered", handleOrderDelivered);
      socket.off("order_status_updated", handleStatusUpdated);
    };
  }, []);

  // Join / leave order room for live tracking
  useEffect(() => {
    if (!trackingOrderId) return;
    socket.emit("join-order", trackingOrderId);
    return () => {
      socket.emit("leave-order", trackingOrderId);
    };
  }, [trackingOrderId]);

  // Auto-refresh shops + items every 2 minutes (no socket push for these)
  useEffect(() => {
    const id = setInterval(() => {
      fetchShops();
      fetchAllAvailableItems();
    }, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchShops, fetchAllAvailableItems]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setQuickCategory("");
    setFoodType("");
    setSort("latest");
    setPage(1);
  };

  const cartItemIds = useMemo(
    () => new Set(cartItems.map((ci) => ci.itemId || ci._id)),
    [cartItems],
  );

  const openOrders = () => {
    setShowOrders(true);
    setSelectedShop(null);
    setSelectedItem(null);
  };

  const closeOrders = () => {
    setShowOrders(false);
  };

  useEffect(() => {
    if (new URLSearchParams(location.search).get("orders") === "open") {
      openOrders();
      navigate("/", { replace: true });
    }
  }, [location.search]);

  const openShop = async (shop) => {
    setSelectedShopLoading(true);
    setSelectedItem(null);
    setSuggestedItems([]);
    setSimilarItems([]);
    try {
      const res = await axios.get(`${serverUrl}/api/shop/shops/${shop._id}`);
      setSelectedShop({
        ...(res.data?.shop || shop),
        items: res.data?.items || [],
      });
      setPage(1);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to open shop");
    } finally {
      setSelectedShopLoading(false);
    }
  };

  const closeShop = () => {
    setSelectedShop(null);
    setSelectedItem(null);
    setSuggestedItems([]);
    setSimilarItems([]);
    setPage(1);
  };

  const openItemDetails = async (item) => {
    setSelectedItemLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/item/items/${item._id}`);
      const detailItem = res.data?.item || item;
      const shopId =
        detailItem.shop?._id ||
        item.shop?._id ||
        selectedShop?._id ||
        item.shop;

      setSelectedItem(detailItem);

      if (shopId) {
        if (!selectedShop || selectedShop._id !== shopId) {
          const shopResponse = await axios.get(
            `${serverUrl}/api/shop/shops/${shopId}`,
          );
          setSelectedShop({
            ...(shopResponse.data?.shop || detailItem.shop || {}),
            items: shopResponse.data?.items || [],
          });
        }

        const suggestionsResponse = await axios.get(
          `${serverUrl}/api/item/shops/${shopId}/items`,
          { params: { page: 1, limit: 8, sort: "latest" } },
        );
        setSuggestedItems(
          (suggestionsResponse.data?.items || []).filter(
            (suggested) => suggested._id !== detailItem._id,
          ),
        );
      } else {
        setSuggestedItems([]);
      }

      const sameCategoryItems = allAvailableItems
        .filter((candidate) => {
          const candidateShopId = candidate.shop?._id || candidate.shop;
          return (
            candidate._id !== detailItem._id &&
            candidate.category === detailItem.category &&
            candidateShopId !== shopId
          );
        })
        .sort((a, b) => {
          const aNearby = itemMatchesLocation(a);
          const bNearby = itemMatchesLocation(b);
          if (aNearby !== bNearby) return aNearby ? -1 : 1;
          return Number(b.price || 0) - Number(a.price || 0);
        })
        .slice(0, 8);
      setSimilarItems(sameCategoryItems);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load item details",
      );
    } finally {
      setSelectedItemLoading(false);
    }
  };

  const closeItemDetails = () => {
    setSelectedItem(null);
    setSuggestedItems([]);
    setSimilarItems([]);
  };

  const updateQuantity = (itemId, delta) => {
    setQuantities((current) => {
      const next = Math.max(1, Number(current[itemId] || 1) + delta);
      return { ...current, [itemId]: next };
    });
  };

  const addMenuItemToCart = (item) => {
    const quantity = Number(quantities[item._id] || 1);
    dispatch(
      addToCart({
        ...item,
        itemId: item._id,
        quantity,
        shopId: item.shop?._id || selectedShop?._id || item.shop,
        shopName: item.shop?.name || selectedShop?.name,
      }),
    );
    toast.success(`${titleCase(item.name)} added to cart`);
  };

  const getStepIndex = (status) =>
    STEPPER_STEPS.findIndex((s) => s.key === status);

  const renderMenuCard = (item) => {
    const quantity = Number(quantities[item._id] || 1);
    const inCart = cartItemIds.has(item._id);
    return (
      <article
        key={item._id}
        onClick={() => openItemDetails(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && openItemDetails(item)}
        className="menu-card group"
      >
        <div className="relative h-48 w-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {item.image ? (
            <img src={item.image} alt={item.name} loading="lazy" decoding="async"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
          ) : (
            <div className="grid h-full place-items-center text-slate-300">
              <HiOutlineShoppingBag className="text-5xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
          {inCart ? (
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black text-white shadow-md">
              <HiCheckCircle /> In cart
            </span>
          ) : (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black text-slate-700 shadow border border-white/60">
              {titleCase(item.category)}
            </span>
          )}
          <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-black border ${item.foodType === "veg" ? "bg-emerald-500 text-white border-emerald-600" : "bg-orange-500 text-white border-orange-600"}`}>
            {FOOD_TYPE_LABELS[item.foodType] || "Food"}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="truncate text-sm font-black capitalize text-slate-900 group-hover:text-[#ff5a36] transition">{item.name}</h3>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-400">{item.shop?.name || selectedShop?.name || "Nearby shop"}</p>

          <div className="mt-auto pt-3 flex items-center justify-between gap-2">
            <p className="text-base font-black text-[#ff5a36]">{formatPrice(item.price)}</p>
            <div className="flex items-center rounded-full border-2 border-slate-100 bg-slate-50" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => updateQuantity(item._id, -1)}
                className="grid h-7 w-7 place-items-center text-slate-400 hover:text-[#ff5a36] rounded-l-full transition text-xs"
                aria-label={`Decrease ${item.name}`}><HiMinus /></button>
              <span className="w-6 text-center text-xs font-black text-slate-800">{quantity}</span>
              <button type="button" onClick={() => updateQuantity(item._id, 1)}
                className="grid h-7 w-7 place-items-center text-slate-400 hover:text-[#ff5a36] rounded-r-full transition text-xs"
                aria-label={`Increase ${item.name}`}><HiPlus /></button>
            </div>
          </div>

          <button type="button"
            onClick={(e) => { e.stopPropagation(); addMenuItemToCart(item); }}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff5a36] to-[#ff7848] text-xs font-extrabold text-white shadow transition hover:shadow-md hover:from-[#e04e2d] duration-200">
            <HiShoppingCart /> Add to cart
          </button>
        </div>
      </article>
    );
  };

  const renderShopSkeletons = () =>
    Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="h-[280px] min-w-[260px] flex-none rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="skeleton h-44 rounded-xl" />
        <div className="mt-3 skeleton h-4 w-3/4 rounded-lg" />
        <div className="mt-2 skeleton h-3 w-1/2 rounded-lg" />
      </div>
    ));

  const renderItemSkeletons = () =>
    Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="skeleton h-44 rounded-xl" />
        <div className="mt-4 skeleton h-4 w-3/4 rounded-lg" />
        <div className="mt-2 skeleton h-3 w-1/2 rounded-lg" />
        <div className="mt-4 skeleton h-9 rounded-xl" />
      </div>
    ));

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <DashboardNavbar
        showSearch
        showCart
        showLocation
        showOrdersButton
        searchValue={search}
        onSearchChange={setSearch}
        onOrdersClick={openOrders}
        onHomeClick={closeOrders}
        activeOrderCount={orders.filter((o) => o.status !== "delivered").length}
      />

      {!showOrders && isHomeView && (
        <div className="dash-hero animate-fadeInUp">
          <div className="mx-auto max-w-7xl">
            <span className="dash-hero-tag">
              {new Date().getHours() < 12 ? "☀️ Good morning" : new Date().getHours() < 17 ? "🌤️ Good afternoon" : "🌙 Good evening"}
            </span>
            <h1 className="dash-hero-title">
              What are you <span className="text-[#ff5a36]">craving</span> today?
            </h1>
            <div className="mt-5 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              {QUICK_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => { setQuickCategory(q => q === cat.value ? "" : cat.value); setCategory(""); }}
                  className={`dash-cat-pill ${quickCategory === cat.value ? "dash-cat-pill--active" : ""}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        {showOrders && (
          <section className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_8px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="section-tag bg-[#fff0eb] text-[#ff5a36] border border-[#ff5a36]/20">
                  📋 Order History
                </span>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                  My Orders
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Track and manage your orders in real time.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
                <button type="button" onClick={closeOrders}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow transition hover:bg-[#ff5a36] hover:shadow-md">
                  <HiArrowLeft /> Back to food
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4" aria-busy={ordersLoading}>
              {ordersLoading ? (
                [1, 2, 3].map((n) => <div key={n} className="skeleton h-36 rounded-2xl" />)
              ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-14 text-center animate-fadeInUp">
                  <div className="text-5xl">📋</div>
                  <p className="mt-3 text-lg font-black text-slate-800">No orders yet</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">Your placed orders will appear here.</p>
                  <button type="button" onClick={closeOrders}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5a36] to-[#ff6a46] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:shadow-lg hover:from-[#e04e2d]">
                    <HiOutlineShoppingBag className="text-base" /> Browse food
                  </button>
                </div>
              ) : (
                orders.map((order) => {
                  const stepIdx = getStepIndex(order.status || "pending");
                  const st = order.status || "pending";
                  return (
                    <article key={order._id} className="order-card animate-fadeInUp">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-2 ring-[#ff5a36]/10">
                            {order.shop?.image ? (
                              <img src={order.shop.image} alt={order.shop?.name} loading="lazy" className="h-full w-full object-cover" />
                            ) : <div className="grid h-full place-items-center text-slate-300"><HiOutlineShoppingBag /></div>}
                          </div>
                          <div>
                            <h2 className="text-sm font-black text-slate-900">{order.shop?.name || "Shop order"}</h2>
                            <p className="mt-0.5 text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                            <span className={`status-badge status-badge--${st} mt-1.5`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {STATUS_LABELS[st] || st}
                            </span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</p>
                          <p className="text-xl font-black text-slate-900">PKR {Number(order.totalAmount || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-4 overflow-x-auto">
                        <div className="relative flex min-w-[480px] items-center justify-between px-2">
                          <div className="stepper-line">
                            <div className="stepper-line-fill" style={{ width: `${(stepIdx / (STEPPER_STEPS.length - 1)) * 100}%` }} />
                          </div>
                          {STEPPER_STEPS.map((step, i) => {
                            const done = i <= stepIdx;
                            const active = i === stepIdx;
                            return (
                              <div key={step.key} className="relative z-10 flex flex-col items-center gap-1">
                                <div className={`grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-extrabold transition ${done
                                  ? "border-[#ff5a36] bg-[#ff5a36] text-white" + (active ? " stepper-node-active" : "")
                                  : "border-slate-300 bg-white text-slate-400"
                                  }`}>
                                  {done && !active ? <HiCheckCircle className="text-sm" /> : i + 1}
                                </div>
                                <p className={`text-[10px] font-bold ${done ? "text-[#ff5a36]" : "text-slate-400"
                                  }`}>{step.label}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-[1fr_260px]">
                        <div className="space-y-1.5">
                          {(order.items || []).map((item) => (
                            <div key={`${order._id}-${item.item}`}
                              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                              <span className="font-bold capitalize text-slate-700">{item.name}</span>
                              <span className="font-semibold text-slate-500">
                                {item.quantity} × PKR {Number(item.price || 0).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs font-bold text-slate-400">Delivery address</p>
                          <p className="mt-1 text-sm font-semibold text-slate-600">{order.deliveryAddress?.text || "No address saved"}</p>
                        </div>
                      </div>

                      {order.deliveryStatus === "assigned" && order.status !== "delivered" && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          {trackingOrderId === order._id ? (
                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#ff5a36]">
                                  <span className="h-2 w-2 rounded-full bg-[#ff5a36] animate-pulse" /> Live tracking
                                </p>
                                <button type="button" onClick={() => setTrackingOrderId(null)}
                                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition">
                                  Close map
                                </button>
                              </div>
                              <div className="h-64 overflow-hidden rounded-xl border border-slate-200">
                                <LiveTracking orderId={order._id}
                                  destLat={order.deliveryAddress?.latitude}
                                  destLng={order.deliveryAddress?.longitude} />
                              </div>
                            </div>
                          ) : (
                            <button type="button"
                              onClick={() => { setTrackingOrderId(order._id); socket.emit("join-order", order._id); }}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5a36] to-[#ff6a46] px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:shadow-lg hover:from-[#e04e2d]">
                              <HiLocationMarker /> 🛵 Track live delivery
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        )}

        {!showOrders && isHomeView && (
          <section className="mt-6 animate-fadeInUp">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0eb] px-3 py-1.5 text-xs font-extrabold text-[#ff5a36] border border-[#ff5a36]/20">
                  <HiFire className="text-sm" />
                  {hasLocation ? `Near ${detectedCity}` : "Featured shops"}
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">🏪 Featured Shops</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Top shops ranked by menu variety and proximity</p>
              </div>
              <div className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </div>
            </div>

            <div className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
              {shopsLoading
                ? renderShopSkeletons()
                : topShops.map((shop, index) => (
                  <button
                    key={shop._id}
                    type="button"
                    onClick={() => openShop(shop)}
                    className={`shop-card group h-[270px] sm:w-[290px] ${activeShopId === shop._id ? "shop-card--active" : ""}`}
                  >
                    <div className="relative h-44 w-full flex-shrink-0 overflow-hidden bg-slate-100">
                      {shop.image ? (
                        <img src={shop.image} alt={shop.name} loading="lazy" decoding="async"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">
                          <HiOutlineShoppingBag className="text-4xl" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-black/70 backdrop-blur px-2.5 py-1 text-xs font-extrabold text-white">
                        #{index + 1}
                      </span>
                      {shop.isNearby && (
                        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-extrabold text-white shadow">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" /> Nearby
                        </span>
                      )}
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-xs font-extrabold text-[#ff5a36]">
                        <HiOutlineShoppingBag className="text-xs" /> {shop.availableItemCount} items
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <h3 className="truncate text-sm font-black text-slate-900">{shop.name}</h3>
                      <p className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-slate-500">
                        <HiLocationMarker className="text-[#ff5a36] flex-shrink-0" />
                        {shop.city}{shop.state ? `, ${shop.state}` : ""}
                      </p>
                      <p className="mt-auto flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-[#ff5a36] transition">
                        <HiClock className="text-xs" /> View menu →
                      </p>
                    </div>
                  </button>
                ))}
            </div>

            {!shopsLoading && topShops.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-center">
                <HiOutlineShoppingBag className="mx-auto text-4xl text-slate-300" />
                <p className="mt-3 font-extrabold text-slate-800">
                  {hasLocation ? "No nearby shops found" : "No shops found"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {hasLocation ? "We couldn't match shops to your detected city yet." : "Allow location access or try a different search."}
                </p>
              </div>
            )}
          </section>
        )}

        {!showOrders && selectedShop && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-[#ff5a36]/20 bg-gradient-to-br from-white via-slate-50/30 to-white shadow-[0_20px_60px_rgba(255,90,54,0.08)]">
            <div className="flex flex-col md:flex-row md:items-stretch">
              <div className="h-48 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 md:h-auto md:w-64 relative group">
                {selectedShop.image ? (
                  <img
                    src={selectedShop.image}
                    alt={selectedShop.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff5a36]/10 to-orange-100/50 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[#ff5a36] border border-[#ff5a36]/20">
                    ✓ Currently selected
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                    {selectedShop.name}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-500">
                    📍 {selectedShop.address}, {selectedShop.city}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff5a36]/10 to-orange-100/50 px-3.5 py-1.5 text-xs font-extrabold text-[#ff5a36] border border-[#ff5a36]/20">
                      <HiOutlineShoppingBag className="text-sm" />
                      {selectedShopItems.length} items
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-extrabold text-slate-600 border border-slate-200">
                      <HiLocationMarker className="text-sm" />
                      {selectedShop.city}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeShop}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-[#ff5a36] hover:bg-[#fff7f3] hover:text-[#ff5a36] hover:shadow-md"
                >
                  <HiX />
                  Show all shops
                </button>
              </div>
            </div>
          </section>
        )}

        {!showOrders && selectedItemLoading && !selectedItem && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
            <div className="animate-spin mx-auto h-8 w-8 rounded-full border-4 border-slate-200 border-t-[#ff5a36]" />
            <p className="mt-3 text-sm font-bold text-slate-600">Loading item details…</p>
          </section>
        )}

        {!showOrders && selectedItem && (
          <section className="mt-6 animate-fadeInUp">
            {/* Breadcrumb */}
            <nav className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <button type="button" onClick={closeItemDetails}
                className="hover:text-[#ff5a36] transition">Menu</button>
              {selectedShop && (
                <><HiChevronRight className="text-slate-400" />
                  <button type="button" onClick={closeItemDetails}
                    className="hover:text-[#ff5a36] transition">{selectedShop.name}</button></>
              )}
              <HiChevronRight className="text-slate-400" />
              <span className="truncate text-slate-800 font-bold capitalize">{selectedItem.name}</span>
            </nav>

            <button type="button" onClick={closeItemDetails}
              className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm transition hover:border-[#ff5a36]/30 hover:bg-[#fff7f3] hover:text-[#ff5a36]">
              <HiArrowLeft className="text-base" /> Back
            </button>

            <div className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] lg:grid-cols-[440px_1fr]">
              <div className="h-80 overflow-hidden rounded-2xl bg-slate-100 lg:h-[430px]">
                {selectedItem.image ? (
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-slate-300">
                    <HiOutlineShoppingBag className="text-6xl" />
                  </div>
                )}
              </div>

              <div className="flex flex-col p-1 lg:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex rounded-full bg-[#fff0eb] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#ff5a36]">
                      {titleCase(selectedItem.category)}
                    </p>
                    <h1 className="mt-4 text-3xl font-extrabold capitalize tracking-tight text-slate-950 sm:text-4xl">
                      {selectedItem.name}
                    </h1>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <HiOutlineShoppingBag className="text-[#ff5a36]" />
                      {selectedItem.shop?.name ||
                        selectedShop?.name ||
                        "Nearby shop"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${selectedItem.foodType === "veg"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-orange-50 text-orange-600"
                      }`}
                  >
                    {FOOD_TYPE_LABELS[selectedItem.foodType] || "Food"}
                  </span>
                </div>

                <p className="mt-6 text-3xl font-extrabold text-[#ff5a36]">
                  {formatPrice(selectedItem.price)}
                </p>

                {/* Info rows */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-base">🏷️</span>
                    <span className="font-semibold text-slate-400">Category</span>
                    <span className="font-extrabold text-slate-800">{titleCase(selectedItem.category)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-base">{selectedItem.foodType === "veg" ? "🌿" : "🍗"}</span>
                    <span className="font-semibold text-slate-400">Type</span>
                    <span className={`font-extrabold ${selectedItem.foodType === "veg" ? "text-emerald-600" : "text-orange-600"
                      }`}>{FOOD_TYPE_LABELS[selectedItem.foodType] || "Food"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-base">🏪</span>
                    <span className="font-semibold text-slate-400">Shop</span>
                    <span className="font-extrabold text-slate-800">{selectedItem.shop?.name || selectedShop?.name || "—"}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <p className="text-sm font-bold text-slate-500">Quantity</p>
                  <div className="flex items-center rounded-full border-2 border-slate-200 bg-white">
                    <button type="button"
                      onClick={() => updateQuantity(selectedItem._id, -1)}
                      className="grid h-9 w-9 place-items-center text-slate-400 hover:text-[#ff5a36] rounded-l-full transition"
                      aria-label="Decrease quantity">
                      <HiMinus className="text-sm" />
                    </button>
                    <span className="w-10 text-center text-sm font-black text-slate-800">
                      {quantities[selectedItem._id] || 1}
                    </span>
                    <button type="button"
                      onClick={() => updateQuantity(selectedItem._id, 1)}
                      className="grid h-9 w-9 place-items-center text-slate-400 hover:text-[#ff5a36] rounded-r-full transition"
                      aria-label="Increase quantity">
                      <HiPlus className="text-sm" />
                    </button>
                  </div>
                </div>

                <button type="button"
                  onClick={() => addMenuItemToCart(selectedItem)}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5a36] to-[#ff6a46] text-sm font-extrabold text-white shadow-md transition hover:shadow-lg hover:from-[#e04e2d] lg:mt-auto"
                >
                  <HiShoppingCart /> Add to cart
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950">
                    More from{" "}
                    {selectedItem.shop?.name ||
                      selectedShop?.name ||
                      "this shop"}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Other available items listed by this shop
                  </p>
                </div>
              </div>
              <div className="mt-4 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {suggestedItems.length > 0 ? (
                  suggestedItems.map((item) => renderMenuCard(item))
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white px-5 py-10 text-center text-sm font-bold text-slate-500 shadow-sm sm:col-span-2 lg:col-span-4">
                    No more suggested items from this shop.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950">
                    More {titleCase(selectedItem.category)}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Same category from other suggested shops
                  </p>
                </div>
              </div>
              <div className="mt-4 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {similarItems.length > 0 ? (
                  similarItems.map((item) => renderMenuCard(item))
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white px-5 py-10 text-center text-sm font-bold text-slate-500 shadow-sm sm:col-span-2 lg:col-span-4">
                    No similar items are available from other shops yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {!showOrders && !selectedItem && (
          <section className="mt-8 animate-fadeInUp">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  {selectedShop
                    ? `🍽️ ${selectedShop.name} Menu`
                    : hasLocation
                      ? `🔥 Near ${detectedCity}`
                      : "📱 Explore Menu"}
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {activeShopId
                    ? `${visibleItems.length} of ${totalItems} item${totalItems !== 1 ? "s" : ""}`
                    : `${visibleItems.length} item${visibleItems.length !== 1 ? "s" : ""}`}
                  {(category || quickCategory) && ` · `}
                  {(category || quickCategory) && <span className="text-[#ff5a36] font-bold">{titleCase(category || quickCategory)}</span>}
                  {foodType && ` · `}
                  {foodType && <span className="text-[#ff5a36] font-bold">{FOOD_TYPE_LABELS[foodType]}</span>}
                  {sort !== "latest" && ` · `}
                  {sort !== "latest" && <span className="text-slate-500">{SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>}
                </p>
              </div>

              <div className="filter-bar">
                <label className="relative">
                  <select value={category} onChange={(e) => { setCategory(e.target.value); setQuickCategory(""); }}
                    className="filter-select pr-8" aria-label="Filter by category">
                    <option value="">All categories</option>
                    {CATEGORIES.map((opt) => <option key={opt} value={opt}>{titleCase(opt)}</option>)}
                  </select>
                  <HiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                </label>

                <label className="relative">
                  <select value={foodType} onChange={(e) => setFoodType(e.target.value)}
                    className="filter-select pr-8" aria-label="Filter by food type">
                    <option value="">All types</option>
                    <option value="veg">🥬 Veg</option>
                    <option value="non-veg">🍗 Non-Veg</option>
                  </select>
                  <HiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                </label>

                <label className="relative">
                  <select value={sort} onChange={(e) => setSort(e.target.value)}
                    className="filter-select pr-8" aria-label="Sort items">
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <HiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                </label>

                {(search || category || quickCategory || foodType || sort !== "latest") && (
                  <button type="button" onClick={clearFilters}
                    className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-[#ff5a36]">
                    <HiX className="text-xs" /> Clear
                  </button>
                )}
              </div>
            </div>

            {selectedShopLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
                <div className="animate-spin mx-auto h-8 w-8 rounded-full border-4 border-slate-200 border-t-[#ff5a36]" />
                <p className="mt-4 text-sm font-bold text-slate-600">Opening shop menu…</p>
              </div>
            ) : (
              <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy={itemsLoading}>
                {itemsLoading ? renderItemSkeletons() : visibleItems.map((item) => renderMenuCard(item))}
              </div>
            )}

            {!itemsLoading && !selectedShopLoading && visibleItems.length === 0 && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-16 text-center">
                <div className="text-5xl">🍽️</div>
                <p className="mt-3 text-lg font-black text-slate-800">No items found</p>
                <p className="mt-1 text-sm text-slate-500">
                  {hasLocation && !activeShopId
                    ? "No location-based items found. Try another search or category."
                    : "Try clearing filters or choosing another shop."}
                </p>
                <button type="button" onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#ff5a36] px-4 py-2 text-sm font-extrabold text-white shadow-md transition hover:bg-[#e04e2d]">
                  <HiX className="text-sm" /> Clear filters
                </button>
              </div>
            )}

            {!activeShopId && !itemsLoading && page < totalPages && visibleItems.length > 0 && (
              <div className="mt-8 flex justify-center">
                <button type="button" onClick={() => setPage((p) => p + 1)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5a36] to-[#ff6a46] px-8 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl hover:from-[#e04e2d] duration-200">
                  Load more items
                </button>
              </div>
            )}
          </section>
        )}

        {cartCount > 0 && (
          <button type="button" onClick={() => navigate("/cart")} className="cart-fab hidden md:flex">
            <HiShoppingCart className="text-base" />
            {cartCount} item{cartCount !== 1 ? "s" : ""}
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black">Cart →</span>
          </button>
        )}

        {cartCount > 0 && (
          <button type="button" onClick={() => navigate("/cart")} className="cart-fab md:hidden">
            <HiShoppingCart className="text-base" />
            Cart · {cartCount}
          </button>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
