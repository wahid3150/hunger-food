import React from "react";
import { cn } from "../../utils/classNames";
import {
  HiX,
  HiCheckCircle,
  HiExclamation,
  HiInformationCircle,
} from "react-icons/hi";

const Alert = React.forwardRef(
  (
    {
      children,
      className,
      variant = "info",
      title,
      dismissible = true,
      onDismiss,
      ...props
    },
    ref,
  ) => {
    const variants = {
      success: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-800",
        icon: <HiCheckCircle className="text-emerald-600" size={20} />,
      },
      warning: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        icon: <HiExclamation className="text-amber-600" size={20} />,
      },
      error: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        icon: <HiExclamation className="text-red-600" size={20} />,
      },
      info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: <HiInformationCircle className="text-blue-600" size={20} />,
      },
    };

    const style = variants[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border-2 p-4 flex items-start gap-3",
          style.bg,
          style.border,
          style.text,
          className,
        )}
        {...props}
      >
        <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition"
          >
            <HiX size={18} />
          </button>
        )}
      </div>
    );
  },
);

Alert.displayName = "Alert";

export default Alert;
