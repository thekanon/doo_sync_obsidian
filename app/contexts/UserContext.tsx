"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types/user';

interface UserContextType {
  user: User | undefined;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children, initialUser }: { children: ReactNode, initialUser: User | undefined }) => {
  const [user] = useState<User | undefined>(initialUser);

  return (
    <UserContext.Provider value={{ user }}>
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
