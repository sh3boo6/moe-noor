# Project Map — Moe Noor Data

> تطبيق سطح مكتب لتحليل بيانات ملفات Excel الوزارية (نظام نور)  
> بناه: محمد عبدالرحمن — فكرة: هاشم العمري

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 (SSR: false, SPA) |
| UI | Nuxt UI v4 + Tailwind CSS v4 |
| Desktop | Tauri v2 (Rust) |
| Charts | ApexCharts + vue3-apexcharts |
| Excel | xlsx (in Web Worker) |
| Icons | @iconify-json/lucide, @iconify-json/simple-icons |
| Language | Arabic (RTL) |
| Package Manager | pnpm 11.5.2 |
| TypeScript | v6 |
| Lint | ESLint v10 (@nuxt/eslint) |

---

## Directory Structure

```
testApp/
├── app/                          # Nuxt application source
│   ├── app.vue                   # Root component (header, footer, RTL setup, about modal)
│   ├── app.config.ts             # Nuxt UI theme config (primary: green, neutral: slate)
│   ├── assets/
│   │   └── css/
│   │       └── main.css          # Tailwind + Nuxt UI imports, custom font, RTL, green palette
│   ├── components/
│   │   ├── AppLogo.vue           # SVG wordmark logo
│   │   ├── TemplateMenu.vue      # External template links dropdown
│   │   ├── excel/                # OLD: simpler school data model components
│   │   │   ├── ExcelCharts.vue   # ApexCharts: gender pie, gov bar, authority pie
│   │   │   ├── ExcelDataTable.vue# Searchable, filterable, paginated table
│   │   │   ├── ExcelKpiCards.vue # KPIs: schools, stages, students, classes, buildings
│   │   │   └── ExcelUploadZone.vue# Drag-and-drop file upload
│   │   └── ministry/            # Ministry (140+ column) data model components
│   │       ├── MinistryCharts.vue        # 9 chart panels: gender, stages, authority, labs, grades
│   │       ├── MinistryDetailsModal.vue   # Tabbed school details (basic, students, HR, facilities, building, map, classifications)
│   │       ├── MinistryFilters.vue        # 8 multi-select filters
│   │       ├── MinistryKpiCards.vue       # KPIs: schools, students, staff, buildings, quality warnings
│   │       ├── MinistryPowerTable.vue     # Sortable, searchable, paginated table with column toggle
│   │       └── MinistryUploadZone.vue     # Drag-and-drop upload for ministry files
│   ├── composables/
│   │   ├── useExcelSchools.ts     # OLD: synchronous Excel parsing (17 columns)
│   │   └── useMinistryExcel.ts    # Web Worker-based async parsing (140+ columns)
│   ├── pages/
│   │   └── index.vue             # Main dashboard page (file upload → filters → KPIs → charts → table)
│   ├── types/
│   │   ├── school.ts             # Types for old simple model (SchoolRecord, ExcelSchoolState)
│   │   └── ministrySchool.ts     # Types for ministry model (MinistrySchoolRecord, MinistryFilters, etc.)
│   └── workers/
│       └── excel.worker.ts       # Web Worker: parses ministry Excel via xlsx, maps 120+ defs
│
├── src-tauri/                    # Tauri desktop app (Rust)
│   ├── Cargo.toml                # Rust deps: tauri 2.11.2, tauri-plugin-log 2, serde
│   ├── build.rs                  # tauri_build::build()
│   ├── capabilities/
│   │   └── default.json          # Tauri v2 capability: core:default for main window
│   ├── icons/                    # App icons (png, icns, ico)
│   ├── src/
│   │   ├── main.rs               # Binary entry, calls testapp_lib::run()
│   │   └── lib.rs                # Tauri builder: conditional log plugin, run context
│   └── tauri.conf.json           # Config: productName, window (800×600), CSP null, bundle all
│
├── public/                       # Static assets
│   ├── favicon.ico
│   ├── fonts/
│   │   └── ibm-plex-sans-arabic-{400,500,600,700}.ttf
│   └── img/
│       └── logo.png              # Ministry logo
│
├── data.xlsx                     # Sample ministry Excel data
├── nuxt.config.ts                # Nuxt config: modules, SSR off, nitro static, ESLint style
├── package.json                  # Scripts: dev, build, preview, tauri:dev, tauri:build
├── tsconfig.json                 # References Nuxt-generated tsconfigs
├── eslint.config.mjs             # ESLint: Nuxt config, ignores src-tauri/target
├── vercel.json                   # Deploy: output dir .output/public, clean URLs
├── renovate.json                 # Renovate: Nuxt preset, lock maintenance, pnpm dedupe
├── pnpm-workspace.yaml           # Disables builds for native packages
├── .editorconfig                 # 2-space indent, UTF-8, LF
├── .gitignore                    # Standard Nuxt + Tauri ignores
├── .github/workflows/ci.yml      # CI: lint + typecheck on push
└── README.md                     # Nuxt UI template readme
```

