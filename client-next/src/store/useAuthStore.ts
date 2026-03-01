import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

const storage = createJSONStorage(() =>
    typeof window !== 'undefined' ? window.localStorage : undefined
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
