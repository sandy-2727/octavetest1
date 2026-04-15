const path = require("path");

const entry = "./apps/tracking/trackingInit.js";
const filename = "tracking.js";

const landerOutputDirs = [
    "apps/asksmartai/js",
    "apps/app-tasks/js",
    "apps/app-dashboard/js",
];

module.exports = landerOutputDirs.map((dir) => ({
    mode: "production",
    context: path.resolve(__dirname),
    entry,
    output: {
        filename,
        path: path.resolve(__dirname, dir),
        clean: false,
    },
    optimization: {
        minimize: true,
    },
}));
