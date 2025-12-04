/**
 * Wrapper components that safely handle Clerk integration
 * Provides fallbacks when Clerk is not configured
 */

let SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser, useAuth

const isClerkAvailable = () => {
  try {
    const clerk = require('@clerk/clerk-react')
    SignedIn = clerk.SignedIn
    SignedOut = clerk.SignedOut
    SignInButton = clerk.SignInButton
    SignUpButton = clerk.SignUpButton
    UserButton = clerk.UserButton
    useUser = clerk.useUser
    useAuth = clerk.useAuth
    return true
  } catch (error) {
    return false
  }
}

const clerkAvailable = isClerkAvailable()

// Fallback components
if (!clerkAvailable) {
  SignedIn = ({ children }) => <>{children}</>
  SignedOut = ({ children }) => <>{children}</>
  SignInButton = ({ children, mode }) => <>{children}</>
  SignUpButton = ({ children, mode }) => <>{children}</>
  UserButton = () => null
  useUser = () => ({ user: null, isLoaded: true })
  useAuth = () => ({ isSignedIn: false, isLoaded: true })
}

export { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser, useAuth }
export default { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser, useAuth }

