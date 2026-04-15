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
│   │   └── styles/
│   │       └── base.css           # Shared design tokens & primitives
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

## Adding a new app

1. Create `apps/app-<name>/` with `index.html`, `style.css`, `script.js`, and `components/` as needed.
2. In `index.html`, link `../common/styles/base.css`, then `./style.css`; load `./script.js` as `<script type="module">`.
3. In `script.js`, import `trackEvent` from `../common/tracking/tracker.js` and emit `page_view` plus any user-action events you care about.

No bundler is required; the browser resolves modules directly over HTTP.
