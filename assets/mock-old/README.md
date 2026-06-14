# ABD Mock Websites

This repository compares mock website outputs from different AI workflows.

## Scope

- 5 categories:
  - E-commerce
  - Government
  - Social Media
  - Mass Media
  - Education
- 4 implementation approaches:
  - Codex
  - Claude Code
  - Google Antigravity
  - Mix (manually adjusted with multiple agents)
- 2 prompt styles:
  - Detailed (with stronger requirements, including accessibility)
  - Concise

Prompt files are now stored in a separate folder: `propmt/`.

## Repository Structure

```text
ABD-mock-websites/
├── README.md
├── propmt/
│   ├── detailed_accessibility_requirement.md
│   └── concise.md
├── e-commerce*/         # outputs from Codex / Claude / Antigravity / Mix
├── government*/         # outputs from Codex / Claude / Antigravity / Mix
├── social-media*/       # outputs from Codex / Claude / Antigravity / Mix
├── mass-media*/         # outputs from Codex / Claude / Antigravity / Mix
└── education*/          # outputs from Codex / Claude / Antigravity / Mix
```

`*` means there are multiple folders for the same category, one per implementation approach.

## Implementation Status Check (detail)

| Platform        | Mix | Codex | Claude Code | Google Antigravity
|---------------|-----|-------|-------------|---------------|
| E-commerce    | ✅  | ✅    | ✅          | ✅            |
| Government    | ✅  | ✅    | ✅          | ✅ http://localhost:5173/ *npm run dev*  |
| Social Media  | ✅  | ✅    | ✅          | ✅ http://localhost:8082/       |
| Mass Media    | ✅  | ✅    | ✅          | ✅ http://localhost:5173/       |
| Education     | ✅  | ✅      | ✅            | ✅ http://localhost:5174/             |

## Implementation Status Check (concise)

| Platform        | Mix | Codex | Claude Code | Google Antigravity
|---------------|-----|-------|-------------|---------------|
| E-commerce    | ✅  | ✅    | ✅          |               |
| Government    | ✅  | ✅    | ✅          |               |
| Social Media  | ✅  | ✅    | ✅          |               |
| Mass Media    | ✅  | ✅    | ✅          |               |
| Education     | ✅  | ✅    | ✅          |               |
