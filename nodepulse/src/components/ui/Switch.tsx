import { useId } from 'react';

export function SettingSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="switch-row">
      <div className="switch-row__copy">
        <p className="switch-row__label" id={id}>
          {label}
        </p>
        <p className="switch-row__description">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        className={checked ? 'switch is-on' : 'switch'}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__thumb" aria-hidden="true" />
      </button>
    </div>
  );
}
