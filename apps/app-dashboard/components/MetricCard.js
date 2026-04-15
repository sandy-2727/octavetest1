/**
 * Reusable metric tile for the dashboard app.
 * @param {{ label: string; value: string; hint?: string }} props
 * @returns {HTMLElement}
 */
export function createMetricCard({ label, value, hint = '' }) {
  const root = document.createElement('article');
  root.className = 'metric-card octave-card';

  const labelEl = document.createElement('p');
  labelEl.className = 'metric-card__label octave-muted';
  labelEl.textContent = label;

  const valueEl = document.createElement('p');
  valueEl.className = 'metric-card__value';
  valueEl.textContent = value;

  root.append(labelEl, valueEl);

  if (hint) {
    const hintEl = document.createElement('p');
    hintEl.className = 'metric-card__hint octave-muted';
    hintEl.textContent = hint;
    root.appendChild(hintEl);
  }

  return root;
}
