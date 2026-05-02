import React from "react";
import { cn } from "../../utils/classNames";

const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      iconPosition = "left",
      type = "text",
      className,
      containerClassName,
      disabled = false,
      required = false,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full px-4 py-2.5 text-base border-2 rounded-lg transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              Icon && iconPosition === "left" && "pl-10",
              Icon && iconPosition === "right" && "pr-10",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-slate-200 focus:border-[#ff5a36] focus:ring-orange-100",
              disabled && "bg-slate-50 cursor-not-allowed",
              className,
            )}
            disabled={disabled}
            {...props}
          />
          {Icon && iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon size={18} />
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
