/**
 * Secure authentication hook with sessionStorage
 * Tokens are NOT exposed in state, only user data is cached
 * httpOnly cookies should be used for token storage in production
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    setAuth: (user: User) => void;
    logout: () => void;
    // Support for token refresh
    setUser: (user: User) => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,

            setAuth: (user: User) => {
                // Token should be in httpOnly cookie (set by backend)
                // Only store user data in state
                set({ user, isAuthenticated: true });
            },

            setUser: (user: User) => {
                set({ user });
            },

            logout: () => {
                // Clear all auth data
                set({ user: null, isAuthenticated: false });
                
                // Make logout API call (backend clears httpOnly cookie)
                fetch("/api/logout", {
                    method: "POST",
                    credentials: "include",
                }).catch(error => {
                    console.error("Logout failed:", error);
                });
            },
        }),
        {
            name: "auth-storage",
            storage: {
                getItem: (key) => {
                    const value = sessionStorage.getItem(key);
                    return value ? JSON.parse(value) : null;
                },
                setItem: (key, value) => {
                    sessionStorage.setItem(key, JSON.stringify(value));
                },
                removeItem: (key) => {
                    sessionStorage.removeItem(key);
                },
            },
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
    const { isAuthenticated } = useAuth();
    return isAuthenticated;
}

/**
 * Hook to get current user
 */
export function useCurrentUser(): User | null {
    const { user } = useAuth();
    return user;
}

/**
 * Hook for logout action
 */
export function useLogout(): () => void {
    const { logout } = useAuth();
    return logout;
}
