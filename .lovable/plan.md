# Clear Sky rollout and admin directory

## What will change

- Apply the attached Clear Sky palette globally: sky-wash canvas, ink-navy text, cloud-like borders/shadows, 16px cards, 10px controls, pill badges, and Inter 450/560 weights. Existing semantic tokens remain the source of truth, including coordinated dark-mode values.
- Carry the existing pencil-line doodle language into headers, panels, dialogs, player/quiz surfaces, and specified empty states without altering page structure or workflows.
- Redesign Certificates with illustrated credential cards, individual Download/Share actions, and a Download All ZIP flow with live item progress.
- Add visible-data CSV downloads to every requested admin, trainer, mandatory-compliance, report, and leaderboard table using the required dated filenames.
- Rebuild Users & Progress as a responsive directory with a collapsible filter drawer, dismissible active-filter chips, full column set, row selection, bulk actions, import validation, and clear empty/error states.
- Add a 420px edit-user drawer, save feedback, and the confirmed Login As placeholder flow while preserving the existing progress drill-down.

## Interaction details

- Filters combine across text, multi-select, and joining-date ranges; Clear All resets the directory. Fields absent from the current data contract are deterministically derived in the screen for realistic filtering and editing without changing type or mock files.
- CSV import accepts dropped or selected files, reports validating/ready/error states, offers a generated sample file, and calls the existing addUser function once per valid row after confirmation.
- Certificate downloads generate lightweight client-side certificate files and package them with JSZip loaded only in the browser from cdnjs. Share uses the native share sheet when available and clipboard fallback otherwise.
- Disabled Login As controls remain visibly secondary and explain the backend requirement; the drawer action shows the requested confirmation and informational toast.

## Technical details

- Add reusable CSV/export and illustrated-empty-state presentation helpers where that reduces duplication.
- Add only the requested updateUser function to the repository module with `// CONNECT: PUT /api/admin/users/:id`; no existing repository bodies or data type/mock files will change.
- Preserve TanStack routes, existing queries, `EMPTY_STATE`, reduced-motion behavior, dark mode, semantic tokens, and current data flow.
- Validate representative learner, trainer, and admin pages at desktop and mobile sizes; exercise filtering, import, drawers/dialogs, CSV/ZIP downloads, and verify the final preview build.
