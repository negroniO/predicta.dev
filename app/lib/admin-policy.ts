// GitHub usernames can change; permissions use the stable provider account ID.
// Confirmed owner: negroniO (https://api.github.com/users/negroniO).
const OWNER_GITHUB_ID = "203515807";

export function adminGitHubIds(): string[] {
  const configured = process.env.ADMIN_GITHUB_IDS;
  return (configured === undefined ? OWNER_GITHUB_ID : configured)
    .split(",").map((id) => id.trim()).filter((id) => /^\d+$/.test(id));
}

export function isAdminGitHubId(id: string): boolean {
  return adminGitHubIds().includes(id);
}
