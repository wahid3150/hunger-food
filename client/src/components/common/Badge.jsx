import React from "react";
import { cn } from "../../utils/classNames";

const Badge = React.forwardRef(
  (
    { children, className, variant = "primary", size = "md", ...props },
    ref,
  ) => {
    const variants = {
      primary: "bg-[#ff5a36] text-white",
      secondary: "bg-slate-100 text-slate-700",
      success: "bg-emerald-100 text-emerald-700",
      warning: "bg-amber-100 text-amber-700",
      danger: "bg-red-100 text-red-700",
      info: "bg-blue-100 text-blue-700",
    };

    const sizes = {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-1.5 text-sm",
      lg: "px-4 py-2 text-base",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export default Badge;
