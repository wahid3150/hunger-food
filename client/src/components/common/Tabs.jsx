import React, { useState } from "react";
import { cn } from "../../utils/classNames";

export const Tabs = ({
  tabs,
  defaultTab = 0,
  onChange,
  variant = "line",
  className,
  tabClassName,
  contentClassName,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (index) => {
    setActiveTab(index);
    onChange?.(index);
  };

  const isLine = variant === "line";
  const isButton = variant === "button";

  return (
    <div className={className}>
      <div
        className={cn(
          "flex border-b border-slate-200",
          isButton && "gap-2 border-b-0 mb-4 p-1 bg-slate-100 rounded-lg w-fit",
        )}
      >
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(index)}
            className={cn(
              "px-4 py-3 font-medium transition-all relative",
              activeTab === index
                ? isLine
                  ? "text-[#ff5a36] border-b-2 border-[#ff5a36]"
                  : "bg-white text-[#ff5a36] rounded-md shadow-sm"
                : isLine
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-600 hover:text-slate-900",
              tabClassName,
            )}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div className={cn("mt-4", contentClassName)}>
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

export default Tabs;
