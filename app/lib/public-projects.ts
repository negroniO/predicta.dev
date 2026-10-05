// Unknown states are private by default, including in feeds and tracking APIs.
export const PUBLIC_PROJECT_STATUSES = ["Completed", "In Progress"];
export const publicProjectWhere = { status: { in: PUBLIC_PROJECT_STATUSES } };
