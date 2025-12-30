import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  userType?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: 1,
    username: 'demo',
    email: 'demo@example.com',
    displayName: 'Demo User',
    userType: 'user'
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      setUser({
        id: 1,
        username,
        email: `${username}@example.com`,
        displayName: username,
        userType: 'user'
      });
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return { user: { id: 1, username: 'demo', email: 'demo@example.com', displayName: 'Demo User', userType: 'user' }, isLoading: false, login: async () => true, logout: () => {} };
  }
  return context;
}
