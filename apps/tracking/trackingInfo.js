import * as CONSTANTS from "./constants.js";
import { getUserId } from "./identity.js";

async function getBrowserAndOSInfo() {
    const ua = navigator.userAgent || "";
    const uaLower = ua.toLowerCase();
    const uaData = navigator.userAgentData;

    let browserName = "unknown";
    let browserVersion = "unknown";
    let osName = "unknown";
    let osVersion = "unknown";
    let device = "Desktop";

    const mapWindowsPlatformVersion = (platformVersion) => {
        if (!platformVersion) return "unknown";
        const major = parseInt(platformVersion.split(".")[0], 10);

        if (major >= 13) return "11";
        if (major >= 10) return "10";
        if (major >= 6) return "7/8/8.1";
        return "unknown";
    };

    if (uaData?.brands?.length) {
        const brand = uaData.brands.find((b) => !/not|chromium/i.test(b.brand));
        if (brand) {
            browserName = brand.brand || "unknown";
            browserVersion = brand.version || "unknown";
        }
    }

    if (browserName === "unknown") {
        const browserRegexList = [
            { name: "Microsoft Edge", regex: /\bedg(?:e|)\/([\d.]+)/i },
            { name: "Opera", regex: /\bopr\/([\d.]+)/i },
            { name: "Chrome", regex: /\bchrome\/([\d.]+)/i },
            { name: "Firefox", regex: /\bfirefox\/([\d.]+)/i },
            { name: "Safari", regex: /\bversion\/([\d.]+).*safari/i },
        ];

        for (const b of browserRegexList) {
            const match = ua.match(b.regex);
            if (match) {
                browserName = b.name;
                browserVersion = match[1];
                break;
            }
        }
    }

    if (browserName === "unknown") {
        if (uaLower.includes("safari")) browserName = "Safari";
        else if (uaLower.includes("chrome")) browserName = "Chrome";
        else if (uaLower.includes("firefox")) browserName = "Firefox";
    }

    if (uaData?.platform) {
        osName = uaData.platform;

        if (uaData.getHighEntropyValues) {
            const high = await uaData.getHighEntropyValues(["platformVersion"]);
            const pv = high.platformVersion;

            if (osName === "Windows" && pv) {
                osVersion = mapWindowsPlatformVersion(pv);
            } else {
                osVersion = pv || "unknown";
            }
        }
    }

    if (osName === "unknown") {
        if (/windows nt/i.test(ua)) {
            osName = "Windows";
            const nt = ua.match(/windows nt ([\d.]+)/i)?.[1] || "";

            const winMap = {
                "10.0": "10",
                "6.3": "8.1",
                "6.2": "8",
                "6.1": "7",
                "6.0": "Vista",
                "5.1": "XP",
                "5.2": "XP",
            };
            osVersion = winMap[nt] || nt || "unknown";
        } else if (/macintosh|mac os x/i.test(ua)) {
            osName = "macOS";
            osVersion =
                ua.match(/mac os x ([\d_]+)/i)?.[1]?.replace(/_/g, ".") ||
                "unknown";
        } else if (/android/i.test(ua)) {
            osName = "Android";
            osVersion = ua.match(/android ([\d.]+)/i)?.[1] || "unknown";
        } else if (/iphone|ipad|ipod/i.test(ua)) {
            osName = "iOS";
            osVersion =
                ua.match(/os ([\d_]+)/i)?.[1]?.replace(/_/g, ".") || "unknown";
        } else if (/linux/i.test(ua)) {
            osName = "Linux";
            osVersion = "unknown";
        }
    }

    if (osName === "unknown") {
        if (/cros/i.test(ua)) osName = "Chrome OS";
        else if (/tizen/i.test(ua)) osName = "Tizen";
        else if (/tv|smart[- ]?tv|hbbtv/i.test(ua)) osName = "Smart TV OS";
    }

    if (uaData?.mobile) {
        device = "Mobile";
    } else if (/ipad|tablet/i.test(ua)) {
        device = "Tablet";
    } else if (/iphone|ipod|android.*mobile/i.test(ua)) {
        device = "Mobile";
    } else if (/android/i.test(ua)) {
        device = "Tablet";
    }

    if (device === "Desktop") {
        if (screen.width < 600) device = "Mobile";
        else if (screen.width < 1000) device = "Tablet";
    }

    return {
        [CONSTANTS.eventDimensions.browser_name]: browserName,
        [CONSTANTS.eventDimensions.browser_version]: browserVersion,
        [CONSTANTS.eventDimensions.os_name]: osName,
        [CONSTANTS.eventDimensions.os_version]: osVersion,
        [CONSTANTS.eventDimensions.device]: device,
    };
}

function getWindowAndScreenDimensions() {
    return {
        [CONSTANTS.eventDimensions.window_width]: window.innerWidth,
        [CONSTANTS.eventDimensions.window_height]: window.innerHeight,
        [CONSTANTS.eventDimensions.screen_width]: window.screen.width,
        [CONSTANTS.eventDimensions.screen_height]: window.screen.height,
    };
}

function fillAllEventDimensionKeys(payload) {
    const out = { ...payload };
    for (const shortKey of Object.values(CONSTANTS.eventDimensions)) {
        if (!(shortKey in out)) {
            out[shortKey] = null;
        }
    }
    return out;
}

async function buildLandingEventPayload(name, params) {
    const userId = getUserId();
    const browserAndOSInfo = await getBrowserAndOSInfo();
    const basicEventData = {
        [CONSTANTS.eventDimensions.user_id]: userId,
        [CONSTANTS.eventDimensions.event_name]: name,
        ...browserAndOSInfo,
        ...getWindowAndScreenDimensions()
    };
    basicEventData[CONSTANTS.eventDimensions.current_url] =
            window.location.href;

    const finalEventData = {};
    Object.assign(
        finalEventData,
        basicEventData,
        params
    );
    return finalEventData;
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} [params]
 */
export async function fireEvent(name, params = {}) {
    try {
        const eventData = await buildLandingEventPayload(name, params);
        const forLog = fillAllEventDimensionKeys(eventData);
        console.log("Event -", name, forLog);
    } catch {
        console.log(
            "Event -",
            "event_send_failed",
            fillAllEventDimensionKeys(failPayload),
        );
    }
}

