# pyhacksecgp.github.io — Static Hugo site (portfolio / blog)

Public-facing portfolio + technical blog for **GP Singh** (handle `pyhacksecgp`).
Built with Hugo, two swappable themes, deployed to Cloudflare Pages at
`https://www.greenbladesec.com` with a GitHub Pages fallback at
`https://pyhacksecgp.github.io`.

---

## 60-Second Overview

- **What:** Single public landing page for every shipped security project
  (P1 → P7), long-form technical writeups, HTB walkthroughs, and a live CV.
- **Who visits:** recruiters, hiring managers, interview panels, fellow
  security engineers who found a post via Dev.to or LinkedIn, and the
  occasional CTF player chasing a writeup.
- **What's there:**
  - **Projects** — 7 shipped tools (SAST/DAST triage, threat model
    generator, log anomaly detector, mini-CRS, ATLAS pentest pipeline,
    autopatch CVE loop, plus a 75-Hard tracker and memory-safety lab).
  - **Blog** — build notes, methodology posts, HTB machine writeups.
  - **CV** — single Markdown source, rendered via a custom `cv/single.html`
    layout, printable.
  - **Lab** — homelab infra summary with embedded Grafana panels.
- **Stack:** Hugo (extended) + Goldmark + two local themes + Cloudflare
  Pages (primary) + GitHub Pages (fallback via Actions).
- **Content model:** every project and every blog post is a single Markdown
  file with frontmatter — no CMS, no database, no runtime.

---

## For Interviewers

### Problem Statement

Security work ships in many places: GitHub repos, Dev.to posts, LinkedIn
updates, Forgejo mirrors, HTB writeups, internal docs. Recruiters and
hiring panels do not want a scavenger hunt. They want **one URL** that
answers:

1. What has this person actually shipped?
2. Does the writing match the resume?
3. Can they explain the work without hand-waving?

This repo is that one URL. Every shipped tool gets a project card linking
to the GitHub repo. Every project card is paired with a long-form blog
post explaining the design decisions, the trade-offs, the metrics. The CV
lives in the same tree so it never drifts from the portfolio.

### Skills on Display

| Skill | Evidence in this repo |
|-------|-----------------------|
| **Static-site engineering** | Hugo site built from scratch, no starter template |
| **Theme customization** | Two local themes (`terminal`, `premium`) built in-tree, swap via one line in `hugo.toml` |
| **Design systems** | Shared partials (`head.html`, `footer.html`, `nav.html`, `project-card.html`) across themes |
| **Deploy pipelines** | Dual-track: Cloudflare Pages via `deploy.sh`, GitHub Pages via `.github/workflows/deploy.yml` |
| **DNS / edge** | Custom domain via `CNAME`, Cloudflare in front, baseURL swap at build time |
| **Content as code** | Every post is Markdown + frontmatter, reviewed in PRs, no WYSIWYG |
| **OPSEC discipline** | Scrubbed internal IPs from blog posts post-publish (see commit log) |

### Architecture (ASCII)

```
┌──────────────────────────────────────────────────────────────────┐
│  AUTHOR                                                          │
│  $ hugo new blog/some-post.md     ← archetype fills frontmatter  │
│  $ $EDITOR content/blog/some-post.md                             │
│  $ hugo server -D                 ← local preview                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  SOURCE TREE                                                     │
│    content/        → Markdown + frontmatter (authoritative)      │
│    archetypes/     → default frontmatter template                │
│    themes/premium  → active theme (minimalist cyberpunk)         │
│    themes/terminal → alt theme (kali-prompt style)               │
│    hugo.toml       → site config, params, menus                  │
│    static/         → raw assets copied as-is                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BUILD                                                           │
│    hugo --minify --baseURL "https://www.greenbladesec.com/"      │
│    → emits ./public/ with hashed assets + sitemap + RSS          │
└──────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
┌──────────────────────┐                 ┌─────────────────────────┐
│ PRIMARY              │                 │ FALLBACK                │
│ deploy.sh            │                 │ .github/workflows/      │
│  → wrangler pages    │                 │   deploy.yml            │
│    deploy public     │                 │  → upload-pages-artifact│
│  → Cloudflare Pages  │                 │  → deploy-pages         │
│  → www.greenblade…   │                 │  → pyhacksecgp.gh.io    │
│    (CNAME)           │                 │                         │
└──────────────────────┘                 └─────────────────────────┘
```

