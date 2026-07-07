import { Menu } from 'lucide-react';
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
