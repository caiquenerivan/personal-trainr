import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

type Props = {
  id: string;
  children: ReactNode;
};

// Cartão arrastável: só a alça (⋮⋮) inicia o arraste, para não atrapalhar
// os campos do cartão.
export function SortableCard({ id, children }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative flex rounded-xl bg-base ${
        isDragging ? 'z-10 shadow-2xl shadow-black/60 ring-1 ring-accent' : ''
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={`flex w-9 shrink-0 touch-none items-center justify-center rounded-l-xl border-r border-border/40 text-text-secondary transition hover:bg-card hover:text-accent ${
          isDragging ? 'cursor-grabbing text-accent' : 'cursor-grab'
        }`}
        title="Arraste para mudar a ordem"
        aria-label="Arrastar exercício para mudar a ordem"
      >
        <GripVertical size={18} />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
