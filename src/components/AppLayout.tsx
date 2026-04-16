import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
  bgImage?: string;
}

export function AppLayout({ children, bgImage }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full relative overflow-hidden">
      {bgImage && (
        <>
          <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover z-0" width={1920} height={1080} />
          <div className="absolute inset-0 bg-background/30 backdrop-blur-sm z-0" />
        </>
      )}
      {!bgImage && (
        <>
          <div className="ambient-blob-1" />
          <div className="ambient-blob-2" />
        </>
      )}
      <AppSidebar />
      <main className="relative z-10 flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
