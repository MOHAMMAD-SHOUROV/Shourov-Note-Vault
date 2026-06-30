import { useState, useEffect, useContext, createContext } from "react";

const OWNER_TOKEN_KEY = "vault_owner_token";

interface OwnerContextType {
  isOwner: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

export const OwnerContext = createContext<OwnerContextType>({
  isOwner: false,
  token: null,
  login: () => {},
  logout: () => {},
});

export function useOwnerState(): OwnerContextType {
  const [isOwner, setIsOwner] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(OWNER_TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      setIsOwner(true);
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem(OWNER_TOKEN_KEY, newToken);
    setToken(newToken);
    setIsOwner(true);
  };

  const logout = () => {
    localStorage.removeItem(OWNER_TOKEN_KEY);
    setToken(null);
    setIsOwner(false);
  };

  return { isOwner, token, login, logout };
}

export function useOwner() {
  return useContext(OwnerContext);
}
