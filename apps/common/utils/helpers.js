/**
 * Small shared helpers used across apps (optional utilities).
 */

/**
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {HTMLElement | null}
 */
export function qs(selector, root = document) {
  return root.querySelector(selector);
}

/**
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {HTMLElement[]}
 */
export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

/**
 * @param {number | Date} value
 * @returns {string}
 */
export function formatShortTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
