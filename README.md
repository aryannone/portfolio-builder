# PortfolioVerse

A portfolio-website builder that runs entirely in your browser. Fill in your details, pick one of eight templates, click things in the live preview to edit them, open the real HTML/CSS/JS if you want to, and download a standalone website you own and can host anywhere.

- **No account, no backend, no install.** Open `index.html` (works straight from `file://`).
- **Your work stays on your device**, saved automatically in the browser's IndexedDB.
- **The output is a normal website**: one HTML file (or a ZIP with an `assets/` folder). It does not depend on PortfolioVerse.

---

## Put it on GitHub (flat folder: no folders needed)

GitHub's web uploader (especially on a phone) flattens folders, so this repository is organised as **one flat folder**. Everything sits next to each other and the file names do not collide:

| File(s) | What it is |
|---|---|
| `index.html` | **The finished app (generated).** GitHub Pages serves this file. |
| `shell.html` | The page template the build fills in (this was `src/index.html`; renamed so it can't collide with `index.html`). |
| `01-core.js` … `13-main.js` | The application logic, in build order. **Edit these.** |
| `app.css` | Builder interface styles. |
| `base.css`, `skins.css`, `site.js`, `bridge.js` | Code that ships *inside* generated portfolios (`bridge.js` is preview-only). |
| `build.py` | Combines everything into `index.html`. |
| `e2e*.py`, `h.py` | Automated browser tests. |

1. **Publish for free:** repository *Settings → Pages → Deploy from branch → main / (root)*. The builder is then live at `https://<user>.github.io/<repo>/`.
2. **Change something:** edit a `.js`/`.css` file (GitHub's pencil icon works on a phone), then run `python3 build.py` on a computer and upload the regenerated `index.html`. Never edit `index.html` by hand; the build overwrites it.
3. **Sample content** (the placeholder name Aryan Singh, projects, etc.) is one function: `sampleContent()` in `01-core.js`.
4. `build.py` also accepts the nested layout (`src/js/`, `src/site/`, `src/app.css`, `src/index.html`, output `dist/index.html`), so you can reorganise later.

Always test the built app over http (for example `python3 -m http.server`) as well as by double-clicking it; some bugs only appear over http.

---

## Contents

1. [Quick start](#1-quick-start)
2. [Important: how this differs from the original brief](#2-important-how-this-differs-from-the-original-brief)
3. [Features](#3-features)
4. [The workflow and navigation](#4-the-workflow-and-navigation)
5. [Editing modes](#5-editing-modes)
6. [Templates and design systems](#6-templates-and-design-systems)
7. [Make It Yours](#7-make-it-yours)
8. [Exporting your website](#8-exporting-your-website)
9. [Saving, projects, undo/redo](#9-saving-projects-undoredo)
10. [Mobile and responsive behaviour](#10-mobile-and-responsive-behaviour)
11. [Architecture](#11-architecture)
12. [Data model](#12-data-model)
13. [Security model](#13-security-model)
14. [Building from source](#14-building-from-source)
15. [Testing](#15-testing)
16. [Extending PortfolioVerse](#16-extending-portfolioverse)
17. [Known limitations](#17-known-limitations)
18. [Troubleshooting / FAQ](#18-troubleshooting--faq)
19. [Project layout](#19-project-layout)

---

## 1. Quick start

**Use it**

1. Open `index.html` in a current Chrome, Edge, Firefox or Safari.
2. Click **Start building** and follow the steps: Style → Template → You → Sections → Customize → Edit → Code → Export.
3. On the last screen click **Download HTML**. Open the downloaded file, or upload it to any static host (Netlify, GitHub Pages, Cloudflare Pages, your own server).

**Hosting the builder itself** is optional. It is a single static file; `file://` works, and so does any web server.

**Requirements:** a modern browser with IndexedDB and `<iframe sandbox>` support. Internet access is only needed for Google Fonts (see [limitations](#17-known-limitations)); everything else works offline.

---

## 2. Important: how this differs from the original brief

Read this first so there are no surprises.

| Brief asked for | What was built | Why |
|---|---|---|
| React + TypeScript + Vite + Tailwind | Dependency-free vanilla JavaScript, modular source, bundled to one `index.html` by `build.py` | The build environment had no network access, so packages could not be installed. |
| Monaco Editor | A custom editor: textarea + syntax-highlight overlay, line numbers, Tab indentation | Same reason. It is a capable editor but not Monaco (no IntelliSense, minimap or multi-cursor). |
| Lucide icons, animation library | Small inline SVG icon set; CSS and a few lines of JS for animation | Same reason. |
| Optional AI for Make It Yours | Deterministic engine, no AI | Required by the brief ("works without an AI API"). The engine is structured so an AI could plug in later (see [section 7](#7-make-it-yours)). |
| Bundle fonts where practical | Fonts are **not** bundled; they load from Google Fonts when online and fall back to system fonts offline | Font files could not be downloaded. The export screen states this plainly and has a switch to disable web fonts. |
| Project identifiable from URL | The URL stores the screen, not the project id; the last-opened project is restored from local storage | Keeps the router simple. |

Everything else in the brief (the three editing modes, click-to-edit, Make It Yours, standalone export, shared data model, persistence, undo/redo, back buttons, mobile layout) is implemented. See [Testing](#15-testing) for what was and was not verified.

---

## 3. Features

### Content
- Personal details, profile image, social links, footer text.
- 17 section types: Hero, About, Skills, Projects / case studies, Experience, Education, Achievements, Certifications, Testimonials, Publications, Research, Services, Blog posts, Hobbies, Résumé, Contact, Custom.
- Add, edit, delete, **duplicate**, **reorder** and **hide** sections; add, edit, delete, duplicate and reorder items inside them. Unlimited items (tested with 33 projects).
- **Empty sections are skipped automatically** in the preview and the export, and the UI marks them "empty · not shown".
- Image upload (resized and compressed in the browser) or paste a link; PDF upload for the résumé.
- URL validation everywhere: `javascript:`, `data:` and malformed links are flagged in the form and never written into the site (they become `#`).

### Design
- **Minimal** and **Maximal** design systems, four templates each (see [section 6](#6-templates-and-design-systems)).
- Switch template or system at any time; **content is never touched**.
- Colours (7 roles + palette presets), typography (heading/body font, size, weight, line height, letter spacing, tracking, case), layout (spacing, width, columns, hero layout, image side, navigation, card style, section headings, section backgrounds), components (buttons, cards, nav links, dividers, image borders, shadows), backgrounds and decoration (blobs, grain, grid floor, sun, scanlines, shapes, stripes, cursor glow).
- Motion: entrance (fade, slide, scale, reveal), stagger, duration, intensity, hover effects, marquee, typewriter, parallax, scroll progress bar. Everything is switched off for visitors who prefer reduced motion.

### Editing
- **Visual:** forms + controls + click-to-edit in the preview.
- **Code:** edit the real generated HTML, CSS and JavaScript.
- **Live preview:** desktop / tablet / mobile / full screen / open in a new tab, in a sandbox.

### Output
- **Before you publish** checklist on the Export screen: flags leftover sample content, missing contact details or projects, images without descriptions, a missing page description, hand-edited code and online dependencies.
- Standalone HTML download, copy HTML / CSS / JS, ZIP with an assets folder, project JSON export and import.
- SEO and sharing metadata, Open Graph tags, JSON-LD, favicon, skip link, landmarks, ARIA labels.

---

## 4. The workflow and navigation

The app is a guided flow with eight steps. A step indicator at the top shows where you are (and lets you jump to earlier steps).

| # | Screen | Route | What happens |
|---|---|---|---|
| – | Landing | `#/` | Start, browse templates, open saved portfolios. |
| 1 | Style | `#/new/system` | Choose Minimal or Maximal and name the project. The project is created when you continue. |
| 2 | Template | `#/new/template` | Live thumbnails, filter, preview, favourite, pick. |
| 3 | You | `#/new/info` | Personal details, hero statement, bio, links, with a live preview beside the form. |
| 4 | Sections | `#/new/sections` | Choose, order, hide, duplicate and add sections. |
| 5 | Customize | `#/new/customize` | Colours, type, layout, motion and Make It Yours with a live preview. |
| 6 | Edit | `#/editor` | The full visual editor with click-to-edit. |
| 7 | Code | `#/editor/code` | HTML / CSS / JS editor next to the preview. |
| 8 | Export | `#/editor/export` | Downloads, dependency report, SEO, versions. |
| – | Template gallery | `#/gallery` | Browse and apply templates any time. |
| – | Portfolios | `#/projects` | Open, rename, duplicate, delete, import. |

### Back, Next and consistency
- Every screen has a **Back** button in the same place (top-left of the app bar). It is disabled only on the landing page, where there is nothing before it.
- Wizard steps (1–4) also have a **Back / Continue** bar at the bottom. Workspace steps (5–8) have **Next** at the top right (labelled with the destination, e.g. "Code", "Export").
- Back goes to the previous screen in your history; if the page was opened directly on a deep screen, it falls back to the logical previous step.
- Going back or forward never resets anything: the project, selected template, design settings and edits live in one central store, not in the screens.

### One central router
All navigation goes through a single hash router (`src/js/06-router.js`):
- Browser **Back and Forward** behave sensibly, including on phones (the Android back gesture closes an open bottom sheet before leaving the screen).
- **Guards:** leaving the Code editor with edits you haven't applied asks for confirmation. This also applies to the browser's Back button (the navigation is reverted if you choose "Stay here"). If a save has failed, leaving also asks.
- If the browser's History API is unavailable (sandboxed viewers), the router switches to an **in-memory history** with identical Back/Forward behaviour; only the address bar stops updating.
- Pending autosaves are flushed before you leave a screen, so navigating cannot lose or duplicate saves.
- Navigation never regenerates over manual code edits; those live in the project as overrides until you explicitly restore the generated version.
- Dialogs always have **Cancel** (and a **Back** button when they are a step in a longer flow).

---

## 5. Editing modes

### Mode A: Visual editing
- **Content panel** (left): every field of every section, as forms. Sections and items are collapsible. Selecting something in the preview opens and highlights the matching fields.
- **Design / Motion panels:** all the design controls.
- **Click-to-edit** in the preview (details below).

### Click-to-edit
Click anything in the preview:

| You click | You can change |
|---|---|
| A heading or paragraph | Its text, font, size, weight, colour, alignment, letter spacing, line height |
| A button | Text, destination link (validated), background, text colour, corner radius, size, hover animation |
| A project / item card | Every field of that item (title, description, image, link, tags …), card layout (standard / image beside / featured), hover effect, background, radius; move, duplicate, delete |
| An image | Upload or link, description (alt text), corner radius, border style |
| A section | Title, background, spacing, content layout, animation; move, hide, duplicate, delete |
| The navigation | Layout and link style |

- A selection outline appears, with a small floating toolbar (edit, settings, select parent, move, duplicate, hide, delete, deselect). The right sidebar shows the detailed controls. On phones the toolbar docks at the bottom and the settings open in a bottom sheet.
- **Double-click text** to type directly in place; press Enter to commit, Esc to cancel.
- Select the parent from the toolbar or the breadcrumb at the top of the sidebar. Press Esc to deselect.

**This is real editing, not a DOM trick.** Every editable element carries a stable path to the data model (for example `person/name`, `s/<sectionId>/i/<itemId>/title`). Edits write to that record, the portfolio re-renders from the data, and the change is saved, undoable and persists after a refresh. Per-element styling is stored in the design configuration, keyed by the same path.

### Mode B: Code editing
The **Code** step shows the code that is actually generated and exported:
- **HTML** (the page body), **CSS** (design tokens as CSS variables + component styles + your overrides), **JavaScript** (a small, commented runtime with a `CFG` object you can tweak), and a read-only **Full file** tab showing the final document.
- Edits apply to the preview live after a short pause (switch "Live preview" off to apply manually with **Apply**). Runtime errors from your script show in the console strip.
- Edited tabs get an amber dot. They are used **as written** in the preview and the export.
- **Restore** brings back the generated version of one tab (or all of them) after a confirmation, and can be undone.

**The limitation, stated plainly:** the visual editor cannot translate arbitrary hand-edited code back into form fields. While a tab is manually edited, visual changes that would affect that tab do not appear in it. The editor tells you this on the Code and Export screens. While HTML is manual, click-to-edit pauses (the preview explains why). Restore the generated version to return to fully visual editing.

### Mode C: Live preview
- Desktop (1280 px), Tablet (820 px) and Mobile (390 px) views, scaled to fit; on a real phone the preview uses the screen width directly.
- Full screen (Esc to exit), replay animations, and open in a new tab.
- The portfolio is rendered in a **sandboxed iframe** in all of these, including the new tab (see [Security](#13-security-model)).

---

## 6. Templates and design systems

Eight templates. Each has its own typography, palette, hero composition, navigation, card style, section headings, decoration and CSS "skin". They are not recolours of one layout.

### Minimal
| Template | Character |
|---|---|
| **Editorial** | Magazine index: large serif name, ruled two-column hero, side-set section titles, project list like a table of contents. |
| **Developer** | Dark, monospace details, terminal-window hero with a typed title, `// comment` headings, bordered cards. |
| **Professional** | Light corporate: split hero with portrait, tinted bands, soft cards, vertical experience timeline. |
| **Creative Minimal** | Airy, centred hero, hidden full-screen menu, offset project cards, parallax. |

### Maximal
| Template | Character |
|---|---|
| **Brutalist** | Thick black borders, hard shadows, oversized uppercase type, tilted cards, hazard-stripe edge, marquee. |
| **Neo-Experimental** | Night gradient with blobs and grain, overlapping oversized gradient name and portrait, floating pill navigation, glass cards. |
| **Retro-Futuristic** | Synthwave: sun on the horizon, perspective grid floor, scanlines, vertical HUD side rail, angled-corner cards. |
| **Digital Playground** | Sticker-book: bouncing letters, tilted coloured cards, floating shapes that follow the pointer, dock navigation, marquee. |

### How templates are built
A template is a set of design tokens plus a choice of **variants**:
- navigation: `top`, `side`, `floating`, `dock`, `minimal`
- hero: `index`, `terminal`, `split`, `stack`, `big`, `overlap`, `sticker`
- cards: `list`, `grid`, `overlay`, `offset`, `brutal`, `sticker`
- section headings: `side`, `inline`, `code`, `huge`
- decoration, backgrounds, motion

Any variant works under any template, so mixing is safe, and a template switch can never "lose" a component: every section type renders under every variant. Unknown section types fall back to the generic card renderer.

### Gallery
Browse all templates with live thumbnails (using **your** content), filter by Minimal / Maximal / Favourites (★ saved locally), preview full size, switch, or **Duplicate design** (creates a copy of your project using that template).

---

## 7. Make It Yours

Open it from the lime **Make it yours** button (desktop header) or the **Make it yours** tab / floating button (mobile).

**Presets:** More Professional, Creative, Minimal, Experimental, Colorful, Elegant, Futuristic, Editorial, Playful, Bold.
**Custom:** describe the look in words, for example:
> futuristic digital playground with bold typography, neon accents, asymmetric project cards and smooth scroll animations

What you get:
1. **Three variations**, generated deterministically. Your current design is untouched.
2. The first variation is shown in the live preview straight away; thumbnails of all three plus your current design appear in the panel.
3. **Compare side by side** (desktop), switch between options, **Apply** one, **Discard** all, or **More options** for other variations.
4. After applying, **Undo** restores your previous design exactly.
   **Not ready to apply a design, but want to keep it?** Press **Save as new portfolio** to store the selected option as its own portfolio (your content is copied, your current portfolio is untouched), or **Save all 3** to keep every option. They appear under *⋯ → All portfolios* and open and edit like any other project.
5. If the text maps to nothing the engine supports, it says so and offers presets instead.

**What can change:** palette, typography, spacing, layout, project-card style, navigation, hero composition, section headings, animation, background and decoration, and the template skin.
**What never changes:** name, biography, project text, education, experience, contact details, social links, uploaded images. Variations are design objects only; the content model is not even passed to the engine. (Your per-element style tweaks are also kept.)

**How it works** (`src/js/04-variations.js`): presets are lists of recipes; free text is matched against a keyword table (mood, colour words, fonts, layout words, navigation words, animation words, decoration words); recipes are applied to a copy of the current design, and the result goes through `validateDesign()`, which clamps numbers and whitelists every token. There is no fake progress indicator, since generation is instant.

**Future AI:** an LLM could return the same recipe shape as structured JSON (never code), and `validateDesign()` already acts as the safety gate.

---

## 8. Exporting your website

On the **Export** screen:

| Button | Result |
|---|---|
| **Download HTML** | `yourname.html`: complete document with semantic HTML, embedded CSS and JS, content, responsive styles, animations, navigation, metadata. Uploaded images are embedded. |
| **Copy HTML / CSS / JavaScript** | To the clipboard (complete document, or just the stylesheet or script). |
| **ZIP with assets folder** | `index.html` + `assets/` (images as real files) + a short README. Best for image-heavy portfolios. |
| **Project JSON** | Your whole project (content, design, code overrides, uploaded assets) to re-import later or move to another browser. |
| **Open in new tab** | The current state in a sandboxed tab. |

### The file contains
`<title>`, description, theme colour, Open Graph and Twitter-card tags, an optional canonical URL, JSON-LD (`Person`), an SVG favicon (letters + colour, configurable), `lang`, a skip link, landmarks (`header`, `nav`, `main`, `section`, `footer`), labelled controls, and keyboard-operable menus. The contact form opens the visitor's mail app (`mailto:`), so it works with no server.

### Honest dependency report
The export screen computes what the file actually depends on and never claims more than is true:
- **Google Fonts**: requested via a `<link>` when enabled (uncheck the box for system fonts only). Offline the site still works with fallback fonts.
- **Externally hosted images** you pasted as links: counted and flagged; they need the internet and must stay online.
- **File size**, including embedded uploads. A warning appears above ~1.5 MB and a stronger one above ~5 MB, recommending the ZIP.
- It says "Fully self-contained" only when nothing remote is referenced.

### Exports match what you see
The export is assembled by the same function as the preview, from the current model **plus any manual code overrides**. There is no separate "export state" that can go stale. The screen lists which sections are **included** and which are **excluded** (hidden or empty) and warns when manual edits are included.

### Hosting
Upload the HTML file (or the unzipped folder) to any static host. No build step, server or database is needed.

---

## 9. Saving, projects, undo/redo

- **Autosave** about 0.6 s after each change, plus on tab hide. The badge shows **Saved / Saving… / Unsaved / Not saved / Paused / Session only**. "Saved" is shown only after the write has actually succeeded; a screen-reader-only status region announces "All changes saved".
- **If a save fails** (storage full or blocked) a red alert banner explains it, the badge says **Not saved**, and the banner offers **Try again** and **Download backup (JSON)** so nothing is lost.
- **Two tabs / windows:** before every save the app checks that nobody else changed the project. If another tab did, autosave **pauses** and a banner offers **Load the latest version**, **Keep my version** (deliberately overwrite) or **Download my copy**. Nothing is overwritten silently.
- Storage is **IndexedDB**. If that is blocked it falls back to localStorage, then to **memory only**: the badge reads **Session only**, a banner explains, and closing the tab asks for confirmation.
- **Unreadable saved projects** are never silently dropped: the Portfolios screen lists them with a **Download** button for the raw data.
- **Multiple projects:** open, rename, duplicate, delete (with confirmation). **Import** validates and repairs every file (see Security); invalid files are rejected with a message and change nothing.
- **Undo / redo** (header buttons, Ctrl/⌘+Z, Ctrl/⌘+Shift+Z or Ctrl+Y) covers content, structure, design, element/section styles, Make It Yours applications, code overrides and restores. History holds up to 120 steps for the session (it resets on reload).
- **Named versions** (Export screen) save content + design + code snapshots you can restore later.
- The browser warns before closing the tab if a save is pending, failed, paused, or storage is memory-only.

## 10. Mobile and responsive behaviour

The app is designed for phones as well as desktops (tested down to 360 px wide, in portrait and landscape).

- **App bar:** Back button, current screen title and step, and the main action; secondary actions move into a menu.
- **Bottom navigation** in the editor: Preview · Content · Design · Code · Export.
- **Side panels become bottom sheets** with a close button; the preview shrinks to stay visible above the sheet. The settings for a selected element open in a sheet too.
- Selecting an element shows a compact toolbar docked above the bottom navigation; tap the settings icon for details.
- **Make it yours** is a lime button in the preview toolbar (it used to float over the preview and covered the portfolio's own menu button).
- The Code screen has a **Code / Preview** switch on phones.
- Targets are touch-sized (44 px), inputs use 16 px text to prevent iOS zoom, and the layout height follows the **visual viewport**, so the on-screen keyboard shrinks the layout rather than covering inputs, and focused fields are scrolled into view.
- Landscape phones get a compact header and side-docked sheets.
- Generated portfolios are responsive too (hamburger menus, stacked layouts, no horizontal overflow).

---

## 11. Architecture

```
            +-------------------------------+
            |  PortfolioProject (the model) |  <- single source of truth
            +---------------+---------------+
                            |
 content forms ─┐           |            ┌─ saved to IndexedDB
 inspector      ├── commit(): snapshot, mutate, autosave, emit('doc')
 click-to-edit  │           |            └─ undo / redo stack
 Make It Yours ─┘           v
                  renderer (03-renderer.js)
                  model + design  ->  { html, css, js }
                            |
        manual code overrides (project.code) take precedence
                            |
                  assembleDocument()
                  ├─ mode "preview"  -> + bridge script, sandboxed iframe
                  ├─ mode "export"   -> standalone file
                  └─ mode "thumb"    -> no scripts, gallery thumbnails
```

Key rules:
- **One renderer.** Templates do not contain copies of your content. They differ only in design tokens, variants and CSS.
- **State is separated:** content (`person`, `socials`, `sections`), design (`design`), generated code (computed, cached, never stored), manual code (`code` overrides), saved versions (`versions`), and temporary variations (in memory only).
- **Stable ids** for sections, items, socials and every editable element (data paths), so edits survive re-rendering.
- **Uploaded files** are stored once as assets and referenced as `asset:<id>` tokens in the generated code, so the code stays readable. Tokens are resolved to data URLs (single file) or `assets/…` paths (ZIP) only when the document is assembled.
- **Preview frames** are swapped, not re-navigated, because re-assigning an iframe's `srcdoc` adds browser-history entries that would hijack the Back button.

---

## 12. Data model

(Simplified; see `src/js/01-core.js`.)

```js
PortfolioProject {
  id, name, createdAt, updatedAt,
  person:   { name, title, location, email, phone, avatar, footer },
  socials:  [{ id, label, url }],
  sections: [{                         // order = array order
    id, type, title, visible, nav,
    data:  { ... },                    // for single-instance types (hero, about, resume, contact)
    items: [{ id, ...fields }],        // for list types (projects, skills, ...)
    style: { bg, bgColor, pad, layout, anim }   // per-section overrides
  }],
  design: DesignConfiguration,
  seo:    { title, description, lang, siteUrl, ogImage, favicon:{ value, color } },
  assets: { [id]: { name, mime, dataUrl, size } },
  code:   { html: string|null, css: string|null, js: string|null },  // manual overrides
  versions: [{ id, name, at, doc }]
}

DesignConfiguration {
  system: 'minimal' | 'maximal',  template: '<id>',
  palette:    { primary, secondary, accent, bg, text, card, border },
  type:       { heading, body, size, weight, line, spacing, headSpacing, headCase },
  layout:     { spacing, width, cols, hero, nav, image, head, cards, secBg },
  components: { btn:{style,radius,size}, card:{radius,shadow,border,hover}, navLink, divider, imageBorder },
  anim:       { entrance, stagger, duration, intensity, hover, marquee, typewriter, parallax, progress },
  bg, decor: [...],
  elementStyles: { '<data path>': { font, size, weight, color, align, ls, lh, bg, radius, ... } }
}
```

Section **schemas** (`SECTION_TYPES`) drive the forms, the inspector, validation and rendering, so adding a field in one place updates every surface.

---

## 13. Security model

What is protected, and how it was verified (automated tests in `tests/e2e8_audit.py` and `tests/e2e7_links.py`):

- **Untrusted project files.** Every project that enters the app (JSON import, saved storage, version restore) goes through `sanitizeProject()`: types are coerced to their schema, unknown keys dropped, every design token whitelisted or clamped, colours must be hex, asset data URLs must be well-formed base64 images/PDFs. An earlier build trusted these values and a crafted JSON file could run script in the builder itself (stored XSS) — this was found in an audit, fixed, and has a regression test.
- **Preview isolation.** The portfolio, including your own custom JavaScript, runs in `<iframe sandbox="allow-scripts">` with no `allow-same-origin`: it cannot read the builder's DOM, storage or cookies. **The sandbox alone is not treated as sufficient** (see the next points).
- **Messages from the preview are untrusted.** Because the preview runs user code, edit messages are accepted only for real text fields as plain strings; paths such as `design/template`, `code/html` or `__proto__` are rejected, and the model writer refuses prototype keys and unknown fields.
- **Links in previews never navigate.** Embedded documents handle in-page anchors themselves and block all other navigation (external links show a toast). Standalone exports contain none of this.
- **URLs:** only http(s), `mailto:`, `tel:`, in-page anchors and relative paths are emitted; `javascript:`, `data:`, `vbscript:` and `file:` are rejected.
- **Escaping:** content is HTML-escaped on output; JSON-LD is escaped against `</script>` injection; builder forms escape every interpolated value.
- **Custom code** you write (or import inside a project file) runs only in the sandbox and **is exported as written**. Imports that contain code show a warning. Treat project files from strangers like any other code.
- No network calls except the Google Fonts stylesheet; no analytics.

**Not verified:** a third-party security review has not been done, and sandbox behaviour was tested in Chromium only.

## 14. Building from source

Requires Python 3 only.

```bash
python3 build.py
# flat layout -> index.html next to build.py;  nested layout -> dist/index.html
```

`build.py` concatenates `src/js/*.js` (in filename order) into one IIFE, embeds `src/site/*` (the CSS and JS that go into generated portfolios) as strings, and inlines the CSS and bundle into `src/index.html`. The root `index.html` shipped with this project is exactly that build output.

To check syntax during development: `node --check src/js/<file>.js`.

---

## 15. Testing

Browser tests use **Playwright with Chromium** (`pip install playwright pillow && playwright install chromium`) and live in `tests/`. They drive the built `index.html` like a user: clicking, typing, tapping, downloading files and opening the downloads again.

```bash
mkdir -p /tmp/pvtest && cd /tmp/pvtest            # screenshots/downloads are written to the current folder
export PYTHONPATH=/path/to/repo/tests             # PV_APP=file:///abs/path/index.html tests another build
python3 /path/to/repo/tests/e2e1.py               # ...e2e2, e2e3, e2e5, e2e6, e2e7_links, e2e8_audit
python3 /path/to/repo/tests/e2e4.py 390 844       # mobile flow at a viewport
python3 /path/to/repo/tests/e2e9_mobile_audit.py 390x844
```

**Run suites one at a time.** Running several browsers at once starves the CPU and causes timeouts that look like failures (this happened during development). Run e2e3 before e2e5 in the same folder (e2e5 reuses a file e2e3 downloads). `e2e7_links` and `e2e8_audit` start their own local http server, because some bugs only occur over http, not `file://`.

### Results of the last full run against the delivered `index.html`
| Suite | Covers | Result |
|---|---|---|
| `e2e1` | Create without an account, wizard, live preview, Back/Forward keep data | 14 / 14 |
| `e2e2` | Click-to-edit, inline edit, URL validation, undo/redo, survives refresh | 25 / 25 |
| `e2e3` | Make It Yours, code editing, sandbox isolation, unapplied-code guard, exports (HTML, ZIP, JSON), import | 50 / 50 |
| `e2e4` | Full phone flow, Back at every step, sheets, tap-to-select, export | 43 / 43 at each of 390×844, 360×640, 844×390, 768×1024 |
| `e2e5` | Sections/items, 33 projects, gallery, project management, reduced motion | 25 / 25 |
| `e2e6` | Device sizes, full screen, new tab sandbox | 6 / 6 |
| `e2e7_links` | Links inside every embedded preview never load the app inside the frame; anchors scroll; external links explained; exports unaffected | 18 / 18 |
| `e2e8_audit` | One regression test per audited defect: hostile/malformed imports, forged preview messages, discarded code drafts, failed saves, two-tab conflicts, memory-only mode, unreadable records, hand-edited-code warning, stale selection, dialog focus trap, announcements, validation messages, export checklist | 41 / 41 |
| `e2e10_save_design` | Make It Yours: save a design as its own portfolio (one or all), original untouched, survives refresh, copy is independent | 10 / 10 |
| `e2e9_mobile_audit` | Essential controls reachable and uncovered, long forms scroll, keyboard emulation, rotation, dialogs, full-screen exit, refresh restore | pass at 390×844, 360×640, 844×390, 768×1024, 1280×800 (one aggregate assertion per viewport) |

### Not verified
- Real phones and tablets, and a real on-screen keyboard (keyboard behaviour is emulated by shrinking the visual viewport; iOS Safari specifically is untested).
- Firefox and Safari (only Chromium was run).
- Screen readers: roles, names, focus handling and announcements are implemented and checked by script, but no assistive technology was used.
- Google Fonts rendering (the test environment was offline).
- A formal contrast audit beyond a scripted scan of the builder screens (no failures found; placeholders, disabled controls and the code editor's syntax colours were not scanned).

## 16. Extending PortfolioVerse

### Add a template
1. In `src/js/02-templates.js` add a `T('my-id', 'minimal'|'maximal', 'Name', 'Blurb', [tags], { …design overrides… })` entry choosing a palette, fonts and variants (`layout.hero`, `nav`, `cards`, `head`), decoration and motion.
2. Optionally add a skin block in `src/site/skins.css` scoped to `.t-my-id` for its unique details.
3. `python3 build.py`. It appears in the gallery, the wizard and Make It Yours automatically.

### Add a variant
Add its name to `VARIANTS` (`03-renderer.js`), emit its markup in the relevant renderer function, and style it in `src/site/base.css`. It becomes selectable in the Design panel and usable by the variation engine (add it to `validateDesign` whitelists via `VARIANTS`).

### Add a section type
Add an entry to `SECTION_TYPES` in `01-core.js` (label, kind `single`/`list`, fields) and a renderer in `SECTION_HTML` in `03-renderer.js`. Forms, inspector, empty-detection, export and import pick it up from the schema.

### Add a Make It Yours preset
Add a `PRESETS` entry with a few recipes (`04-variations.js`), and optionally keywords in `KEYWORDS`.

### Plug in an AI later
Ask the model for **JSON matching the recipe/design shape** (palette, fonts, variants, motion, decoration), parse it, and run it through `applyRecipe()` → `validateDesign()`. Do not accept free-form code from the model.

---

## 17. Known limitations

- **No Monaco / TypeScript / React toolchain**; see [section 2](#2-important-how-this-differs-from-the-original-brief).
- **Manual code vs. visual edits** are one-way once you edit a tab by hand (explained in the UI).
- **Fonts need the internet** unless you export with web fonts disabled (then system fonts are used). Fonts are not embedded.
- **Storage limits:** browsers cap IndexedDB per origin; very large image collections may hit them. Images are compressed (up to 1600 px, quality-stepped to keep each under about 0.7 MB where possible); PDFs are limited to 3 MB, SVGs to 300 KB.
- **Restricted viewers:** inside sandboxed preview panes the app runs, but persistence, downloads and pop-ups depend on what the viewer allows. A normal browser tab is the supported way to use it.
- **Single user, single device:** there is no sync. Move work between browsers with JSON export/import.
- **Undo history** is per session (it resets when you reload); saved work and saved versions persist.
- **Links in previews are switched off** by design (a toast explains); they work on the exported site.
- **Two-tab conflict detection** compares a saved timestamp and, where supported, a BroadcastChannel notice; it protects against overwrites but is not real-time collaboration.
- **Contact form** uses `mailto:` (opens the visitor's mail app); there is no server-side form handling.
- **Per-element style editing** covers text, buttons, cards and images; it is not a free-form layout editor.
- The browser URL updates before the "leave this screen?" prompt when you press the browser's own Back button with unapplied code; it is restored if you choose to stay.

---

## 18. Troubleshooting / FAQ

**My changes disappeared.** Autosave writes to this browser's storage. Private/incognito windows, "clear site data", or a different browser/profile will not have them. Check the badge in the header (a red "Not saved" means the write failed; export JSON immediately).

**The preview shows my edits but the export doesn't (or vice versa).** They use the same code path. Check the Code screen for amber dots: a manually edited tab is exported as written. Use *Restore generated* to resync.

**Click-to-edit does nothing.** Either HTML is manually edited (restore it), you are in the Customize step (clicking is enabled from the Edit step), or you are viewing a Make It Yours variation in compare mode.

**An image shows a broken icon after export.** Pasted image links must stay online. Upload the file instead so it is embedded. For ZIP exports keep the `assets/` folder next to `index.html`.

**Fonts look different offline.** Web fonts could not load; system fallbacks are used. Re-enable internet, or choose fonts marked "(no download)".

**"Not a valid link" warnings.** Links must be http(s), `mailto:`, `tel:`, an in-page `#anchor` or a relative path. Bare domains such as `example.com` are accepted and become `https://example.com`.

**Can I use it on a phone?** Yes: the whole flow, including download, is designed for it. See [section 10](#10-mobile-and-responsive-behaviour).

**Buttons do nothing / blank page when I open `index.html` inside a preview pane or chat viewer.** Early builds crashed at startup when the viewer blocked `localStorage`. This is fixed (all storage and history access is guarded, errors show as a message instead of failing silently) and covered by a sandbox test. Two limits remain in such viewers: your work is not saved between sessions (the app says so), and file downloads or new tabs may be blocked by the viewer; use **Copy HTML** on the Export screen, or open `index.html` directly in a normal browser tab for full functionality.

**A link in the preview doesn't go anywhere.** Previews never navigate (so a click can't load another page inside the editor). In-page links scroll; external links show a notice. They work normally in the exported file.

**A red banner says my work couldn't be saved / another tab changed it.** Use *Download backup* first, then *Try again* or choose *Load the latest version* / *Keep my version* as described in section 9.

**Where do I report problems?** There is no server component; keep the project JSON of an affected portfolio and the browser name/version when reporting.

---

## 19. Project layout

Flat layout (this repository):

```
index.html          generated app (open / publish this)
shell.html          page template filled in by build.py
build.py            python3 build.py  ->  index.html
01-core.js          utilities, URL validation, section schema, model, sanitising
02-templates.js     fonts, palettes, the 8 templates
03-renderer.js      the single rendering engine + document assembler
04-variations.js    Make It Yours engine and design validation
05-store.js         state, commit/undo/redo, IndexedDB, conflict detection
06-router.js        central hash router, history index, guards
07-ui-common.js     icons, dialogs (focus trap), toasts, form builders, banner
08-screens.js       landing, projects, gallery, wizard steps 1-4
09-preview.js       sandboxed preview host, selection toolbar, message validation
10-workspace.js     editor screen, panels, inspector, Make It Yours UI
11-code.js          code editor
12-export.js        export screen, pre-publish checklist, ZIP writer
13-main.js          render dispatcher, central action handling, boot
app.css             builder UI styles
base.css skins.css  shared + per-template portfolio styles (inside generated sites)
site.js bridge.js   portfolio runtime; preview-only bridge
e2e1.py ... e2e9_mobile_audit.py, h.py   Playwright tests
README.md  .gitignore
```

The same files also work in the nested layout (`src/js`, `src/site`, `src/app.css`, `src/index.html`).
