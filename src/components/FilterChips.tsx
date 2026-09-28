export interface FilterChip {
  label: string;
  value: string;
  icon?: JSX.Element;
}

interface FilterChipsProps {
  chips: FilterChip[];
  activeValue?: string | null;
  onSelect?: (value: string) => void;
  className?: string;
}

/** Horizontal, scrollable row of text-tab style filters (Behance-like). */
export default function FilterChips({ chips, activeValue, onSelect, className = '' }: FilterChipsProps): JSX.Element {
  return (
    <div
      className={`scrollbar-hide flex gap-1 overflow-x-auto pb-1 ${className}`}
      role="tablist"
      aria-label="Filter options"
    >
      {chips.map((chip) => {
        const isActive = activeValue != null && chip.value === activeValue;
        return (
          <button
            key={chip.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect?.(chip.value)}
            className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors ${
              isActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-500 hover:text-gray-900'
            }`}
          >
            {chip.icon ?? null}
            <span>{chip.label}</span>
            <span
              className={`absolute inset-x-3 bottom-0.5 h-[2px] rounded-full bg-gray-900 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}