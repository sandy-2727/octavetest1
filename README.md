# Octave — modular static frontends

This workspace is a **plain HTML, CSS, and vanilla JavaScript** layout: multiple **independent** mini-apps under `apps/`, with **common** utilities, styles, and a **singleton** event tracker under `apps/common/`.

ES modules (`import` / `export`) are used everywhere. Browsers enforce same-origin rules for modules, so you should **not** open `index.html` directly from the filesystem (`file://`). Use a **simple local HTTP server** from this folder instead.

## Folder structure

```text
octave/
├── README.md
├── apps/
│   ├── common/                    # Cross-app code (tracking, styles, utils)
│   │   ├── tracking/
│   │   │   └── tracker.js         # Singleton tracker + trackEvent()
│   │   ├── utils/
│   │   │   └── helpers.js         # Optional shared helpers
│   │   ├── styles/
│   │   │   └── base.css           # Shared design tokens & primitives
│   │   └── components/            # Optional: shared HTML fragments for includes (see below)
│   │       └── example.html
│   ├── app-dashboard/
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── script.js
│   │   └── components/
│   │       └── MetricCard.js
│   └── app-tasks/
│       ├── index.html
│       ├── style.css
│       ├── script.js
│       └── components/
│           └── TaskItem.js
```

### Naming conventions

- **Apps**: `app-<short-name>` (kebab-case), each with the same file set: `index.html`, `style.css`, `script.js`, `components/`.
- **Common**: `apps/common/<area>/` with descriptive file names (`tracker.js`, `base.css`).
- **Imports**: from an app, common modules are reached with relative paths such as `../common/tracking/tracker.js`.

## Build

From the **repository root**, install dev dependencies once (webpack and the HTML include script):

```bash
npm install
```

**One-off build** — expands HTML includes, then runs webpack (bundles shared tracking init into each app’s `js/` output):

```bash
npm run build
```

**Watch mode** — runs the same build whenever watched source files change (debounced; ignores `node_modules`, `.git`, and bundle output folders):

```bash
npm run build:watch
```

## Running locally

From the **repository root** (`octave/`), start any static server. Examples:

```bash
# Python 3
python3 -m http.server 8080

# Node (npx, no install)
npx --yes serve -l 8080 .
```

Then open in the browser (adjust host/port if needed):

- Dashboard demo: `http://localhost:8080/apps/app-dashboard/`
- Tasks demo: `http://localhost:8080/apps/app-tasks/`

Open DevTools → **Console** to see `[tracking]` logs when pages load and when you use buttons or task checkboxes.

## Shared tracking (`apps/common/tracking/tracker.js`)

- **`trackEvent(eventName, payload?)`** — main API; logs a structured object to the console (simulated analytics).
- **`getTracker()`** / **`default` export** — access the **same singleton** instance everywhere (history buffer, enable flag).

Each sample app calls `trackEvent` on **page load** (`page_view`) and on **button** interactions (`button_click` or domain-specific names like `task_toggle`).

## Shared styles (`apps/common/styles/base.css`)

Contains CSS variables (colors, radius, shadow), a light page background, and utility classes such as `.octave-shell`, `.octave-card`, and `.octave-btn`. Each app links this file first, then its own `style.css` for layout and app-specific rules.

## Adding shared components

### HTML fragments (static includes)

Reusable markup is stored in **fragment** files and merged into listed HTML pages by `scripts/html-includes.js` (via `npm run include:html` or `npm run build`). Fragments can live under `apps/common/components/` for cross-app reuse, or under a specific app’s `components/` if only that app needs them.

1. **Create the fragment** — plain HTML, optionally with `{{placeholder}}` tokens. Values come from attributes on the opening include comment and from optional defaults (see step 3).
2. **Register the fragment** — in `scripts/html-includes.config.json`, add a key under `"components"` whose value is the path to the fragment **relative to the repo root** (for example `"banner": "apps/common/components/banner.html"`).
3. **Optional defaults** — under `"includeDefaults"`, add an object for the same key with default placeholder values when you do not pass them on the include line.
4. **Wire the page** — in each HTML file that should receive the fragment, add a marker pair (the key after `@include-` must match the config key):

   ```html
   <!-- @include-banner title="Hello" -->
   <!-- /@include-banner -->
   ```

   Anything between the markers is **replaced** by the rendered fragment when you run the include script.

5. **List the page** — ensure that HTML file appears in the `"pages"` array in `html-includes.config.json` (exact path or a glob such as `apps/myapp/legal/*.html`).
6. **Apply changes** — run `npm run include:html`, or `npm run build` / `npm run build:watch` so the markers are expanded from the fragment files.

Editing a fragment alone does not update pages until one of those commands runs.

### JavaScript modules (shared UI logic)

For reusable **ES module** components (classes or functions used by multiple apps), add files under `apps/common/` (for example `apps/common/components/MyWidget.js`). Export your API from that module, then in each app’s `script.js` (or another module) import with a relative path such as `../common/components/MyWidget.js`. Keep the same-origin rule in mind: serve the repo over HTTP, not `file://`.

## Adding a new app

1. Create `apps/app-<name>/` with `index.html`, `style.css`, `script.js`, and `components/` as needed.
2. In `index.html`, link `../common/styles/base.css`, then `./style.css`; load `./script.js` as `<script type="module">`.
3. In `script.js`, import `trackEvent` from `../common/tracking/tracker.js` and emit `page_view` plus any user-action events you care about.
4. If the app uses **HTML includes**, add its HTML paths to `"pages"` in `scripts/html-includes.config.json` and add `<!-- @include-... -->` marker pairs where needed (see [Adding shared components](#adding-shared-components)).

No bundler is required for in-browser ES modules; the browser resolves them directly over HTTP. The `npm run build` step is still used when an app participates in the HTML-include pipeline or the shared webpack bundle for tracking.

