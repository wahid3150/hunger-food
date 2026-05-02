import { formatDistanceToNow, format } from "date-fns";

/**
 * Format price with currency
 * @param {number} price - Price to format
 * @param {string} currency - Currency code (default: PKR)
 * @returns {string} Formatted price string
 */
export const formatPrice = (price = 0, currency = "PKR") => {
  return `${currency} ${Number(price || 0).toLocaleString("en-PK", { minimumFractionDigits: 0 })}`;
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount
 */
export const formatCurrency = (amount = 0) => {
  return Number(amount || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num = 0) => {
  return Number(num || 0).toLocaleString("en-US");
};

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} pattern - date-fns format pattern (default: 'MMM dd, yyyy')
 * @returns {string} Formatted date
 */
export const formatDate = (date, pattern = "MMM dd, yyyy") => {
  if (!date) return "-";
  return format(new Date(date), pattern);
};

/**
 * Format date to time only
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time (HH:mm)
 */
export const formatTime = (date) => {
  if (!date) return "-";
  return format(new Date(date), "HH:mm");
};

/**
 * Format date relative to now (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative date string
 */
export const formatRelativeTime = (date) => {
  if (!date) return "-";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Format datetime to readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime (MMM dd, yyyy HH:mm)
 */
export const formatDateTime = (date) => {
  if (!date) return "-";
  return format(new Date(date), "MMM dd, yyyy HH:mm");
};

/**
 * Convert text to title case
 * @param {string} text - Text to convert
 * @returns {string} Title cased text
 */
export const titleCase = (text = "") => {
  return String(text)
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Convert status to readable format
 * @param {string} status - Status string
 * @returns {string} Formatted status
 */
export const formatStatus = (status = "") => {
  const statusMap = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return statusMap[status] || titleCase(status);
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name = "") => {
  const safe = String(name || "").trim();
  if (!safe) return "U";
  const parts = safe.split(/\s+/).filter(Boolean);
  return (
    (
      (parts[0]?.[0] || "") +
      (parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "")
    ).toUpperCase() || "U"
  );
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export const truncate = (text = "", length = 100, suffix = "...") => {
  if (text.length <= length) return text;
  return text.slice(0, length) + suffix;
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes = 0) => {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Decimal places (default: 0)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value = 0, decimals = 0) => {
  return (Number(value) || 0).toFixed(decimals) + "%";
};

/**
 * Format rating
 * @param {number} rating - Rating value
 * @returns {string} Formatted rating (e.g., "4.5 ★")
 */
export const formatRating = (rating = 0) => {
  const num = Number(rating || 0).toFixed(1);
  return `${num} ★`;
};

/**
 * Get status color class
 * @param {string} status - Status string
 * @returns {object} Object with bg and text color classes
 */
export const getStatusColors = (status = "") => {
  const statusColors = {
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    confirmed: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    preparing: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    out_for_delivery: {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-200",
    },
    delivered: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    cancelled: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    available: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    unavailable: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
    },
  };
  return statusColors[status] || statusColors.pending;
};
