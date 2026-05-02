import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiCheckCircle,
  HiXCircle,
  HiExclamationTriangle,
} from "react-icons/hi2";
import Button from "./Button";
import Input from "./Input";
import Select from "./Select";
import { cn } from "../../utils/classNames";

export const Form = ({
  children,
  onSubmit,
  isLoading = false,
  validationErrors = {},
  successMessage,
  errorMessage,
}) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit?.(e);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Form submission error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-700"
          >
            <HiCheckCircle size={20} />
            <span className="font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700"
          >
            <HiXCircle size={20} />
            <span className="font-medium">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {children}

      {Object.keys(validationErrors).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg bg-amber-50 border border-amber-200 p-4"
        >
          <div className="flex gap-2 mb-2">
            <HiExclamationTriangle className="text-amber-600 flex-shrink-0 mt-0.5" />
            <h4 className="font-semibold text-amber-900">
              Please fix the following errors:
            </h4>
          </div>
          <ul className="text-sm text-amber-800 space-y-1 ml-7">
            {Object.values(validationErrors).map((error, idx) => (
              <li key={idx} className="list-disc">
                {error}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading || Object.keys(validationErrors).length > 0}
          size="lg"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export const FormGroup = ({
  label,
  required,
  error,
  children,
  helperText,
  className,
}) => (
  <div className={cn("space-y-2", className)}>
    {label && (
      <label className="block text-sm font-semibold text-slate-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {children}
    {helperText && !error && (
      <p className="text-xs text-slate-500">{helperText}</p>
    )}
    {error && (
      <p className="text-xs text-red-500 flex items-center gap-1">
        <HiXCircle size={14} />
        {error}
      </p>
    )}
  </div>
);

export const Textarea = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      rows = 4,
      className,
      ...props
    },
    ref,
  ) => (
    <FormGroup
      label={label}
      error={error}
      helperText={helperText}
      required={required}
    >
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full px-4 py-3 border-2 rounded-lg transition-colors resize-none",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
            : "border-slate-200 focus:border-[#ff5a36] focus:ring-orange-100",
          className,
        )}
        {...props}
      />
    </FormGroup>
  ),
);

export const FileUpload = React.forwardRef(
  (
    {
      label,
      accept = "image/*",
      maxSize = 5 * 1024 * 1024, // 5MB
      error,
      helperText,
      required = false,
      preview,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [preview_url, setPreviewUrl] = useState(preview);

    const handleChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file size
      if (file.size > maxSize) {
        alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        onChange?.(file);
      };
      reader.readAsDataURL(file);
    };

    return (
      <FormGroup
        label={label}
        error={error}
        helperText={helperText}
        required={required}
      >
        <div className="flex gap-4">
          <label className="flex-1 relative border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-[#ff5a36] transition">
            <input
              ref={ref}
              type="file"
              accept={accept}
              onChange={handleChange}
              className="hidden"
              {...props}
            />
            <div className="text-center">
              <div className="text-3xl mb-2">📁</div>
              <p className="font-medium text-slate-900">Click to upload</p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG up to {maxSize / 1024 / 1024}MB
              </p>
            </div>
          </label>
          {preview_url && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100">
              <img
                src={preview_url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </FormGroup>
    );
  },
);

Textarea.displayName = "Textarea";
FileUpload.displayName = "FileUpload";

export const Checkbox = React.forwardRef(
  ({ label, description, error, ...props }, ref) => (
    <FormGroup error={error}>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          type="checkbox"
          className="mt-1 h-5 w-5 rounded border-slate-300 text-[#ff5a36] focus:ring-[#ff5a36] cursor-pointer"
          {...props}
        />
        <div>
          <label className="text-sm font-medium text-slate-900 cursor-pointer">
            {label}
          </label>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </FormGroup>
  ),
);

Checkbox.displayName = "Checkbox";

export const RadioGroup = ({ label, options = [], value, onChange, error }) => (
  <FormGroup label={label} error={error}>
    <div className="space-y-3">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-3 cursor-pointer"
        >
          <input
            type="radio"
            name={label}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-4 w-4 border-slate-300 text-[#ff5a36] focus:ring-[#ff5a36]"
          />
          <span className="text-sm font-medium text-slate-900">
            {option.label}
          </span>
          {option.description && (
            <span className="text-xs text-slate-500 ml-auto">
              {option.description}
            </span>
          )}
        </label>
      ))}
    </div>
  </FormGroup>
);

export const Toggle = React.forwardRef(
  ({ label, description, ...props }, ref) => (
    <div className="flex items-start gap-3">
      <button
        ref={ref}
        type="button"
        role="switch"
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          props.checked ? "bg-[#ff5a36]" : "bg-slate-300",
        )}
        onClick={() => props.onChange?.(!props.checked)}
      >
        <div
          className={cn(
            "absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform top-0.5",
            props.checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
      <div>
        <label className="text-sm font-medium text-slate-900">{label}</label>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  ),
);

Toggle.displayName = "Toggle";
