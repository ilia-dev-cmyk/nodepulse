export interface MonitorFormValues {
  name: string;
  url: string;
  interval: string;
  region: string;
  description: string;
}

export type MonitorFormErrors = Partial<Record<keyof MonitorFormValues, string>>;

export function validateMonitorForm(
  values: MonitorFormValues,
  intervals: number[],
  regions: string[],
): MonitorFormErrors {
  const errors: MonitorFormErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = 'Enter a monitor name.';
  } else if (name.length < 2) {
    errors.name = 'Use at least 2 characters.';
  } else if (name.length > 60) {
    errors.name = 'Keep the name under 60 characters.';
  }

  const url = values.url.trim();
  if (!url) {
    errors.url = 'Enter the endpoint URL to check.';
  } else {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.url = 'Use an http:// or https:// URL.';
      } else if (!parsed.hostname.includes('.')) {
        errors.url = 'Enter a complete hostname, for example api.example.com.';
      }
    } catch {
      errors.url = 'Enter a valid URL, for example https://api.example.com/health.';
    }
  }

  if (!intervals.includes(Number(values.interval))) {
    errors.interval = 'Choose a monitoring interval.';
  }

  if (!regions.includes(values.region)) {
    errors.region = 'Choose a monitoring region.';
  }

  if (values.description.trim().length > 200) {
    errors.description = 'Keep the description under 200 characters.';
  }

  return errors;
}
