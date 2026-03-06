import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';

type User = {
    id: string;
    email?: string;
    username?: string;
    isAdmin?: boolean;
    token?: string;
    avatar?: string;
};

type AuthState = {
    user: User | null;
    setUser: (user: User | null) => void;
    signOut: () => void;
};

const createNoopStorage = (): StateStorage => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
});

const storage = createJSONStorage(() =>
    typeof window !== 'undefined' ? window.localStorage : createNoopStorage()
);

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            signOut: () => set({ user: null }),
        }),
        {
            name: 'ss-auth',
            storage,
            partialize: (state) => ({ user: state.user }),
        }
    )
);
