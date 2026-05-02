import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../utils/classNames";
import { HiChevronDown } from "react-icons/hi";

const Select = React.forwardRef(
  (
    {
      label,
      options = [],
      value,
      onChange,
      placeholder = "Select...",
      className,
      containerClassName,
      error,
      required = false,
      disabled = false,
      clearable = false,
      searchable = false,
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const filteredOptions = searchable
      ? options.filter((opt) =>
          String(opt.label).toLowerCase().includes(search.toLowerCase()),
        )
      : options;

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div ref={containerRef} className="relative">
          <button
            ref={ref}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              "w-full px-4 py-2.5 text-left border-2 rounded-lg transition-colors",
              "flex items-center justify-between",
              error
                ? "border-red-300 focus:border-red-500"
                : "border-slate-200 focus:border-[#ff5a36]",
              disabled && "bg-slate-50 cursor-not-allowed",
              className,
            )}
            disabled={disabled}
          >
            <span
              className={selectedOption ? "text-slate-900" : "text-slate-500"}
            >
              {selectedOption?.label || placeholder}
            </span>
            <HiChevronDown
              size={18}
              className={cn("transition-transform", isOpen && "rotate-180")}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {searchable && (
                <div className="p-2 border-b border-slate-200 sticky top-0 bg-white">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#ff5a36]"
                    autoFocus
                  />
                </div>
              )}
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange?.(option.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 hover:bg-slate-50 transition",
                      value === option.value &&
                        "bg-orange-50 text-[#ff5a36] font-medium",
                    )}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
