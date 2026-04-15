/**
 * HTML static includes: replaces paired markers in page HTML with fragment files.
 *
 * In any listed HTML file, add:
 *   <!-- @include-<name> -->
 *   <!-- /@include-<name> -->
 * where <name> is a key under "components" in html-includes.config.json
 * (value = path to fragment HTML, relative to repo root).
 *
 * Add new fragments by extending "components" and placing the marker pair in pages.
 * Add pages with glob patterns, e.g. "apps/asksmartai/legal/*.html".
 *
 * Usage:
 *   node scripts/html-includes.js
 *   node scripts/html-includes.js path/to/custom.config.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function globToRegex(pattern) {
    let re = "";
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i];
        if (c === "*") re += ".*";
        else if (".+^${}()|[]\\".includes(c)) re += "\\" + c;
        else re += c;
    }
    return new RegExp("^" + re + "$");
}

function expandPageEntry(entry) {
    const abs = path.join(ROOT, entry);
    if (!entry.includes("*")) {
        return fs.existsSync(abs) ? [abs] : [];
    }
    const dir = path.dirname(abs);
    const base = path.basename(entry);
    if (!fs.existsSync(dir)) return [];
    const rx = globToRegex(base);
    return fs
        .readdirSync(dir)
        .filter((name) => rx.test(name))
        .map((name) => path.join(dir, name));
}

function pairRegex(key) {
    const k = escapeRegExp(key);
    return new RegExp(
        `<!--\\s*@include-${k}\\s*-->[\\s\\S]*?<!--\\s*/@include-${k}\\s*-->`
    );
}

function extractInner(full, key) {
    const k = escapeRegExp(key);
    const innerRe = new RegExp(
        `^<!--\\s*@include-${k}\\s*-->([\\s\\S]*?)<!--\\s*/@include-${k}\\s*-->$`
    );
    const m = full.match(innerRe);
    return m ? m[1].replace(/^\r?\n/, "").replace(/\r?\n$/, "").trimEnd() : null;
}

function main() {
    const configArg = process.argv[2];
    const configPath = configArg
        ? path.resolve(process.cwd(), configArg)
        : path.join(__dirname, "html-includes.config.json");

    if (!fs.existsSync(configPath)) {
        console.error("Config not found:", configPath);
        process.exit(1);
    }

    const raw = fs.readFileSync(configPath, "utf8");
    let config;
    try {
        config = JSON.parse(raw);
    } catch (e) {
        console.error("Invalid JSON in", configPath, e.message);
        process.exit(1);
    }

    const components = config.components;
    const pages = config.pages;

    if (!components || typeof components !== "object") {
        console.error('Config needs a "components" object (name -> fragment path).');
        process.exit(1);
    }
    if (!Array.isArray(pages) || pages.length === 0) {
        console.error('Config needs a non-empty "pages" array.');
        process.exit(1);
    }

    const pagePaths = [...new Set(pages.flatMap(expandPageEntry))].sort();
    if (pagePaths.length === 0) {
        console.error("No page files matched.");
        process.exit(1);
    }

    const fragmentByKey = {};
    for (const [key, rel] of Object.entries(components)) {
        const fp = path.join(ROOT, rel);
        if (!fs.existsSync(fp)) {
            console.error("Missing fragment for", key, ":", fp);
            process.exit(1);
        }
        fragmentByKey[key] = fs.readFileSync(fp, "utf8").trimEnd();
    }

    let anyChange = false;
    for (const filePath of pagePaths) {
        let html = fs.readFileSync(filePath, "utf8");
        const originalHtml = html;
        const rel = path.relative(ROOT, filePath);

        for (const [key, fragment] of Object.entries(fragmentByKey)) {
            const re = pairRegex(key);
            const m = html.match(re);
            if (!m) continue;

            const inner = extractInner(m[0], key);
            const normalized =
                inner == null ? null : inner.replace(/\r\n/g, "\n");
            const fragNorm = fragment.replace(/\r\n/g, "\n");

            const start = `<!-- @include-${key} -->`;
            const end = `<!-- /@include-${key} -->`;
            const replacement = `${start}\n${fragment}\n${end}`;

            if (normalized === fragNorm) {
                console.log("Up to date", rel, key);
                continue;
            }

            html = html.replace(re, replacement);
            anyChange = true;
            console.log("Updated", rel, key);
        }

        if (html !== originalHtml) {
            fs.writeFileSync(filePath, html, "utf8");
        }
    }

    if (!anyChange && pagePaths.length > 0) {
        const hadAnyMarker = pagePaths.some((fp) => {
            const h = fs.readFileSync(fp, "utf8");
            return Object.keys(components).some((k) => pairRegex(k).test(h));
        });
        if (!hadAnyMarker) {
            console.warn(
                "No include markers matched any component key in configured pages."
            );
        }
    }
}

main();
