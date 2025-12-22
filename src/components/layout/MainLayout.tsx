import * as React from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = React.forwardRef<HTMLDivElement, MainLayoutProps>(
  ({ children }, ref) => {
    return (
      <div ref={ref} className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 min-h-screen transition-all duration-300">
          {children}
        </main>
      </div>
    );
  }
);

MainLayout.displayName = 'MainLayout';
