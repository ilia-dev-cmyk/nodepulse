import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SelectField, TextAreaField, TextField } from '../ui/Field';
import { DemoNote } from '../ui/DemoNote';
import { INTERVAL_OPTIONS, REGIONS } from '../../data/demoData';
import type { Monitor, MonitorRegion } from '../../data/types';
import { validateMonitorForm, type MonitorFormErrors, type MonitorFormValues } from '../../lib/validation';
import { useDemo } from '../../store/DemoDataContext';
import { useToast } from '../../store/ToastContext';

const INTERVAL_SELECT = INTERVAL_OPTIONS.map((minutes) => ({
  value: String(minutes),
  label: minutes === 60 ? 'Every 60 minutes' : `Every ${minutes} minute${minutes === 1 ? '' : 's'}`,
}));

const REGION_SELECT = REGIONS.map((region) => ({
  value: region.name,
  label: `${region.name} · ${region.code}`,
}));

export function AddMonitorDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (monitor: Monitor) => void;
}) {
  const { settings, addMonitor } = useDemo();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<MonitorFormValues>({
    name: '',
    url: '',
    interval: String(settings.defaultInterval),
    region: REGIONS[0].name,
    description: '',
  });
  const [errors, setErrors] = useState<MonitorFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues({
      name: '',
      url: '',
      interval: String(settings.defaultInterval),
      region: REGIONS[0].name,
      description: '',
    });
    setErrors({});
    setSubmitted(false);
  }, [open, settings.defaultInterval]);

  const update = (field: keyof MonitorFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (submitted) {
      const next = validateMonitorForm(
        { ...values, [field]: value },
        INTERVAL_OPTIONS,
        REGIONS.map((region) => region.name),
      );
      setErrors(next);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = validateMonitorForm(
      values,
      INTERVAL_OPTIONS,
      REGIONS.map((region) => region.name),
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }

    const monitor = addMonitor({
      name: values.name,
      url: values.url,
      interval: Number(values.interval),
      region: values.region as MonitorRegion,
      description: values.description.trim() || 'Added in the local demo workspace.',
    });
    showToast(
      `${monitor.name} added to the demo workspace in a paused state. No real checks will run.`,
      'success',
    );
    onAdded(monitor);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add monitor"
      description="Create a sample monitor in this demo workspace."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="add-monitor-form">
            Add monitor
          </Button>
        </>
      }
    >
      <form id="add-monitor-form" ref={formRef} onSubmit={handleSubmit} noValidate className="form">
        <TextField
          label="Monitor name"
          placeholder="Payments API"
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          error={errors.name}
          required
          maxLength={60}
          autoComplete="off"
        />
        <TextField
          label="Endpoint URL"
          placeholder="https://api.example.com/health"
          value={values.url}
          onChange={(event) => update('url', event.target.value)}
          error={errors.url}
          hint="The demo does not contact this URL — it is only stored locally."
          required
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="form__row">
          <SelectField
            label="Monitoring interval"
            value={values.interval}
            onChange={(event) => update('interval', event.target.value)}
            options={INTERVAL_SELECT}
            error={errors.interval}
            required
          />
          <SelectField
            label="Region"
            value={values.region}
            onChange={(event) => update('region', event.target.value)}
            options={REGION_SELECT}
            error={errors.region}
            required
          />
        </div>
        <TextAreaField
          label="Description"
          placeholder="What does this service do?"
          value={values.description}
          onChange={(event) => update('description', event.target.value)}
          error={errors.description}
          hint="Optional · shown in the monitor detail panel."
          maxLength={200}
        />
        <DemoNote variant="demo">
          New monitors are local demo records. They are created in a paused state because no real
          network monitoring runs; resume them to include them in filters and workspace counts.
        </DemoNote>
      </form>
    </Modal>
  );
}
