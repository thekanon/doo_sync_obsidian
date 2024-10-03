import React from 'react';
import Header from '../components/Header';

const ObsidianLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex-grow overflow-y-auto">{children}</div>
    </div>
  );
};

export default ObsidianLayout;
