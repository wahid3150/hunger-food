import React from "react";
import { HiStar, HiLocationMarker, HiClock } from "react-icons/hi";
import Card from "./Card";
import Badge from "./Badge";
import { cn } from "../../utils/classNames";

export const ProductCard = ({
  image,
  name,
  price,
  rating,
  foodType,
  isAvailable,
  onViewDetails,
  onAddToCart,
  className,
}) => {
  const foodTypeColors = {
    veg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "non-veg": "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <Card
      className={cn("overflow-hidden hover cursor-pointer group", className)}
    >
      <div className="relative overflow-hidden bg-slate-200 h-40">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍔
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={isAvailable ? "success" : "danger"} size="sm">
            {isAvailable ? "Available" : "Unavailable"}
          </Badge>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 mb-2">
          {name}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-[#ff5a36]">PKR {price}</span>
          {rating && (
            <div className="flex items-center gap-1 text-xs">
              <HiStar size={14} className="text-yellow-400" />
              <span className="text-slate-600">{rating}</span>
            </div>
          )}
        </div>

        {foodType && (
          <Badge
            variant={foodType === "veg" ? "success" : "danger"}
            size="sm"
            className="mb-2"
          >
            {foodType === "veg" ? "🥬 Veg" : "🍗 Non-Veg"}
          </Badge>
        )}

        <button
          onClick={onAddToCart}
          disabled={!isAvailable}
          className={cn(
            "w-full py-2 rounded-lg font-medium text-sm transition-all mt-2",
            isAvailable
              ? "bg-[#ff5a36] text-white hover:bg-[#e04620]"
              : "bg-slate-100 text-slate-400 cursor-not-allowed",
          )}
        >
          Add to Cart
        </button>
      </div>
    </Card>
  );
};

export const ShopCard = ({
  image,
  name,
  category,
  location,
  rating,
  deliveryTime,
  onClick,
  className,
}) => {
  return (
    <Card className={cn("overflow-hidden hover cursor-pointer", className)}>
      <div className="relative overflow-hidden bg-slate-200 h-32">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🏪
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 line-clamp-1">{name}</h3>
        <p className="text-xs text-slate-500 mb-3">{category}</p>

        <div className="space-y-2 text-xs">
          {location && (
            <div className="flex items-center gap-2 text-slate-600">
              <HiLocationMarker size={14} />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
          {deliveryTime && (
            <div className="flex items-center gap-2 text-slate-600">
              <HiClock size={14} />
              <span>{deliveryTime} mins</span>
            </div>
          )}
        </div>

        {rating && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
            <HiStar size={14} className="text-yellow-400" />
            <span className="font-medium text-slate-900">{rating}</span>
            <span className="text-slate-500">(5.0 stars)</span>
          </div>
        )}

        <button
          onClick={onClick}
          className="w-full mt-3 py-2 bg-[#ff5a36] text-white rounded-lg font-medium text-sm hover:bg-[#e04620] transition"
        >
          View Menu
        </button>
      </div>
    </Card>
  );
};

export const OrderCard = ({
  orderId,
  customerName,
  items,
  total,
  status,
  date,
  statusColor,
  onClick,
  className,
}) => {
  const statusClasses = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-blue-50 text-blue-700",
    preparing: "bg-orange-50 text-orange-700",
    out_for_delivery: "bg-cyan-50 text-cyan-700",
    delivered: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return (
    <Card
      onClick={onClick}
      className={cn("cursor-pointer hover:shadow-md transition", className)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-600">Order #{orderId}</p>
          <p className="text-lg font-semibold text-slate-900">{customerName}</p>
        </div>
        <Badge
          variant="primary"
          className={cn(
            "capitalize",
            statusClasses[status] || statusClasses.pending,
          )}
        >
          {status?.replace("_", " ")}
        </Badge>
      </div>

      <div className="mb-3 pb-3 border-b border-slate-100">
        <p className="text-sm text-slate-600 mb-1">
          <span className="font-medium">{items}</span> items
        </p>
        <p className="text-lg font-semibold text-[#ff5a36]">PKR {total}</p>
      </div>

      <p className="text-xs text-slate-500">{date}</p>
    </Card>
  );
};

export const StatCard = ({ icon, label, value, subtext, trend, color }) => {
  return (
    <Card className="flex items-start gap-4">
      <div
        className="flex items-center justify-center h-12 w-12 rounded-lg text-2xl flex-shrink-0"
        style={{ backgroundColor: color ? `${color}18` : "#ff5a3618" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        <p className="text-xs font-semibold text-slate-600 mt-0.5">{label}</p>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        {trend && (
          <p
            className={`text-xs font-medium mt-2 ${
              trend > 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last period
          </p>
        )}
      </div>
    </Card>
  );
};
