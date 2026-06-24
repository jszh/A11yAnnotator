# Annotator guide

Instructions for annotating the ACT-augmented WCAG dataset.

> **Prerequisites:** [Node.js 18+](https://nodejs.org) (includes `npm`). ~1 GB free disk
> (install downloads a Chromium for the screen-reader / inspector engine).

## 1. Download the repo

```bash
git clone -b round3-llm-evidence-lane <REPO_URL> A11yAnnotator
cd A11yAnnotator
```

*(or unzip the folder you were sent and `cd` into it)*

## 2. Install (one time — downloads dependencies + Chromium, a few minutes)

```bash
npm install
```

## 3. Start the server

```bash
npm start
```

Leave this running. It serves on **http://localhost:3001**.

## 4. Open the annotator in Chrome

```
http://localhost:3001/eval/act-augmented/_annotator/index.html
```

## 5. Set up & load your assignment

- Click **⚙** and enter your name (recorded in your export).
- Click **⛶ Filter** and choose **your** file from `eval/act-augmented/_annotator/splits/`:

  | You are | Load this file |
  |---|---|
  | Annotator 1 | `annotator-1-first-half.json` |
  | Annotator 2 | `annotator-2-second-half.json` |
  | Annotator 3 | `annotator-3-q1-q4.json` |
  | Annotator 4 | `annotator-4-middle.json` |

## 6. Practice first

The tool opens in **Practice mode** — calibration cases with known answers; it tells you
if you're right. The real queue **unlocks once you finish all practice cases**.

## 7. Annotate

For each page: read **How to test it**, inspect (highlight, screen-reader transcript,
**🔎 element inspector**, ANDI, contrast), then answer **Q1 — does an issue exist?** and
**Q2 — approve / comment**. Progress autosaves to your browser; it remembers where you
left off.

## 8. Send back

When done, click **⬇ Export** and email the downloaded JSON to Jason.

---

**Keyboard:** `←/→` navigate · `1`/`2` answer Q1 · `a`/`c` answer Q2 · `Enter` advances.

**Notes**

- Use the **same machine / browser profile** throughout — your work is saved in that
  browser's `localStorage`.
- Everyone shares **seed 42**, so the page order and within-SC practice order are
  identical across annotators (this is intentional, for inter-annotator agreement) —
  don't change it.
- Direct link straight to the practice tasks (optional):
  `http://localhost:3001/eval/act-augmented/_annotator/index.html?practice`

See [`eval/act-augmented/_annotator/README.md`](eval/act-augmented/_annotator/README.md)
for full tool documentation and
[`eval/act-augmented/_annotator/splits/WORK-SPLIT.md`](eval/act-augmented/_annotator/splits/WORK-SPLIT.md)
for how the 4-way split works.
