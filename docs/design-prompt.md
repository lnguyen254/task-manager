# Claude Design Prompt — Personal Task Manager

Design a complete web application UI for **TaskFlow**, a personal task management tool for a single user to organize their to-dos with priorities, due dates, statuses, and tags. It's a focused, no-frills productivity tool — not a project-management platform. No teams, no boards, no sharing. Think "a really well-made personal to-do app," not Jira.

## Visual direction

**Style**: Clean, minimal SaaS aesthetic — similar to Linear or Notion. Confident whitespace, quiet borders instead of heavy shadows, and a UI that gets out of the way of the content.

**Color palette**:

- Base: neutral slate/gray scale (backgrounds `slate-50`/white, borders `slate-200`, body text `slate-700–900`, muted text `slate-500`)
- Accent: a single blue (`blue-600` primary actions, `blue-50`/`blue-100` for selected/hover states) — used sparingly, for primary buttons, active nav, links, and focus rings
- Semantic colors used only for status/priority indicators (see below), never for general UI chrome
- Support both light mode (default) and a dark mode variant (`slate-900` background, `slate-100` text, same accent blue at a slightly brighter tint)

**Typography**: A clean system/sans font (Inter or similar). Clear size hierarchy — page titles ~24px semibold, section headers ~16px semibold, body ~14px regular, muted metadata ~13px. Avoid more than 3 font sizes on any single screen.

**Shape & spacing**: Rounded corners throughout (`rounded-md`, ~6-8px) — cards, buttons, inputs, badges. Generous padding inside cards and between sections (8px grid). Subtle 1px borders (`slate-200`) rather than drop shadows to separate content; use a soft shadow only on floating elements (dropdowns, modals, dialogs).

**Iconography**: Simple line icons (Lucide-style), 16-20px, used consistently for status, priority, tags, and actions — never decorative.

## Status & priority visual language

Use small pill/badge components with consistent color coding across the whole app:

- **Status**: `TODO` = neutral gray badge · `IN_PROGRESS` = blue badge · `DONE` = green badge (with a checkmark icon, and the task title shown with a subtle strikethrough or reduced opacity in list views)
- **Priority**: `LOW` = slate/gray dot or badge · `MEDIUM` = amber/yellow · `HIGH` = red — shown as a small colored dot or left-border accent on the task row, not a loud full-color badge (priority should be scannable, not shouty)
- **Due dates**: neutral by default; turn amber if due within 24 hours, red if overdue — shown as small text with a calendar icon

## Screens to design

### 1. Login

Centered card on a plain background (no marketing chrome — this is a personal tool, not a landing page). Email + password fields, primary "Log in" button, link to register. Inline validation error states (e.g., "Invalid email or password").

### 2. Register

Same layout pattern as login. Name, email, password fields with helper text for password requirements. Primary "Create account" button, link back to login.

### 3. Task list (main/home screen)

The core screen. Includes:

- Top bar: app name/logo, current user (avatar/initials + dropdown with "Log out"), primary "New task" button
- Filter/sort/search row: search input (by title), status filter, priority filter, tag filter (multi-select chips), sort dropdown (due date, priority, created date)
- Task list as rows or compact cards, each showing: checkbox or status badge, title, priority indicator, due date, tag chips, quick actions (edit, delete) on hover
- Pagination or infinite scroll footer
- Empty state: friendly illustration/icon + "No tasks yet — create your first one" with a CTA button
- Empty filtered state (distinct from true empty): "No tasks match your filters" with a "Clear filters" action

### 4. Create/edit task (modal or right-side slide-over panel — pick whichever reads cleaner)

Form fields: title (required), description (textarea, optional), status (segmented control or select), priority (segmented control or select), due date (date picker), tags (multi-select with inline "create new tag" support). Primary "Save" and secondary "Cancel" buttons. Inline Zod-style validation errors under each field.

### 5. Delete confirmation

Small, focused confirmation dialog — task title shown for context, destructive "Delete" button styled in red, "Cancel" as the safe default.

### 6. Tag management (simple, low-emphasis)

Either a small panel/modal or a section in a settings page: list of existing tags with usage count, inline rename, delete with confirmation (warn if in use).

## States to cover for the task list and forms

- Default/loaded state
- Loading state (skeleton rows, not a full-page spinner)
- Empty state vs. empty-after-filtering state (distinct copy/actions)
- Validation error state (form fields)
- Session-expired state (redirect-to-login messaging, not a silent failure)
- Toast/notification pattern for success confirmations ("Task created", "Task deleted") — small, non-blocking, auto-dismissing

## Responsive behavior

Design desktop-first (this is primarily a laptop/desktop tool), but the task list, forms, and nav must remain usable at tablet and mobile widths: filter row collapses into a single "Filters" button that opens a sheet, the slide-over form becomes full-screen on mobile, task rows stack their metadata vertically.

## Explicit non-goals

Do not design: multi-user/team features, sharing/collaboration UI, project/board views (Kanban, etc.), analytics/dashboard/reporting screens, or a marketing/landing page. This is a single-user, single-purpose tool — keep the surface area small and every screen should feel like it belongs to the same tight, unfussy product.

## Deliverable

Produce the full set of screens above as a cohesive design system — consistent components (buttons, inputs, badges, cards) reused across every screen, not one-off styling per page.
