import * as trackingConfig from "./constants.js";
import { readPersistedUserId } from "./identity.js";

async function collectClientEnvironment() {
    const userAgentString = navigator.userAgent || "";
    const userAgentLower = userAgentString.toLowerCase();
    const clientHints = navigator.userAgentData;

    let browserName = "unknown";
    let browserVersion = "unknown";
    let osName = "unknown";
    let osVersion = "unknown";
    let device = "Desktop";

    const normalizeWindowsPlatformVersion = (platformVersion) => {
        if (!platformVersion) return "unknown";
        const ntMajor = parseInt(platformVersion.split(".")[0], 10);

        if (ntMajor >= 13) return "11";
        if (ntMajor >= 10) return "10";
        if (ntMajor >= 6) return "7/8/8.1";
        return "unknown";
    };

    if (clientHints?.brands?.length) {
        const preferredBrand = clientHints.brands.find((b) => !/not|chromium/i.test(b.brand));
        if (preferredBrand) {
            browserName = preferredBrand.brand || "unknown";
            browserVersion = preferredBrand.version || "unknown";
        }
    }

    if (browserName === "unknown") {
        const legacyBrowserPatterns = [
            { name: "Microsoft Edge", regex: /\bedg(?:e|)\/([\d.]+)/i },
            { name: "Opera", regex: /\bopr\/([\d.]+)/i },
            { name: "Chrome", regex: /\bchrome\/([\d.]+)/i },
            { name: "Firefox", regex: /\bfirefox\/([\d.]+)/i },
            { name: "Safari", regex: /\bversion\/([\d.]+).*safari/i },
        ];

        for (const patternEntry of legacyBrowserPatterns) {
            const regexMatch = userAgentString.match(patternEntry.regex);
            if (regexMatch) {
                browserName = patternEntry.name;
                browserVersion = regexMatch[1];
                break;
            }
        }
    }

    if (browserName === "unknown") {
        if (userAgentLower.includes("safari")) browserName = "Safari";
        else if (userAgentLower.includes("chrome")) browserName = "Chrome";
        else if (userAgentLower.includes("firefox")) browserName = "Firefox";
    }

    if (clientHints?.platform) {
        osName = clientHints.platform;

        if (clientHints.getHighEntropyValues) {
            const highEntropyHints = await clientHints.getHighEntropyValues(["platformVersion"]);
            const platformVersionHint = highEntropyHints.platformVersion;

            if (osName === "Windows" && platformVersionHint) {
                osVersion = normalizeWindowsPlatformVersion(platformVersionHint);
            } else {
                osVersion = platformVersionHint || "unknown";
            }
        }
    }

    if (osName === "unknown") {
        if (/windows nt/i.test(userAgentString)) {
            osName = "Windows";
            const windowsNtToken = userAgentString.match(/windows nt ([\d.]+)/i)?.[1] || "";

            const windowsNtVersionLabels = {
                "10.0": "10",
                "6.3": "8.1",
                "6.2": "8",
                "6.1": "7",
                "6.0": "Vista",
                "5.1": "XP",
                "5.2": "XP",
            };
            osVersion = windowsNtVersionLabels[windowsNtToken] || windowsNtToken || "unknown";
        } else if (/macintosh|mac os x/i.test(userAgentString)) {
            osName = "macOS";
            osVersion =
                userAgentString.match(/mac os x ([\d_]+)/i)?.[1]?.replace(/_/g, ".") ||
                "unknown";
        } else if (/android/i.test(userAgentString)) {
            osName = "Android";
            osVersion = userAgentString.match(/android ([\d.]+)/i)?.[1] || "unknown";
        } else if (/iphone|ipad|ipod/i.test(userAgentString)) {
            osName = "iOS";
            osVersion =
                userAgentString.match(/os ([\d_]+)/i)?.[1]?.replace(/_/g, ".") || "unknown";
        } else if (/linux/i.test(userAgentString)) {
            osName = "Linux";
            osVersion = "unknown";
        }
    }

    if (osName === "unknown") {
        if (/cros/i.test(userAgentString)) osName = "Chrome OS";
        else if (/tizen/i.test(userAgentString)) osName = "Tizen";
        else if (/tv|smart[- ]?tv|hbbtv/i.test(userAgentString)) osName = "Smart TV OS";
    }

    if (clientHints?.mobile) {
        device = "Mobile";
    } else if (/ipad|tablet/i.test(userAgentString)) {
        device = "Tablet";
    } else if (/iphone|ipod|android.*mobile/i.test(userAgentString)) {
        device = "Mobile";
    } else if (/android/i.test(userAgentString)) {
        device = "Tablet";
    }

    if (device === "Desktop") {
        if (screen.width < 600) device = "Mobile";
        else if (screen.width < 1000) device = "Tablet";
    }

    return {
        [trackingConfig.payloadDimensionKeys.browserName]: browserName,
        [trackingConfig.payloadDimensionKeys.browserVersion]: browserVersion,
        [trackingConfig.payloadDimensionKeys.osName]: osName,
        [trackingConfig.payloadDimensionKeys.osVersion]: osVersion,
        [trackingConfig.payloadDimensionKeys.device]: device,
    };
}

function collectViewportMetrics() {
    return {
        [trackingConfig.payloadDimensionKeys.windowWidth]: window.innerWidth,
        [trackingConfig.payloadDimensionKeys.windowHeight]: window.innerHeight,
        [trackingConfig.payloadDimensionKeys.screenWidth]: window.screen.width,
        [trackingConfig.payloadDimensionKeys.screenHeight]: window.screen.height,
    };
}

function padEventDimensionPlaceholders(payload) {
    const paddedPayload = { ...payload };
    for (const dimensionKey of Object.values(trackingConfig.payloadDimensionKeys)) {
        if (!(dimensionKey in paddedPayload)) {
            paddedPayload[dimensionKey] = null;
        }
    }
    return paddedPayload;
}

async function composeEventPayload(name, params) {
    const resolvedUserId = readPersistedUserId();
    const clientEnvironmentSlice = await collectClientEnvironment();
    const basePayload = {
        [trackingConfig.payloadDimensionKeys.userId]: resolvedUserId,
        [trackingConfig.payloadDimensionKeys.eventName]: name,
        ...clientEnvironmentSlice,
        ...collectViewportMetrics()
    };
    basePayload[trackingConfig.payloadDimensionKeys.currentUrl] =
            window.location.href;

    const mergedPayload = {};
    Object.assign(
        mergedPayload,
        basePayload,
        params
    );
    return mergedPayload;
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} [params]
 */
export async function emitTrackedEvent(name, params = {}) {
    try {
        const composedDimensions = await composeEventPayload(name, params);
        const dimensionsForLog = padEventDimensionPlaceholders(composedDimensions);
        console.log("Event -", name, dimensionsForLog);
    } catch {
        console.log(
            "Event -",
            "event_send_failed",
        );
    }
}
