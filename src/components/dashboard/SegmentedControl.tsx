interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

// Accessible segmented control: real buttons in a radiogroup with a sliding indicator
export function SegmentedControl<T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) {
  const index = Math.max(0, options.indexOf(value));

  return (
    <div className="dash-segmented" role="radiogroup" aria-label={label}>
      <span
        className="dash-segmented-indicator"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === value}
          className={`dash-segmented-option ${option === value ? 'is-active' : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
