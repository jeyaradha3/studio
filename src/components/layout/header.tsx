import { PiggyBank } from 'lucide-react';
import type { FC } from 'react';

export const Header: FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <PiggyBank className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">
              FD Clarity
            </span>
          </a>
        </div>
      </div>
    </header>
  );
};
