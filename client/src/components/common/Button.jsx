import React from "react";
import { cn } from "../../utils/classNames";

const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      icon: Icon,
      iconPosition = "left",
      fullWidth = false,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 select-none";

    const variants = {
      primary:
        "bg-[#ff5a36] text-white hover:bg-[#e04620] focus:ring-orange-300",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-300",
      danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-300",
      success:
        "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-300",
      warning:
        "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-300",
      ghost: "text-slate-700 hover:bg-slate-100 focus:ring-slate-300",
      outline:
        "border-2 border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-300",
    };

    const sizes = {
      xs: "px-3 py-1.5 text-xs gap-2",
      sm: "px-3.5 py-2 text-sm gap-2",
      md: "px-4 py-2.5 text-base gap-2",
      lg: "px-5 py-3 text-base gap-2.5",
      xl: "px-6 py-3.5 text-lg gap-3",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
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
            {children}
          </>
        ) : (
          <>
            {Icon && iconPosition === "left" && <Icon size={18} />}
            {children}
            {Icon && iconPosition === "right" && <Icon size={18} />}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
