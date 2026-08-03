import { Star } from 'lucide-react';

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
};

export function StarRating({ value, onChange, size = 20, readOnly = false }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => {
        const fillPercent = Math.max(0, Math.min(1, value - (star - 1))) * 100;

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            className={`relative ${readOnly ? 'cursor-default' : 'cursor-pointer active:scale-90 transition-transform'}`}
            style={{ width: size, height: size }}
            aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
          >
            <Star size={size} className="absolute inset-0 text-border" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
            >
              <Star size={size} className="text-accent fill-accent" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
