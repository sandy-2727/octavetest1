import * as trackingConfig from "./constants.js";

const localStorageMemo = (function () {
    const readThroughCache = Object.create(null);
    return {
        read: function (key) {
            if (key in readThroughCache) {
                return readThroughCache[key];
            }
            const storedValue = localStorage.getItem(key);
            if (storedValue !== null) {
                readThroughCache[key] = storedValue;
            }
            return storedValue;
        },
        write: function (key, value) {
            const serializedValue = String(value);
            readThroughCache[key] = serializedValue;
            localStorage.setItem(key, serializedValue);
        },
    };
})();

const cookieJar = (function () {
    return {
        read: function (key) {
            return document.cookie.split("; ").reduce((accumulator, cookiePair) => {
                const [cookieName, cookieValue] = cookiePair.split("=");
                return cookieName === key ? decodeURIComponent(cookieValue) : accumulator;
            }, "");
        },
        write: function (key, value, path = "/", expires = 1) {
            const parentCookieDomain = trackingConfig.resolveAnalyticsCookieDomain();
            document.cookie = `${key}=${encodeURIComponent(value)}; path=${path}; Domain=.${parentCookieDomain}; max-age=${expires * 31536000}`;
        },
    };
})();

export function readPersistedUserId() {
    let userId = localStorageMemo.read(trackingConfig.persistenceKeys.userId);
    let userIdFromCookie = cookieJar.read(trackingConfig.persistenceKeys.userId);
    if (userId && !userIdFromCookie) {
        cookieJar.write(trackingConfig.persistenceKeys.userId, userId);
    }
    return userId;
}

export function persistUserId(userid) {
    localStorageMemo.write(trackingConfig.persistenceKeys.userId, userid);
    cookieJar.write(trackingConfig.persistenceKeys.userId, userid);
}

export function ensureUserId(uIdParam) {
    function resolvePathDerivedUserIdPrefix() {
        try {
            const currentPath = window.location.pathname;
            if (currentPath.includes("thank-you")) {
                return "ty-";
            }
            return "";
        } catch {
            return "";
        }
    }

    function createRandomAlphanumericId(length) {
        let result = "";
        const randomIdAlphabet =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const alphabetLength = randomIdAlphabet.length;
        let counter = 0;
        while (counter < length) {
            result += randomIdAlphabet.charAt(
                Math.floor(Math.random() * alphabetLength),
            );
            counter += 1;
        }
        let prefix = resolvePathDerivedUserIdPrefix();
        return prefix + result;
    }

    let userid = readPersistedUserId();

    if (!userid) {
        userid =
            uIdParam || cookieJar.read(trackingConfig.persistenceKeys.userId) || createRandomAlphanumericId(15);
        persistUserId(userid);
    }

    return userid;
}