---

## Data Model (Ministry)

**`MinistrySchoolRecord`** groups 140+ Excel columns into 7 categories:

| Group | Key Fields |
|-------|-----------|
| `identity` | id, schoolName, educationDepartment, administrativeRegion, stage, authority, gender, studyTime, educationType, governorate, phone, email |
| `students` | grade1–12, total, saudi, newcomers, classes, saudi1–12, gradeTotal, gradeTotalMismatch |
| `staff` | teachers, saudiTeachers, admins, saudiAdmins, guidance, agents, managerName, managerId |
| `facilities` | computerLabs, physicsLabs, chemistryLabs, englishRooms, internet, cafeteria, water |
| `building` | ownership, rent, latitude, longitude, roadStatus |
| `classification` | earlyChildhood, pathways |
| `additional` | 40+ fields: educationOffice, schoolCount, address, rooms, capacity, curriculum, sector, etc. |

---

## Data Flow

```
User drops .xlsx file
        ↓
MinistryUploadZone emits file
        ↓
useMinistryExcel.parseFile(file)
        ↓
Web Worker (excel.worker.ts) receives ArrayBuffer
  → xlsx.read(data) → sheet → headers → rows
  → mapRowToSchool() matches 120+ column definitions via aliases
  → computes gradeTotal, detects mismatches
  → postMessage({ type: 'parsed', payload })
        ↓
useMinistryExcel updates schools[], headers[], warningCount
        ↓
index.vue computes filters → filteredSchools
        ↓
MinistryFilters ← filter options from unique values
MinistryKpiCards → aggregated KPIs
MinistryCharts   → ApexCharts panels
MinistryPowerTable → interactive data table
MinistryDetailsModal → full school details on row click
```

---

## Key Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Nuxt dev server (port 3000) |
| `pnpm build` | Nuxt static build → `.output/public` |
| `pnpm preview` | Preview production build |
| `pnpm lint` | ESLint check |
| `pnpm typecheck` | Nuxt typecheck |
| `pnpm tauri:dev` | Tauri dev (starts Nuxt + Tauri window) |
| `pnpm tauri:build` | Build Tauri desktop app bundle |

---

## Architecture Notes

- **SSR disabled** — required for Tauri (file:// protocol, no Node server)
- **Nitro preset: static** — generates fully static output in `.output/public`
- **Data parsing in Web Worker** — keeps UI thread responsive for large files (1000s of schools × 170 columns)
- **Alias-based column matching** — `COLUMN_DEFINITIONS` in the worker maps each field to multiple possible Arabic header strings, so the app tolerates renamed/moved columns in ministry exports
- **Dual model support** — ministry (full) and old/simple (17-column) composables coexist, but the UI uses the ministry path exclusively
- **No routing** — single-page app with `<NuxtPage />` rendering only `index.vue`
