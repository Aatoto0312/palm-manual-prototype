# Palm Manual v0.2 PersonCore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PersonCore 8軸と組み合わせ解釈を中心にしたPalm Manual v0.2を実装する。

**Architecture:** 計算と文章生成を新しい純粋関数モジュールへ分離し、既存の診断入口と画面フローを維持する。旧20パターンはフォールバック資料として残す。

**Tech Stack:** HTML, CSS, browser JavaScript, Node.js built-in test runner

**Spec:** `docs/superpowers/specs/2026-09-01-person-core-v02-design.md`

## Global Constraints

- 外部依存、ビルド、サーバー、AI APIを追加しない。
- PersonCore各軸は独立した整数1〜5で、平均3への補正を行わない。
- `PalmDiagnosis.diagnose(input)` と既存画面フローを維持する。
- 元画像を結果画面・共有領域に含めない。
- commit / pushを行わない。

---

### Task 1: PersonCore domain module

**Files:**
- Create: `person-core.js`
- Create: `tests/person-core.test.js`

**Interfaces:**
- Produces: `buildSeed(input)`, `generatePersonCore(seed)`, `interpretCombinations(core)`, `calculateTypeScores(core)`, `buildResultData(input)`

- [ ] Write failing Node tests for all 8 axes, integer range, deterministic output, input sensitivity, edge-value reachability, 8 required combinations, and distinct Primary / Secondary.
- [ ] Run `node --test tests/person-core.test.js` and confirm failure because the module is absent.
- [ ] Implement the deterministic module with browser and CommonJS exports.
- [ ] Run the tests and confirm they pass.

### Task 2: Diagnosis compatibility layer

**Files:**
- Modify: `diagnosis.js`
- Modify: `tests/person-core.test.js`

**Interfaces:**
- Consumes: `PalmPersonCore.buildResultData(input)`
- Produces: compatible `PalmDiagnosis.diagnose(input)` and retained `RESULT_PATTERNS`

- [ ] Add a failing integration test proving `diagnose` returns PersonCore result data while 20 legacy patterns remain available.
- [ ] Run the test and confirm the old result shape fails it.
- [ ] Change only the diagnosis entry point and exports; retain legacy copy.
- [ ] Run the test suite and confirm it passes.

### Task 3: Result markup and renderer

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Create: `tests/static-contract.test.js`

**Interfaces:**
- Consumes: v0.2 result contract
- Produces: category and combination DOM cards without image elements in RESULT/share regions

- [ ] Add failing static contract tests for script order, 8-axis container, combination container, result order, disclosure text, and image exclusion.
- [ ] Run the static tests and confirm the current markup fails.
- [ ] Rebuild RESULT markup in the specified priority and update renderer DOM operations.
- [ ] Run all tests and confirm they pass.

### Task 4: Bright compendium UI

**Files:**
- Modify: `style.css`
- Modify: `tests/static-contract.test.js`

**Interfaces:**
- Produces: category accent themes, responsive cards, safe-area and reduced-motion preservation

- [ ] Add failing static checks for four category themes, overflow protection, safe-area, and reduced-motion.
- [ ] Run them and confirm the missing v0.2 themes fail.
- [ ] Implement the light fantasy/status-card styling without fixed content widths.
- [ ] Run all tests and confirm they pass.

### Task 5: Documentation and final verification

**Files:**
- Modify: `README.md`

- [ ] Update architecture, data semantics, privacy disclosure, and v0.2 verification instructions.
- [ ] Run `node --check` on every JavaScript file.
- [ ] Run `node --test tests/*.test.js`.
- [ ] Execute the 15-item requirement checklist using automated evidence where possible and record manual-browser items explicitly.
- [ ] Inspect `git diff --check`, `git diff --stat`, and `git status --short`; do not commit or push.

