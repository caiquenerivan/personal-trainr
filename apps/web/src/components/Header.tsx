import { Menu } from 'lucide-react';

type HeaderProps = {
  onToggleSidebar: () => void;
};

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="mb-6 flex items-center gap-4 md:hidden">
      <button
        onClick={onToggleSidebar}
        className="flex items-center justify-center text-text-secondary hover:text-accent min-h-[44px] min-w-[44px]"
      >
        <Menu size={24} />
      </button>
    </header>
  );
}
