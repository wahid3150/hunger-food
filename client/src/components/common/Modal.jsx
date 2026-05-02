import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/classNames";
import { HiX } from "react-icons/hi";

const Modal = React.forwardRef(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      footer,
      size = "md",
      closeOnBackdropClick = true,
      className,
      overlayClassName,
    },
    ref,
  ) => {
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
        const handleEsc = (e) => {
          if (e.key === "Escape") onClose?.();
        };
        document.addEventListener("keydown", handleEsc);
        return () => {
          document.body.style.overflow = "unset";
          document.removeEventListener("keydown", handleEsc);
        };
      }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      full: "max-w-full mx-4",
    };

    const modalContent = (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          overlayClassName,
        )}
        onClick={(e) =>
          closeOnBackdropClick && e.target === e.currentTarget && onClose?.()
        }
      >
        <div className="fixed inset-0 bg-black/50" />
        <div
          ref={ref}
          className={cn(
            "relative bg-white rounded-xl shadow-2xl w-full",
            sizeClasses[size],
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg transition"
            >
              <HiX size={20} />
            </button>
          </div>

          <div className="p-6">{children}</div>

          {footer && (
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  },
);

Modal.displayName = "Modal";

export default Modal;