### Design Decisions (why Hugo, not X)

- **Why Hugo, not Next.js / Astro?** Zero runtime. One Go binary builds
  the entire site in <1s. No `node_modules`, no supply-chain risk, no
  framework churn. A security-focused portfolio should not ship a
  JavaScript framework just to render Markdown.
- **Why two themes in-tree, not vendored?** Themes live under
  `themes/premium/` and `themes/terminal/` with no git submodule. One-line
  theme swap (`theme = "premium"` ↔ `"terminal"` in `hugo.toml`). Edits
  land in the same repo as the content they style.
- **Why dual-deploy (Cloudflare + GitHub Pages)?** Cloudflare Pages is
  faster at the edge and gives analytics without JS tracking.
  GitHub Pages is the mirror — if Cloudflare ever goes sideways, the
  Actions workflow still ships to `pyhacksecgp.github.io`. The `CNAME`
  file keeps the custom domain pinned.
- **Why Markdown + frontmatter, not a CMS?** Posts review in PRs. Diffs
  are human-readable. No admin UI to patch, no DB to back up. The
  entire site state is `git clone`.
- **Why `enableEmoji`?** Posts use emoji sparingly for section markers.
  Enabled at config level so authors do not escape manually.

### Metrics (as of latest commit)

- **Pages shipped:** 1 home + 1 CV + 7 project pages + 4+ blog posts +
  2 section index pages.
- **Themes:** 2 (`premium` active, `terminal` standby).
- **Build time:** sub-second (Hugo extended, local).
- **Deploy time:** ~15s cold (wrangler upload) via `deploy.sh`.
- **Zero** JavaScript frameworks. Only vanilla JS for particles/terminal
  effects, loaded as static assets.
- **Zero** external runtime dependencies — the deployed site is pure
  HTML/CSS/JS.

---

## Site Map

```
content/
├── _index.md              → home page (title only; layout does the rest)
├── cv.md                  → CV rendered via themes/terminal/layouts/cv/single.html
├── projects/
│   ├── _index.md          → projects index ("5 security tools shipped…")
│   ├── p1-sast-dast-triage.md
│   ├── p2-threat-model-generator.md
│   ├── p3-log-anomaly-detector.md
│   ├── p4-mini-crs.md
│   ├── p5-atlas.md
│   ├── 75hard-tracker.md
│   ├── ctf-lab.md
│   └── memory-safety-lab.md
└── blog/
    ├── _index.md          → blog index
    ├── building-p7-autonomous-cve-patcher-in-a-weekend.md
    ├── p1-sast-dast-triage.md
    ├── p3-log-anomaly-detector.md
    └── htb-archetype.md
```

Top-level sections map 1:1 to menu entries in `hugo.toml`:

- `~/whoami` / **About** → `/` (home)
- `~/projects` / **Projects** → `/projects/`
- `~/blog` / **Blog** → `/blog/`
- `~/cv` / **CV** → `/cv/`
- **Lab** → `/#homelab` (anchor on home, premium theme only)
- **Contact** → `/#contact` (anchor on home, premium theme only)

---

## Local Development

### Install Hugo (extended)

```bash
# macOS
brew install hugo

# Debian/Kali/Ubuntu
sudo apt install hugo
# or grab latest .deb from https://github.com/gohugoio/hugo/releases

# Verify extended build (SCSS/SASS support)
hugo version   # expect: "hugo v0.1xx.x extended …"
```

Hugo must be the **extended** build. GitHub Actions pins this via
`peaceiris/actions-hugo@v3` with `extended: true`.

### Serve locally

```bash
git clone git@github.com:PyHackSecGP/pyhacksecgp.github.io.git
cd pyhacksecgp.github.io
hugo server -D          # -D includes drafts
# → http://localhost:1313
```

Live reload on file save. Section indexes rebuild automatically.

### Write a new blog post

