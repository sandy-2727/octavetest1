import * as trackingConfig from "./constants.js";
import { ensureUserId } from "./identity.js";
import { emitTrackedEvent } from "./trackingInfo.js";

function bootstrapTracking() {
    ensureUserId();
    void emitTrackedEvent(trackingConfig.trackedEventNames.landerLoaded);

    document.addEventListener("click", (event) => {
        const clickTarget = event.target.closest(
            "." + trackingConfig.trackingDomClasses.primaryClickTarget,
        );
        if (!clickTarget) return;
        const labelFromDom = clickTarget.getAttribute("btn-text");
        const positionFromDom = clickTarget.getAttribute("btn-position");
        const extraDimensions = {};
        if (labelFromDom != null && labelFromDom !== "") {
            extraDimensions[trackingConfig.payloadDimensionKeys.buttonText] = labelFromDom;
        }
        if (positionFromDom != null && positionFromDom !== "") {
            extraDimensions[trackingConfig.payloadDimensionKeys.buttonPosition] = positionFromDom;
        }
        void emitTrackedEvent(trackingConfig.trackedEventNames.buttonClicked, extraDimensions);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapTracking);
} else {
    bootstrapTracking();
}
