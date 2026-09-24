// Build-time deployment mode. Never enabled by a query parameter or browser storage.
export const STAGING = process.env.NEXT_PUBLIC_MARLO_STAGING === "1";
