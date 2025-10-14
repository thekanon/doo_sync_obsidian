"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { User } from '../types/user';

interface UserContextType {
  user: User | undefined;
  setUser: (user: User | undefined) => void;
  updateUser: (updates: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children, initialUser }: { children: ReactNode, initialUser: User | undefined }) => {
  const [user, setUser] = useState<User | undefined>(initialUser);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...updates } : undefined);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
