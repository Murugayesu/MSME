import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function signup(email, password, username) {
        return Promise.resolve();
    }

    function login(email, password) {
        return Promise.resolve();
    }

    function logout() {
        return Promise.resolve();
    }

    useEffect(() => {
        // Mock authentication bypass for development
        setCurrentUser({
            uid: "dev_user_123",
            email: "dev@example.com",
            displayName: "Dev Farmer",
            getIdToken: async () => "fake-token"
        });
        setLoading(false);
    }, []);

    const value = {
        currentUser,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
