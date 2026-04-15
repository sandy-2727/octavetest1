/**
 * Watches fragment files from html-includes.config.json (and the config file)
 * and runs html-includes.js on each save so index.html stays in sync.
 *
 * Usage:
 *   node scripts/html-includes-watch.js
 *   node scripts/html-includes-watch.js path/to/custom.config.json
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.join(__dirname, "..");
const INCLUDES_SCRIPT = path.join(__dirname, "html-includes.js");
const DEBOUNCE_MS = 150;

function runIncludes(configPathAbs) {
    const child = spawn(
        process.execPath,
        [INCLUDES_SCRIPT, configPathAbs],
        { cwd: ROOT, stdio: "inherit" }
    );
    child.on("exit", (code) => {
        if (code !== 0) {
            console.error(`html-includes exited with code ${code}`);
        }
    });
}

function main() {
    const configArg = process.argv[2];
    const configPathAbs = path.resolve(
        configArg ? process.cwd() : __dirname,
        configArg || "html-includes.config.json"
    );

    if (!fs.existsSync(configPathAbs)) {
        console.error("Config not found:", configPathAbs);
        process.exit(1);
    }

    const raw = fs.readFileSync(configPathAbs, "utf8");
    let config;
    try {
        config = JSON.parse(raw);
    } catch (e) {
        console.error("Invalid JSON in", configPathAbs, e.message);
        process.exit(1);
    }

    const components = config.components;
    if (!components || typeof components !== "object") {
        console.error('Config needs a "components" object.');
        process.exit(1);
    }

    const watchedPaths = [
        configPathAbs,
        ...Object.values(components).map((rel) => path.join(ROOT, rel)),
    ];

    let debounceTimer = null;
    const schedule = (label) => {
        if (label) {
            console.log(`\n[include:html:watch] ${label}`);
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            runIncludes(configPathAbs);
        }, DEBOUNCE_MS);
    };

    console.log(
        "[include:html:watch] Watching fragments (Ctrl+C to stop). Saving updates pages."
    );
    for (const p of watchedPaths) {
        const rel = path.relative(ROOT, p);
        if (!fs.existsSync(p)) {
            console.warn("  (missing)", rel);
        } else {
            console.log(" ", rel);
        }
    }

    runIncludes(configPathAbs);

    for (const p of watchedPaths) {
        if (!fs.existsSync(p)) continue;
        try {
            fs.watch(p, () => {
                schedule(path.relative(ROOT, p));
            });
        } catch (e) {
            console.error("Failed to watch", p, e.message);
            process.exit(1);
        }
    }
}

main();
