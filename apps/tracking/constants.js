/**
 * Suffix for `Domain=.` cookie attribute; must be a parent domain of the
 * current hostname (see RFC 6265 domain-match).
 */
export function resolveAnalyticsCookieDomain() {
    try {
        const rawHostname = window.location.hostname || "";
        if (rawHostname === "localhost" || rawHostname === "127.0.0.1") {
            return "localhost";
        }
        if (rawHostname.endsWith(".pages.dev")) {
            return "pages.dev";
        }
        const hostnameSegments = rawHostname.split(".").filter(Boolean);
        if (hostnameSegments.length <= 2) {
            return rawHostname;
        }
        return hostnameSegments.slice(-2).join(".");
    } catch {
        return "";
    }
}

export const persistenceKeys = {
    userId: "userid",
};
export const trackedEventNames = {
    landerLoaded: "lander_loaded",
    buttonClicked: "button_clicked",
};

/** Outbound payload keys (values) must match your analytics contract. */
export const payloadDimensionKeys = {
    userId: "uid",
    browserName: "browser_name",
    browserVersion: "browser_version",
    osName: "os_name",
    osVersion: "os_version",
    device: "device",
    windowWidth: "window_width",
    windowHeight: "window_height",
    screenWidth: "screen_width",
    screenHeight: "screen_height",
    eventName: "event_name",
    currentUrl: "current_url",
    buttonText: "btn-text",
    buttonPosition: "btn-position",
};

export const trackingDomClasses = {
    primaryClickTarget: "playstore-btn",
};
