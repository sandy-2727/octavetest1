import * as CONSTANTS from "./constants.js";

const ls = (function () {
    const store = Object.create(null);
    return {
        getItem: function (key) {
            if (key in store) {
                return store[key];
            }
            const value = localStorage.getItem(key);
            if (value !== null) {
                store[key] = value;
            }
            return value;
        },
        setItem: function (key, value) {
            const str = String(value);
            store[key] = str;
            localStorage.setItem(key, str);
        },
    };
})();

const cs = (function () {
    return {
        getItem: function (key) {
            return document.cookie.split("; ").reduce((acc, cookie) => {
                const [name, value] = cookie.split("=");
                return name === key ? decodeURIComponent(value) : acc;
            }, "");
        },
        setItem: function (key, value, path = "/", expires = 1) {
            const domain = CONSTANTS.getLanderDomain();
            document.cookie = `${key}=${encodeURIComponent(value)}; path=${path}; Domain=.${domain}; max-age=${expires * 31536000}`;
        },
    };
})();

export function getUserId() {
    let userId = ls.getItem(CONSTANTS.lskeys.userid);
    let userIdFromCookie = cs.getItem(CONSTANTS.lskeys.userid);
    if (userId && !userIdFromCookie) {
        cs.setItem(CONSTANTS.lskeys.userid, userId);
    }
    return userId;
}

export function setUserId(userid) {
    ls.setItem(CONSTANTS.lskeys.userid, userid);
    cs.setItem(CONSTANTS.lskeys.userid, userid);
}

export function generateUserID(uIdParam) {
    function getPrefix() {
        try {
            const pathname = window.location.pathname;
            if (pathname.includes("thank-you")) {
                return "ty-";
            }
            return "";
        } catch {
            return "";
        }
    }

    function makeid(length) {
        let result = "";
        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength),
            );
            counter += 1;
        }
        let prefix = getPrefix();
        return prefix + result;
    }

    let userid = getUserId();

    if (!userid) {
        userid =
            uIdParam || cs.getItem(CONSTANTS.lskeys.userid) || makeid(15);
        setUserId(userid);
    }

    return userid;
}
