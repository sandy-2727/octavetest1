import * as CONSTANTS from "./constants.js";
import { generateUserID } from "./identity.js";
import { fireEvent } from "./tracker.js";

function init() {
    generateUserID();
    void fireEvent(CONSTANTS.eventNames.lpld);

    document.addEventListener("click", (event) => {
        const btn = event.target.closest(
            "." + CONSTANTS.classNames.buttonClassName,
        );
        if (!btn) return;
        const text = btn.getAttribute("btn-text");
        const position = btn.getAttribute("btn-position");
        const params = {};
        if (text != null && text !== "") {
            params[CONSTANTS.eventDimensions.btn_text] = text;
        }
        if (position != null && position !== "") {
            params[CONSTANTS.eventDimensions.btn_position] = position;
        }
        void fireEvent(CONSTANTS.eventNames.btnClkd, params);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
