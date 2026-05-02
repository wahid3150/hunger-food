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
import { useNavigate } from "react-router-dom";
import {
  HiArrowLeft,
  HiChevronDown,
  HiClock,
  HiFire,
  HiHeart,
  HiLocationMarker,
  HiMinus,
  HiOutlineClipboardList,
  HiOutlineRefresh,
  HiOutlineShoppingBag,
  HiPlus,
  HiShoppingCart,
  HiStar,
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
    () => [activeShopId, search, category, foodType, sort].join("|"),
    [activeShopId, category, foodType, search, sort],
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
    setFoodType("");
    setSort("latest");
    setPage(1);
  };

  const openOrders = () => {
    setShowOrders(true);
    setSelectedShop(null);
    setSelectedItem(null);
  };

  const closeOrders = () => {
    setShowOrders(false);
  };

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

  const renderMenuCard = (item) => {
    const quantity = Number(quantities[item._id] || 1);
    return (
      <article
        key={item._id}
        onClick={() => openItemDetails(item)}
        className="group flex h-full min-h-[400px] cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 shadow-md hover:shadow-xl transition hover:-translate-y-2 hover:border-[#ff5a36]/40 duration-300"
      >
        <div className="relative h-48 w-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="grid h-full place-items-center text-slate-300">
              <HiOutlineShoppingBag className="text-5xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
          <span className="absolute left-3 top-3 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-md border border-white/50">
            {titleCase(item.category)}
          </span>
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 backdrop-blur text-slate-400 shadow-md border border-white/50 transition hover:bg-[#fff7f3] hover:text-[#ff5a36] hover:scale-110 group-hover:text-[#ff5a36]"
            aria-label={`Save ${item.name}`}
          >
            <HiHeart className="text-lg" />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black capitalize text-slate-900">
                {item.name}
              </h3>
              <p className="mt-1.5 truncate text-xs font-semibold text-slate-500">
                {item.shop?.name || selectedShop?.name || "Nearby shop"}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap border flex-shrink-0 ${
                item.foodType === "veg"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-orange-50 text-orange-600 border-orange-200"
              }`}
            >
              {FOOD_TYPE_LABELS[item.foodType] || "Food"}
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xl font-black text-[#ff5a36]">
              {formatPrice(item.price)}
            </p>
            <div
              className="flex items-center rounded-full border-2 border-slate-200 bg-white hover:border-[#ff5a36] transition"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => updateQuantity(item._id, -1)}
                className="grid h-8 w-8 place-items-center text-slate-400 transition hover:text-[#ff5a36] hover:bg-[#fff7f3] rounded-l-lg"
                aria-label={`Decrease ${item.name}`}
              >
                <HiMinus className="text-sm" />
              </button>
              <span className="w-8 text-center text-sm font-black text-slate-800">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(item._id, 1)}
                className="grid h-8 w-8 place-items-center text-slate-400 transition hover:text-[#ff5a36] hover:bg-[#fff7f3] rounded-r-lg"
                aria-label={`Increase ${item.name}`}
              >
                <HiPlus className="text-sm" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              addMenuItemToCart(item);
            }}
            className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 text-sm font-extrabold text-white shadow-md transition hover:shadow-lg hover:from-[#ff5a36] hover:to-[#ff4420] duration-300"
          >
            <HiShoppingCart className="text-sm" />
            Add to cart
          </button>
        </div>
      </article>
    );
  };

  const renderShopSkeletons = () =>
    Array.from({ length: 4 }, (_, index) => (
      <div
        key={index}
        className="h-[260px] w-[280px] flex-none rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:w-[330px]"
      >
        <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
      </div>
    ));

  const renderItemSkeletons = () =>
    Array.from({ length: 6 }, (_, index) => (
      <div
        key={index}
        className="h-[388px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-10 animate-pulse rounded-xl bg-slate-100" />
      </div>
    ));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <DashboardNavbar
        searchValue={search}
        onSearchChange={setSearch}
        onOrdersClick={openOrders}
      />

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6">
        {showOrders && (
          <section className="rounded-[32px] border border-[#ff5a36]/20 bg-gradient-to-br from-white to-slate-50/50 p-6 shadow-[0_20px_60px_rgba(255,90,54,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff5a36]/10 to-orange-100/50 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[#ff5a36] border border-[#ff5a36]/20">
                  📋 Order history
                </div>
                <h1 className="mt-3 text-4xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  My orders
                </h1>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Track and manage orders placed across shops.
                </p>
              </div>
              <div className="flex gap-3">
                {/* Live indicator — orders update via socket */}
                <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
                <button
                  type="button"
                  onClick={closeOrders}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 text-sm font-extrabold text-white shadow-lg transition hover:shadow-xl hover:from-[#ff5a36] hover:to-[#ff4420]"
                >
                  <HiArrowLeft />
                  Back to food
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {ordersLoading ? (
                [1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-32 animate-pulse rounded-3xl bg-slate-100"
                  />
                ))
              ) : orders.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-12 text-center">
                  <HiOutlineClipboardList className="mx-auto text-5xl text-slate-300" />
                  <p className="mt-3 font-extrabold text-slate-800">
                    No orders yet
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Your placed orders will appear here.
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <article
                    key={order._id}
                    className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-md hover:shadow-lg transition duration-300 hover:border-[#ff5a36]/30"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 ring-2 ring-[#ff5a36]/10 flex-shrink-0">
                          {order.shop?.image ? (
                            <img
                              src={order.shop.image}
                              alt={order.shop?.name}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <h2 className="text-base font-black text-slate-950">
                            {order.shop?.name || "Shop order"}
                          </h2>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                          <span
                            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold capitalize border ${
                              String(order.status || "pending") === "delivered"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : String(order.status || "pending") ===
                                    "pending"
                                  ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                  : "bg-[#fff0eb] text-[#ff5a36] border-[#ff5a36]/30"
                            }`}
                          >
                            {String(order.status || "pending").replaceAll(
                              "_",
                              " ",
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="text-xs font-bold text-slate-400">
                          Total
                        </p>
                        <p className="text-xl font-black text-slate-950">
                          PKR {Number(order.totalAmount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-[1fr_280px]">
                      <div className="space-y-2">
                        {(order.items || []).map((item) => (
                          <div
                            key={`${order._id}-${item.item}`}
                            className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm"
                          >
                            <span className="font-bold capitalize text-slate-700">
                              {item.name}
                            </span>
                            <span className="font-semibold text-slate-500">
                              {item.quantity} x PKR{" "}
                              {Number(item.price || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-400">
                          Delivery address
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {order.deliveryAddress?.text || "No address saved"}
                        </p>
                      </div>
                    </div>

                    {/* ── Live tracking: show when rider assigned ── */}
                    {order.deliveryStatus === "assigned" &&
                      order.status !== "delivered" && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        {trackingOrderId === order._id ? (
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-xs font-extrabold uppercase tracking-widest text-[#ff5a36]">
                                🛵 Live tracking
                              </p>
                              <button
                                type="button"
                                onClick={() => setTrackingOrderId(null)}
                                className="text-xs font-semibold text-slate-400 transition hover:text-slate-600"
                              >
                                Close map
                              </button>
                            </div>
                            <div className="h-64 overflow-hidden rounded-2xl border border-slate-200">
                              <LiveTracking
                                orderId={order._id}
                                destLat={order.deliveryAddress?.latitude}
                                destLng={order.deliveryAddress?.longitude}
                              />
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTrackingOrderId(order._id);
                              socket.emit("join-order", order._id);
                            }}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ff5a36]/30 bg-[#fff7f3] px-4 py-2.5 text-sm font-bold text-[#ff5a36] transition hover:bg-[#ff5a36] hover:text-white"
                          >
                            <HiLocationMarker />
                            Track live delivery
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {!showOrders && isHomeView && (
          <section className="rounded-3xl border border-[#ff5a36]/20 bg-gradient-to-br from-white via-white to-slate-50/30 px-5 py-6 shadow-[0_20px_60px_rgba(255,90,54,0.08)] sm:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff5a36]/10 to-orange-100/50 px-4 py-2 text-xs font-extrabold text-[#ff5a36] border border-[#ff5a36]/20">
                  <HiFire className="text-lg" />
                  {hasLocation
                    ? `Near ${detectedCity}`
                    : "Enable location for nearby picks"}
                </div>
                <h2 className="mt-3 text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  🏪 Featured Shops
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Top-rated shops ranked by menu variety and proximity
                </p>
              </div>
              {/* Live indicator replaces Refresh button */}
              <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>

            <div className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
              {shopsLoading
                ? renderShopSkeletons()
                : topShops.map((shop, index) => (
                    <button
                      key={shop._id}
                      type="button"
                      onClick={() => openShop(shop)}
                      className={`group relative flex h-[280px] w-[280px] flex-none snap-start flex-col overflow-hidden rounded-3xl border bg-gradient-to-br from-white to-slate-50/50 text-left shadow-md transition hover:-translate-y-2 hover:shadow-xl sm:w-[330px] ${
                        activeShopId === shop._id
                          ? "border-2 border-[#ff5a36] ring-2 ring-[#ff5a36]/20 from-white to-[#fff7f3]"
                          : "border-slate-200/80 hover:border-[#ff5a36]/50"
                      }`}
                    >
                      <div className="relative h-44 w-full flex-shrink-0 overflow-hidden bg-slate-100">
                        {shop.image ? (
                          <img
                            src={shop.image}
                            alt={shop.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-slate-400">
                            <HiOutlineShoppingBag className="text-4xl" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
                        <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-slate-950 to-slate-800 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur shadow-lg">
                          🏆 #{index + 1}
                        </span>
                        {shop.isNearby && (
                          <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-[#ff5a36] to-[#ff4420] px-3 py-1.5 text-xs font-extrabold text-white shadow-lg animate-pulse">
                            📍 Near you
                          </span>
                        )}
                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-xs font-extrabold text-[#ff5a36] shadow-md border border-white/50">
                          <HiOutlineShoppingBag className="text-sm" />
                          {shop.availableItemCount} items
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-black text-slate-950">
                              {shop.name}
                            </h3>
                            <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
                              <HiLocationMarker className="text-[#ff5a36] text-sm flex-shrink-0" />
                              {shop.city}, {shop.state}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 px-2.5 py-1.5 text-xs font-extrabold text-amber-600 border border-amber-200/50">
                            <HiStar className="text-sm" />
                            4.8
                          </span>
                        </div>
                        <p className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-[#ff5a36] transition">
                          <HiClock className="text-sm" />
                          View menu →
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
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {hasLocation
                    ? "We could not match shops to your detected city yet."
                    : "Allow location access or try a different search."}
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
          <section className="mt-7 rounded-3xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
            <HiOutlineRefresh className="mx-auto animate-spin text-3xl text-[#ff5a36]" />
            <p className="mt-3 text-sm font-bold text-slate-600">
              Loading item details
            </p>
          </section>
        )}

        {!showOrders && selectedItem && (
          <section className="mt-7">
            <button
              type="button"
              onClick={closeItemDetails}
              className="mb-4 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:border-[#ff5a36]/30 hover:bg-[#fff7f3] hover:text-[#ff5a36]"
            >
              <HiArrowLeft />
              Back to menu
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
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      selectedItem.foodType === "veg"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {FOOD_TYPE_LABELS[selectedItem.foodType] || "Food"}
                  </span>
                </div>

                <p className="mt-8 text-3xl font-extrabold text-[#ff5a36]">
                  {formatPrice(selectedItem.price)}
                </p>
                <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-slate-500">
                  Freshly listed by the shop and currently available for order.
                  Add it to your cart or explore more items from the same menu.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">Category</p>
                    <p className="mt-1 font-extrabold text-slate-800">
                      {titleCase(selectedItem.category)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400">
                      Food type
                    </p>
                    <p className="mt-1 font-extrabold text-slate-800">
                      {FOOD_TYPE_LABELS[selectedItem.foodType] || "Food"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => addMenuItemToCart(selectedItem)}
                  className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#ff5a36] sm:w-56 lg:mt-auto"
                >
                  <HiShoppingCart />
                  Add to cart
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
          <section className="mt-10">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  {selectedShop
                    ? `🍽️ ${selectedShop.name} Menu`
                    : hasLocation
                      ? `🔥 Items near ${detectedCity}`
                      : "📱 Explore Menu"}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {activeShopId
                    ? `Showing ${visibleItems.length} of ${totalItems} available item${totalItems !== 1 ? "s" : ""}`
                    : `Showing ${visibleItems.length} location-based item${visibleItems.length !== 1 ? "s" : ""}`}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 rounded-2xl border-2 border-slate-200/80 bg-white p-3 shadow-md">
                <label className="relative">
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="h-10 appearance-none rounded-xl border-2 border-slate-200 bg-slate-50 pl-3 pr-9 text-sm font-bold text-slate-600 outline-none transition hover:border-[#ff5a36] focus:border-[#ff5a36] focus:bg-white hover:bg-white"
                    aria-label="Filter by category"
                  >
                    <option value="">All categories</option>
                    {CATEGORIES.map((option) => (
                      <option key={option} value={option}>
                        {titleCase(option)}
                      </option>
                    ))}
                  </select>
                  <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </label>

                <label className="relative">
                  <select
                    value={foodType}
                    onChange={(event) => setFoodType(event.target.value)}
                    className="h-10 appearance-none rounded-xl border-2 border-slate-200 bg-slate-50 pl-3 pr-9 text-sm font-bold text-slate-600 outline-none transition hover:border-[#ff5a36] focus:border-[#ff5a36] focus:bg-white hover:bg-white"
                    aria-label="Filter by food type"
                  >
                    <option value="">All types</option>
                    <option value="veg">🥬 Veg</option>
                    <option value="non-veg">🍗 Non-Veg</option>
                  </select>
                  <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </label>

                <label className="relative">
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="h-10 appearance-none rounded-xl border-2 border-slate-200 bg-slate-50 pl-3 pr-9 text-sm font-bold text-slate-600 outline-none transition hover:border-[#ff5a36] focus:border-[#ff5a36] focus:bg-white hover:bg-white"
                    aria-label="Sort menu items"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </label>

                {(search || category || foodType || sort !== "latest") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-10 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 text-sm font-bold text-white transition hover:from-[#ff5a36] hover:to-[#ff4420] shadow-md"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {selectedShopLoading ? (
              <div className="rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 px-5 py-10 text-center shadow-md">
                <HiOutlineRefresh className="mx-auto animate-spin text-4xl text-[#ff5a36]" />
                <p className="mt-4 text-sm font-bold text-slate-600">
                  Opening shop menu...
                </p>
              </div>
            ) : (
              <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {itemsLoading
                  ? renderItemSkeletons()
                  : visibleItems.map((item) => renderMenuCard(item))}
              </div>
            )}

            {!itemsLoading &&
              !selectedShopLoading &&
              visibleItems.length === 0 && (
                <div className="rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50 px-6 py-16 text-center shadow-md sm:col-span-2 lg:col-span-3 xl:col-span-4">
                  <div className="text-6xl mb-3">🍽️</div>
                  <p className="mt-2 font-black text-slate-800 text-lg">
                    No menu items found
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {hasLocation && !activeShopId
                      ? "No location-based items found yet. Try another search or category."
                      : "Try clearing filters or choosing another shop."}
                  </p>
                </div>
              )}

            {!activeShopId &&
              !itemsLoading &&
              page < totalPages &&
              visibleItems.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-8 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl hover:from-[#ff5a36] hover:to-[#ff4420] duration-300"
                  >
                    📍 Load more items
                  </button>
                </div>
              )}
          </section>
        )}

        {cartCount > 0 && (
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="fixed bottom-5 left-1/2 z-40 inline-flex h-12 -translate-x-1/2 items-center gap-3 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 px-6 text-sm font-extrabold text-white shadow-2xl transition hover:-translate-y-1 hover:shadow-3xl hover:from-[#ff5a36] hover:to-[#ff4420] md:hidden"
          >
            <HiShoppingCart className="text-lg" />
            View cart
            <span className="rounded-full bg-[#ff5a36] px-2.5 py-0.5 text-xs font-black">
              {cartCount}
            </span>
          </button>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
