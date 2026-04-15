/**
 * Centralized event tracking (singleton).
 * Simulates analytics by logging structured events to the console.
 */

class Tracker {
  constructor() {
    /** @type {Array<{ ts: string, eventName: string, payload: object }>} */
    this._buffer = [];
    this._enabled = true;
  }

  /**
   * Record an analytics-style event.
   * @param {string} eventName
   * @param {Record<string, unknown>} [payload]
   */
  track(eventName, payload = {}) {
    if (!this._enabled || typeof eventName !== 'string' || !eventName.trim()) {
      return;
    }

    const entry = {
      ts: new Date().toISOString(),
      eventName: eventName.trim(),
      payload: { ...payload },
    };

    this._buffer.push(entry);

    // Simulate sending to an analytics backend
    console.info('[tracking]', entry.eventName, entry);
  }

  /** @returns {ReadonlyArray<object>} */
  getHistory() {
    return [...this._buffer];
  }

  setEnabled(on) {
    this._enabled = Boolean(on);
  }
}

/** Single shared instance for the whole workspace */
const trackerSingleton = new Tracker();

/**
 * Track a named event (preferred API for apps).
 * @param {string} eventName
 * @param {Record<string, unknown>} [payload]
 */
export function trackEvent(eventName, payload) {
  trackerSingleton.track(eventName, payload);
}

export function getTracker() {
  return trackerSingleton;
}

export default trackerSingleton;
