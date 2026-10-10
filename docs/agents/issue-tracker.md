# Issue tracker: Linear

Issues and PRDs for this repository live in Linear.

- **Team:** `Acolhe` (`ACO`)
- **Project:** `Frontend`
- **Project ID:** `5f83520b-63ce-4c23-ad8e-8c5f0e7eef21`
- **Project URL:** https://linear.app/acolhe/project/frontend-0736bc525736

Use the Linear MCP tools for all operations.

## Conventions

- **Create an issue:** create it in team `Acolhe` and project `Frontend`.
- **Read an issue:** retrieve it by UUID or identifier such as `ACO-123`, including relations when relevant; fetch its comments separately.
- **List issues:** filter by team `Acolhe` and project `Frontend`, adding state or label filters as needed.
- **Comment on an issue:** create a top-level comment associated with the issue identifier.
- **Apply or remove labels:** read the current issue first, then update its complete label set. Linear label updates replace the full set.
- **Close an issue:** move it to the `Done` state.
- **Cancel an issue:** move it to the `Canceled` state.
- **Mark a duplicate:** set its duplicate relation and use the `Duplicate` state.

## Triage roles and workflow statuses

Triage roles are Linear labels, not workflow statuses. Keep exactly one triage-state label on each triaged issue:

- `needs-triage`
- `needs-info`
- `ready-for-agent`
- `ready-for-human`
- `wontfix`

Linear workflow statuses independently track execution progress. Moving an issue between `Backlog`, `Todo`, `In Progress`, `In Review`, and `Done` does not replace its triage label.

When rejecting an issue, apply `wontfix` and move it to `Canceled`. When resolving implemented work, move it to `Done`.

## When a skill says "publish to the issue tracker"

Create a Linear issue in team `Acolhe`, project `Frontend`.

## When a skill says "fetch the relevant ticket"

Retrieve the Linear issue by UUID or `ACO-<number>`, including its comments and relevant relations.

## Wayfinding operations

Used by `/wayfinder`. The **map** is one parent issue with child issues as tickets.

- **Map:** a Linear issue in project `Frontend` containing the Notes, Decisions-so-far, and Fog sections.
- **Child ticket:** a child issue linked through `parentId`. Apply a `wayfinder:<type>` label (`research`, `prototype`, `grilling`, or `task`).
- **Blocking:** use Linear's native blocking relations.
- **Frontier:** list open child issues, exclude assigned or blocked issues, and select the first remaining child in map order.
- **Claim:** assign the child issue to the current user before beginning work.
- **Resolve:** add the answer as a comment, move the child to `Done`, then add a context pointer to the map's Decisions-so-far.
