import { Menu, Search } from 'lucide-react';
import type { UserData } from '../api/auth';

type HeaderProps = {
  onToggleSidebar: () => void;
  user: UserData | null;
};

export function Header({ onToggleSidebar, user }: HeaderProps) {
  return (
    <header className="mb-6 flex items-center gap-4">
      <button
        onClick={onToggleSidebar}
        className="flex items-center justify-center text-text-secondary hover:text-accent md:hidden min-h-[44px] min-w-[44px]"
      >
        <Menu size={24} />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          type="text"
          placeholder="Buscar..."
          className="h-10 w-full rounded-lg border border-border bg-base pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-accent"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-base text-xs uppercase text-text-secondary">
            {user?.name?.charAt(0) ?? '?'}
          </div>
        )}
        <span className="hidden text-sm text-text-primary sm:inline">
          {user?.name ?? 'Usuário'}
        </span>
      </div>
    </header>
  );
}
