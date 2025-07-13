import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('spotify_access_token'));

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('spotify_access_token', accessToken);
    } else {
      localStorage.removeItem('spotify_access_token');
    }
  }, [accessToken]);

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem('spotify_access_token');
    sessionStorage.removeItem('spotify_code_verifier');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!accessToken, accessToken, setAccessToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
} 