```bash
hugo new blog/my-post-title.md
# → content/blog/my-post-title.md created from archetypes/default.md
```

The archetype at `archetypes/default.md` seeds this frontmatter:

```yaml
---
title: "My Post Title"
date: 2026-10-29T12:34:56-07:00
description: ""
tags: []
---
```

Fill `description` (shown on index pages + SEO), add `tags`, write the
body in CommonMark. Code fences get `github-dark` syntax highlighting
via Goldmark (`markup.highlight.style`).

### Write a new project card

```bash
hugo new projects/my-tool.md
```

Projects use the same archetype; add any extra frontmatter the project
card partial reads (`themes/terminal/layouts/partials/project-card.html`
or the premium equivalent) — e.g. GitHub repo URL, status chip.

### Preview before shipping

```bash
hugo --minify --baseURL "http://localhost:1313/"
python3 -m http.server --directory public 8080
# → http://localhost:8080 — exact bytes that will deploy
```

---

## Deployment

### Primary: Cloudflare Pages via `deploy.sh`

```bash
export CLOUDFLARE_API_TOKEN=…    # token scoped to Pages:Edit
./deploy.sh
```

What it does:

1. Fails fast if `CLOUDFLARE_API_TOKEN` is unset.
2. Runs `hugo --minify --baseURL "https://www.greenbladesec.com/"` →
   emits `public/`.
3. Runs `wrangler pages deploy public --project-name greenbladesec-website
   --commit-dirty=true`.
4. Prints the live URL.

The custom domain is held by the `CNAME` file (`www.greenbladesec.com`),
read by both Cloudflare Pages and (as a hint) by GitHub Pages.

### Fallback: GitHub Pages via Actions

Push to `main` → `.github/workflows/deploy.yml` runs:

1. Checkout.
2. Setup Hugo extended (latest).
3. `hugo --minify --baseURL "https://pyhacksecgp.github.io/"`.
4. Upload `./public` as a Pages artifact.
5. Deploy to the `github-pages` environment.

Both paths produce the same `public/` tree — only the `baseURL` differs
so canonical URLs are correct on each host.

### Rollback

Both targets are immutable deploys. Rollback = redeploy the previous
commit from CI, or redeploy locally from a checked-out tag:

```bash
git checkout <good-sha>
./deploy.sh
```

---

## Theme + Config

### `hugo.toml` highlights

- `baseURL` → `https://www.greenbladesec.com/` (overridden at build time
  on GitHub Pages).
- `theme = "premium"` → active theme. Swap to `"terminal"` to flip the
  whole site into kali-prompt mode.
- `[params]` → author identity, handle, role, location, outbound links
  (GitHub, LinkedIn, Dev.to, contact email). Themes read these.
- `[menu.main]` → **terminal** theme navigation (`~/whoami`, `~/projects`,
  `~/blog`, `~/cv`).
- `[menu.premium]` → **premium** theme navigation (About, Projects, Lab,
  Blog, CV, Contact).
- `[markup.highlight]` → `github-dark` syntax theme, no line numbers,
  code fences enabled.
- `[markup.goldmark.renderer] unsafe = true` → raw HTML allowed in
  Markdown (used for embedded Grafana `<iframe>` on the Lab section).

### Theme layout

Both themes live under `themes/<name>/` with the standard Hugo structure:

```
themes/<name>/
├── theme.toml
├── layouts/
│   ├── _default/
│   │   ├── baseof.html     (terminal only; premium inlines)
│   │   ├── list.html
│   │   └── single.html
│   ├── cv/single.html      (terminal; custom CV layout)
│   └── partials/
│       ├── head.html
│       ├── nav.html        (terminal)
│       ├── footer.html
│       └── project-card.html
└── static/
    ├── css/main.css
    └── js/{terminal,particles,premium}.js
```

Edit layouts in-tree; no vendoring, no submodule, no upstream fetch.

---

## Content Standards

### Frontmatter contract

Every content file ships this minimum:

```yaml
---
title: "Human-readable title"
date: 2026-10-29
description: "One sentence. Shown on index + used for <meta description>."
tags: ["python", "security", "ai"]
---
```

Projects add two optional fields the project-card partial reads:

