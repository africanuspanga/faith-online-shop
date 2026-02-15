export const ADMIN_STORAGE_KEY = "admin_auth";
export const DEFAULT_ADMIN_EMAIL = "admin@faithshop.co.tz";
export const DEFAULT_ADMIN_PASSWORD = "Sharon2026?";

export const getAdminEmail = () => process.env.NEXT_PUBLIC_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
export const getAdminPassword = () => process.env.NEXT_PUBLIC_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

export const isAuthorizedAdminRequest = (request: Request) => {
  const adminPassword = request.headers.get("x-admin-password");
  if (!adminPassword) return false;
  return adminPassword === getAdminPassword();
};
