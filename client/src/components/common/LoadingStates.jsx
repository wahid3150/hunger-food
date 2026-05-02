import React from "react";
import { cn } from "../../utils/classNames";

export const LoadingSpinner = ({ size = "md", message }) => {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
    xl: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <svg
        className={cn("animate-spin text-[#ff5a36]", sizes[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && <p className="mt-3 text-slate-600 text-sm">{message}</p>}
    </div>
  );
};

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  actionLabel = "Add New",
  image,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {image ? (
        <img
          src={image}
          alt="Empty"
          className="h-48 w-48 object-contain mb-4"
        />
      ) : (
        <div className="text-6xl mb-4">{icon || "📦"}</div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm max-w-xs text-center mb-4">
        {description}
      </p>
      {action && (
        <button
          onClick={action}
          className="px-4 py-2 bg-[#ff5a36] text-white rounded-lg hover:bg-[#e04620] transition font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const LoadingPage = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-600">{message}</p>
      </div>
    </div>
  );
};

export const ErrorMessage = ({
  title,
  message,
  onRetry,
  retryLabel = "Try Again",
}) => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
        <div className="text-4xl mb-3">❌</div>
        <h3 className="text-lg font-semibold text-red-900 mb-1">{title}</h3>
        <p className="text-red-700 text-sm mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export const LoadingContent = ({ children, isLoading, fallback }) => {
  return isLoading ? fallback || <LoadingSpinner /> : children;
};
