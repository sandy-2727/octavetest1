/**
 * Runs `npm run build` whenever a watched file under the repo is saved.
 * Ignores node_modules, .git, and webpack bundle output dirs so the watcher
 * does not loop on build artifacts.
 *
 * Usage:
 *   node scripts/build-watch.js
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.join(__dirname, "..");

const DEBOUNCE_MS = 400;

/** Relative paths (POSIX-style) that must not trigger rebuilds */
const IGNORE_PREFIXES = [
    "node_modules/",
    ".git/",
    "apps/asksmartai/js/",
    "apps/app-tasks/js/",
    "apps/app-dashboard/js/",
];

function shouldIgnore(relFromRoot) {
    if (!relFromRoot) return true;
    const norm = relFromRoot.split(path.sep).join("/");
    return IGNORE_PREFIXES.some((p) => {
        const dir = p.endsWith("/") ? p.slice(0, -1) : p;
        return norm === dir || norm.startsWith(p);
    });
}

function runBuild() {
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = spawn(npm, ["run", "build"], {
        cwd: ROOT,
        stdio: "inherit",
        env: process.env,
    });
    child.on("exit", (code) => {
        if (code !== 0) {
            console.error(`\n[build-watch] build exited with code ${code}`);
        } else {
            console.log("\n[build-watch] build finished.");
        }
    });
}

function main() {
    let debounceTimer = null;
    const schedule = (rel) => {
        console.log(`\n[build-watch] change: ${rel}`);
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            runBuild();
        }, DEBOUNCE_MS);
    };

    try {
        fs.watch(ROOT, { recursive: true }, (eventType, filename) => {
            if (!filename) return;
            const rel = path.normalize(filename);
            if (shouldIgnore(rel)) return;
            schedule(rel.split(path.sep).join("/"));
        });
    } catch (e) {
        console.error(
            "[build-watch] Recursive watch failed (needs a recent Node on macOS/Windows, or Linux with supported fs.watch recursive):",
            e.message
        );
        process.exit(1);
    }

    console.log(
        "[build-watch] Watching project (excluding node_modules, .git, apps/*/js bundles)."
    );
    console.log("[build-watch] Save any source file to run `npm run build`. Ctrl+C to stop.");
}

main();