```yaml
status: "shipped"            # shipped | in-progress | archived
repo:   "https://github.com/PyHackSecGP/<name>"
```

### Tag conventions

Tags are **lowercase, hyphenated, singular where sensible**. Established
tags in use (grep `content/`):

- Languages/stacks: `python`, `c`, `flask`
- Discipline: `security`, `offensive`, `blue-team`, `appsec`,
  `vulnerability-research`, `exploitation`
- Techniques: `sast`, `dast`, `fuzzing`, `threat-modelling`, `mitre`,
  `stride`, `logging`, `siem`, `privesc`
- Tools: `afl++`, `asan`, `gdb`, `semgrep`, `nmap`, `hydra`,
  `prompt-caching`, `sarif`, `claude`, `llm`, `ai`
- Context: `ctf`, `hackthebox`, `htb`, `oscp-prep`, `homelab`,
  `personal`, `writeups`
- Platforms: `windows`, `smb`, `mssql`

Avoid inventing a new tag per post. If a tag only applies to one post,
delete it or widen it.

### Writing style

- Lead with the problem, not the tool.
- Metrics in numbers: "40 tests", "8 hours", "sub-second build".
- One blog post per shipped project is the baseline. Longer tools get
  methodology posts beyond the launch post.
- No internal IPs (`100.x.x.x`, `192.168.x.x`). Use `localhost`,
  `$OLLAMA_HOST`, or redacted placeholders. See the git log for a
  commit that scrubbed this.
- No `Co-Authored-By: Claude` or similar trailers in commits.

---

## Why This Was Built

**Public portfolio hub.** Before this site, the work lived scattered
across GitHub, Dev.to, LinkedIn, and Forgejo. Recruiters pinged on
LinkedIn and asked "where can I see your projects?" — the honest answer
was a list of six URLs. That is not a portfolio, that is homework for the
reader.

This repo collapses the list into **one** URL. The CV, the shipped
tools, the writeups, the lab — all one `git clone`, all deployed from
one `main` branch, all stylistically consistent because they share the
same theme layer. When a new project ships, the ritual is:

1. `hugo new projects/pN-<name>.md` — card.
2. `hugo new blog/building-pN-<name>.md` — launch post.
3. Commit + push → Cloudflare rebuilds in <30s.

That ritual is why the site stays current.

---

## FAQ

**Q: Why two themes, and why is one not deleted?**
A: `premium` is the public-facing minimalist look. `terminal` is the
kali-prompt style for when the audience is other hackers — swapping
themes is a one-line edit in `hugo.toml`, no code change. Keeping both
in-tree costs nothing (static files) and preserves the option.

**Q: Why Cloudflare Pages **and** GitHub Pages?**
A: Cloudflare is the primary — faster edge, better analytics, custom
domain via `CNAME`. GitHub Pages is the mirror / fallback so the site
survives even if the Cloudflare account is unavailable. Both deploys
produce byte-identical `public/` output; only the `baseURL` differs.

**Q: Where does the CV live? Can I download the PDF?**
A: `content/cv.md` is the single source. It renders at
`/cv/` via `themes/terminal/layouts/cv/single.html`. For a PDF, print to
PDF from the browser — the layout has print styles. There is deliberately
no second CV document to drift out of sync.

**Q: Can I reuse the themes for my own site?**
A: The themes are MIT-friendly (standard Hugo layout code), but they are
not published as standalone themes. Fork the repo, strip `content/`,
tweak `hugo.toml`, go. Preserve attribution if you keep the design.

**Q: How do I report a typo or a broken link?**
A: Open an issue on
[`PyHackSecGP/pyhacksecgp.github.io`](https://github.com/PyHackSecGP/pyhacksecgp.github.io/issues)
or email `security@okredirect.com`. PRs welcome for prose fixes.

---

## License

- **Prose and site content** (everything under `content/`): licensed
  under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
  Attribute "GP Singh — pyhacksecgp.github.io" with a link back.
- **Site code, themes, layouts, and build scripts**: MIT, consistent
  with upstream Hugo conventions.
- **Third-party assets** (fonts, icon sets) retain their original
  licenses; see each theme's `static/` tree.
