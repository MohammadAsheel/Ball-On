import React from 'react';

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1560px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {children}
    </div>
  );
}
