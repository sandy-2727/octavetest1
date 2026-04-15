const path = require("path");

module.exports = {
    mode: "production",
    context: path.resolve(__dirname),
    entry: "./apps/asksmartai/src/lander-entry.js",
    output: {
        filename: "lander.bundle.js",
        path: path.resolve(__dirname, "apps/asksmartai/js"),
        clean: false,
    },
    optimization: {
        minimize: true,
    },
};
