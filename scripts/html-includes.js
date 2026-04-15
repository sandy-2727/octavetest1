/**
 * HTML static includes: replaces paired markers in page HTML with fragment files.
 *
 * Fragment files (e.g. apps/.../components/header.html) are the source of truth.
 * The markup between <!-- @include-name --> and <!-- /@include-name --> in each
 * page is overwritten from the fragment when you run this script. Editing a
 * fragment alone does not change pages until you run:
 *   npm run include:html
 * or npm run include:html:watch (fragments only), or npm run build / build:watch.
 *
 * In any listed HTML file, add:
 *   <!-- @include-<name> optional-attrs -->
 *   <!-- /@include-<name> -->
 * where <name> is a key under "components" in html-includes.config.json
 * (value = path to fragment HTML, relative to repo root).
 *
 * Optional attrs on the opening line are merged into the fragment as
 * {{placeholder}} replacements (see optional "includeDefaults" per component
 * in the config for values not overridden in the comment).
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
        `(<!--\\s*@include-${k}(?:\\s+[^>]*?)?\\s*-->)([\\s\\S]*?)(<!--\\s*/@include-${k}\\s*-->)`
    );
}

function parseIncludeAttrs(attrString) {
    const out = {};
    if (!attrString || !String(attrString).trim()) return out;
    const re = /([\w-]+)=("[^"]*"|'[^']*'|\S+)/g;
    let m;
    while ((m = re.exec(attrString))) {
        let v = m[2];
        if (
            (v.startsWith('"') && v.endsWith('"')) ||
            (v.startsWith("'") && v.endsWith("'"))
        ) {
            v = v.slice(1, -1);
        }
        out[m[1]] = v;
    }
    return out;
}

function parseOpeningAttrs(openingComment, key) {
    const k = escapeRegExp(key);
    const innerRe = new RegExp(
        `^<!--\\s*@include-${k}\\s*(.*?)\\s*-->$`,
        "s"
    );
    const m = String(openingComment).trim().match(innerRe);
    return m ? parseIncludeAttrs(m[1]) : {};
}

function interpolateFragment(template, vars) {
    return template.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_, name) =>
        vars[name] != null ? String(vars[name]) : ""
    );
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

        const includeDefaults = config.includeDefaults || {};

        for (const [key, fragment] of Object.entries(fragmentByKey)) {
            const re = pairRegex(key);
            const m = html.match(re);
            if (!m) continue;

            const opening = m[1];
            const innerRaw = m[2];
            const closing = m[3];
            const inner = innerRaw
                .replace(/^\r?\n/, "")
                .replace(/\r?\n$/, "")
                .trimEnd();
            const normalizedInner = inner.replace(/\r\n/g, "\n");

            const parsedAttrs = parseOpeningAttrs(opening, key);
            const defaults = includeDefaults[key] || {};
            const merged = { ...defaults, ...parsedAttrs };
            const rendered = interpolateFragment(fragment, merged).replace(
                /\r\n/g,
                "\n"
            );
            const fragNorm = rendered.trimEnd();

            if (normalizedInner === fragNorm) {
                console.log("Up to date", rel, key);
                continue;
            }

            const replacement = `${opening}\n${rendered}\n${closing}`;
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
            return Object.keys(components).some((k) =>
                pairRegex(k).test(h)
            );
        });
        if (!hadAnyMarker) {
            console.warn(
                "No include markers matched any component key in configured pages."
            );
        }
    }
}

main();
