# Monthly PO PDF export

Adds “ดาวน์โหลด PO รายเดือน” beside the existing report button on `/purchase-orders`.
Choose a month and Buddhist year, then download one ZIP containing a PDF per PO.
Documents use the existing PO template, including its original copies/pages and calculations.

Selection uses `issueDate` in Asia/Bangkok with a half-open month interval. All
statuses and production stages are included, independently of list-page filters.
No schema changes, migrations, writes to business records, or new dependencies.
PDFs are rendered sequentially in the browser; keep the page open until complete.
The ZIP downloads only after all documents have rendered. Very large months
require enough browser memory to hold the PDFs and ZIP.

Files are sorted by PO number. Existing legacy number formatting is preserved.
When multiple legacy numbers have the same formatted number, their original
numbers are used for those filenames to avoid dropping or overwriting documents.

## Validation

- `node --test tests/monthly-po-export.test.mjs tests/po-pdf.test.cjs`
  (Node 22.18+; uses built-in TypeScript stripping and CRC32).
- `node node_modules/typescript/bin/tsc --noEmit`
- `node node_modules/eslint/bin/eslint.js src/components/MonthlyPoExport.tsx src/lib/monthly-po-export.ts src/app/api/purchase-orders/monthly-export/route.ts tests`
- Normal `npm run build` failed locally in Turbopack while creating the Prisma
  junction (`os error 80`). A Webpack diagnostic build also failed resolving the
  existing ESM PDF imports in five unchanged pages. A successful production build
  is still required before release. Do not treat TypeScript passing as build success.
- Full-project ESLint has pre-existing errors; unrelated files were left unchanged.
- Live database selection and a browser download require a smoke test on the
  deployed application. Consult the commit's Vercel status for deployment results.

## Backup and release

Base commit: `545fe67ab42ded2acab62dd73b40ef38222661ef`.
The separately delivered `po-project-before-monthly-export.bundle` contains the
complete original Git history and was checked with `git bundle verify`.
Restore into a new directory with `git clone <bundle-path> <new-directory>`.
This is a source backup, not a backup of the production database or Vercel secrets.

Release uses the existing repository and its existing Vercel deployment flow.
Verify an empty month and a populated month against the database, inspect Thai
text and totals against the current individual PO PDF, and extract the ZIP.
The original commit remains available for a source rollback if needed.
