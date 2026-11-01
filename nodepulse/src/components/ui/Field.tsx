import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (ids: { inputId: string; describedBy?: string }) => ReactNode;
}

/** Shared field wrapper: label, optional hint, and inline validation message. */
export function Field({ label, hint, error, required, children }: FieldProps) {
  const generatedId = useId();
  const inputId = `field-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('field', error && 'field--invalid')}>
      <label className="field__label" htmlFor={inputId}>
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({ inputId, describedBy })}
      {hint && !error && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, required, ...rest }: TextFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <input
          id={inputId}
          className={cn('input', error && 'input--invalid')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          required={required}
          {...rest}
        />
      )}
    </Field>
  );
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextAreaField({
  label,
  hint,
  error,
  required,
  rows = 3,
  ...rest
}: TextAreaFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <textarea
          id={inputId}
          rows={rows}
          className={cn('input', 'textarea', error && 'input--invalid')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          required={required}
          {...rest}
        />
      )}
    </Field>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
};

export function SelectField({
  label,
  options,
  hint,
  error,
  required,
  ...rest
}: SelectFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <div className="select-wrap">
          <select
            id={inputId}
            className={cn('input', 'select', error && 'input--invalid')}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            required={required}
            {...rest}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="select-wrap__chevron" size={15} aria-hidden="true" />
        </div>
      )}
    </Field>
  );
}
