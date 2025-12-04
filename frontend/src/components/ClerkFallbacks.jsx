/**
 * Fallback components when Clerk is not available
 */

export const SignedIn = ({ children }) => <>{children}</>
export const SignedOut = ({ children }) => <>{children}</>
export const SignInButton = ({ children }) => <>{children}</>
export const SignUpButton = ({ children }) => <>{children}</>
export const UserButton = () => null
export const useUser = () => ({ user: null, isLoaded: true })
export const useAuth = () => ({ isSignedIn: false, isLoaded: true })

