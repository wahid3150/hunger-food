import clsx from "clsx";

/**
 * Conditionally combine classNames
 * @param  {...any} classes - Classes to combine
 * @returns {string} Combined classname string
 */
export const cn = (...classes) => clsx(classes);

/**
 * Create variant-based classname helper (for component variants)
 * @param {object} variants - Object with variant mappings
 * @returns {function} Function that selects variant classnames
 */
export const createVariant = (variants) => {
  return (variant = "default") => {
    return variants[variant] || variants.default || "";
  };
};

/**
 * Conditionally apply classes based on conditions
 * @param {object} conditions - Object with condition: className pairs
 * @returns {string} Combined classname string
 */
export const applyIf = (conditions) => {
  return Object.entries(conditions)
    .filter(([, condition]) => condition)
    .map(([className]) => className)
    .join(" ");
};
