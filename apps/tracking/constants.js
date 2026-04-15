/**
 * Suffix for `Domain=.` cookie attribute; must be a parent domain of the
 * current hostname (see RFC 6265 domain-match).
 */
export function getLanderDomain() {
    try {
        const host = window.location.hostname || "";
        if (host === "localhost" || host === "127.0.0.1") {
            return "localhost";
        }
        if (host.endsWith(".pages.dev")) {
            return "pages.dev";
        }
        const parts = host.split(".").filter(Boolean);
        if (parts.length <= 2) {
            return host;
        }
        return parts.slice(-2).join(".");
    } catch {
        return "";
    }
}

export const lskeys = {
    userid: "userid",
};
export const eventNames = {
    lpld: "lander_loaded",
    btnClkd: "button_clicked",
};

/** Outbound payload keys (values) must match your analytics contract. */
export const eventDimensions = {
    user_id: "uid",
    browser_name: "browser_name",
    browser_version: "browser_version",
    os_name: "os_name",
    os_version: "os_version",
    device: "device",
    window_width: "window_width",
    window_height: "window_height",
    screen_width: "screen_width",
    screen_height: "screen_height",
    event_name: "event_name",
    current_url: "current_url",
    btn_text: "btn-text",
    btn_position: "btn-position",
};

export const classNames = {
    buttonClassName: "playstore-btn",
};
