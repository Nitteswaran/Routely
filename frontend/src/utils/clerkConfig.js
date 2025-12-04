/**
 * Check if Clerk is configured
 */
export const isClerkConfigured = () => {
  return !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
}

export default { isClerkConfigured }

