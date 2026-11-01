import { Search, X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
  size?: 'md' | 'sm';
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label,
  className,
  size = 'md',
}: SearchInputProps) {
  return (
    <div className={cn('search-input', `search-input--${size}`, className)}>
      <Search size={15} className="search-input__icon" aria-hidden="true" />
      <input
        type="search"
        className="search-input__field"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          className="search-input__clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
