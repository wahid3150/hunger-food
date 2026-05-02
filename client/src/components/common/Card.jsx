import React from "react";
import { cn } from "../../utils/classNames";

const Card = React.forwardRef(
  (
    {
      children,
      className,
      padding = "md",
      border = true,
      shadow = "sm",
      hover = false,
      ...props
    },
    ref,
  ) => {
    const paddingSizes = {
      none: "",
      sm: "p-3",
      md: "p-5",
      lg: "p-7",
      xl: "p-8",
    };

    const shadowSizes = {
      none: "",
      xs: "shadow-xs",
      sm: "shadow-sm",
      md: "shadow-md",
      lg: "shadow-lg",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl bg-white",
          paddingSizes[padding],
          shadowSizes[shadow],
          border && "border border-slate-200",
          hover &&
            "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export default Card;
