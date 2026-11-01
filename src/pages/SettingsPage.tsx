import { useEffect, useId, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  Check,
  Database,
  Gauge,
  Moon,
  Palette,
  RotateCcw,
  Sun,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { SettingSwitch as Switch } from '../components/ui/Switch';
import { DemoNote } from '../components/ui/DemoNote';
import { useSearchParams } from 'react-router-dom';
import { useDemo } from '../store/DemoDataContext';
import { useToast } from '../store/ToastContext';
import { INTERVAL_OPTIONS } from '../data/demoData';
import type { DemoSettings } from '../data/types';
import { formatAbsolute, formatRelative, hoursAgo } from '../lib/format';
import { cn } from '../lib/cn';

type SettingsTab = 'workspace' | 'monitoring' | 'notifications' | 'appearance' | 'data';

const TABS: { id: SettingsTab; label: string; icon: typeof Building2 }[] = [
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'monitoring', label: 'Monitoring', icon: Gauge },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Demo data', icon: Database },
];

const TIME_PREVIEW = {
  relative: formatRelative(hoursAgo(3)),
  absolute: formatAbsolute(hoursAgo(3)),
};

const TAB_QUERY: Record<string, SettingsTab> = {
  workspace: 'workspace',
  monitoring: 'monitoring',
  notifications: 'notifications',
  appearance: 'appearance',
  data: 'data',
};

export function SettingsPage() {
  const { settings, updateSettings, resetRecords, monitors, incidents } = useDemo();
  const { showToast } = useToast();
  const [tab, setTab] = useState<SettingsTab>('workspace');
  const [draft, setDraft] = useState<DemoSettings>(settings);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep links such as /app/settings?tab=data open that section, then clean the URL.
  useEffect(() => {
    const requested = searchParams.get('tab');
    if (!requested || !TAB_QUERY[requested]) return;
    setTab(TAB_QUERY[requested]);
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('tab');
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);
  const tabListRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const dirtyFields: string[] = [];
  if (draft.workspaceName !== settings.workspaceName) dirtyFields.push('workspaceName');
  if (draft.defaultInterval !== settings.defaultInterval) dirtyFields.push('defaultInterval');
  if (draft.timeDisplay !== settings.timeDisplay) dirtyFields.push('timeDisplay');
  if (draft.density !== settings.density) dirtyFields.push('density');
  if (
    draft.alerts.incident !== settings.alerts.incident ||
    draft.alerts.degraded !== settings.alerts.degraded ||
    draft.alerts.recovery !== settings.alerts.recovery
  ) {
    dirtyFields.push('alerts');
  }
  const isDirty = dirtyFields.length > 0;

  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Workspace name is required.';
    if (trimmed.length < 2) return 'Use at least 2 characters.';
    if (trimmed.length > 48) return 'Keep the workspace name under 48 characters.';
    return null;
  };

  const handleSave = () => {
    const error = validateName(draft.workspaceName);
    setNameError(error);
    if (error) {
      setTab('workspace');
      return;
    }
    updateSettings({
      ...draft,
      workspaceName: draft.workspaceName.trim(),
      theme: settings.theme,
    });
    setDraft((current) => ({ ...current, workspaceName: current.workspaceName.trim() }));
    setSavedAt(new Date().toISOString());
    showToast('Settings saved to this browser.', 'success');
  };

  const handleDiscard = () => {
    setDraft(settings);
    setNameError(null);
    showToast('Unsaved settings changes discarded.', 'info');
  };

  const handleTheme = (theme: DemoSettings['theme']) => {
    setDraft((current) => ({ ...current, theme }));
    updateSettings({ theme });
    setSavedAt(new Date().toISOString());
    showToast(`${theme === 'dark' ? 'Dark' : 'Light'} theme applied and saved.`, 'success');
  };

  const handleConfirmReset = () => {
    resetRecords();
    setResetOpen(false);
    showToast('Demo monitors, incidents, and notifications restored to their sample state.', 'success');
  };

  const focusTab = (direction: 1 | -1) => {
    const buttons = Array.from(
      tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    const currentIndex = buttons.findIndex((button) => button.dataset.tab === tab);
    const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
    const next = buttons[nextIndex];
    if (next?.dataset.tab) {
      setTab(next.dataset.tab as SettingsTab);
      next.focus();
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Settings"
        description="Configure this demo workspace. Settings are stored in your browser and never sent to a server."
        meta={<Badge tone="neutral">Local only</Badge>}
        actions={
          <div className="settings-actions">
            {isDirty && <span className="settings-actions__dirty">{dirtyFields.length} unsaved change{dirtyFields.length === 1 ? '' : 's'}</span>}
            <Button variant="ghost" onClick={handleDiscard} disabled={!isDirty}>
              Discard
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!isDirty} iconLeft={<Check size={15} aria-hidden="true" />}>
              Save changes
            </Button>
          </div>
        }
      />

      <div className="settings-layout">
        <div
          className="settings-tabs"
          role="tablist"
          aria-orientation="vertical"
          aria-label="Settings sections"
          ref={tabListRef}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
              event.preventDefault();
              focusTab(1);
            } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
              event.preventDefault();
              focusTab(-1);
            }
          }}
        >
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                data-tab={item.id}
                id={`settings-tab-${item.id}`}
                aria-selected={active}
                aria-controls={panelId}
                tabIndex={active ? 0 : -1}
                className={cn('settings-tab', active && 'is-active')}
                onClick={() => setTab(item.id)}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
          <div className="settings-tabs__note">
            <p className="meta-label">Persistence</p>
            <p>
              Settings and theme are saved to localStorage. Demo monitors, incidents, and
              notification state reset when the page reloads.
            </p>
          </div>
        </div>

        <div
          className="settings-panel"
          id={panelId}
          role="tabpanel"
          aria-labelledby={`settings-tab-${tab}`}
          tabIndex={0}
        >
          {isDirty && (
            <div className="unsaved-bar" role="status">
              <span>Unsaved changes to this section.</span>
              <div className="unsaved-bar__actions">
                <button type="button" className="text-button" onClick={handleDiscard}>
                  Discard
                </button>
                <Button size="sm" variant="primary" onClick={handleSave}>
                  Save changes
                </Button>
              </div>
            </div>
          )}

          {tab === 'workspace' && (
            <Card>
              <CardHeader
                title="Workspace"
                description="Identity shown in the sidebar and topbar of this demo."
              />
              <div className="settings-form">
                <label className="field" htmlFor="workspace-name">
                  <span className="field__label">Workspace name</span>
                  <input
                    id="workspace-name"
                    type="text"
                    className={cn('input', nameError && 'input--invalid')}
                    value={draft.workspaceName}
                    maxLength={48}
                    aria-invalid={nameError ? true : undefined}
                    aria-describedby={nameError ? 'workspace-name-error' : 'workspace-name-hint'}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDraft((current) => ({ ...current, workspaceName: value }));
                      setNameError(nameError ? validateName(value) : null);
                    }}
                    onBlur={() => setNameError(validateName(draft.workspaceName))}
                  />
                  {nameError ? (
                    <p className="field__error" id="workspace-name-error">
                      {nameError}
                    </p>
                  ) : (
                    <p className="field__hint" id="workspace-name-hint">
                      Displayed across the demo dashboard. 2–48 characters.
                    </p>
                  )}
                </label>

                <div className="info-grid">
                  <div className="info-row">
                    <span className="meta-label">Workspace ID</span>
                    <span className="mono">ws_aurora_demo</span>
                  </div>
                  <div className="info-row">
                    <span className="meta-label">Plan</span>
                    <span>Portfolio demonstration</span>
                  </div>
                  <div className="info-row">
                    <span className="meta-label">Current records</span>
                    <span>
                      {monitors.length} monitors · {incidents.length} incidents
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="meta-label">Data residency</span>
                    <span>This browser only</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {tab === 'monitoring' && (
            <Card>
              <CardHeader
                title="Monitoring preferences"
                description="Defaults applied when new demo monitors are created."
              />
              <div className="settings-form">
                <label className="field" htmlFor="default-interval">
                  <span className="field__label">Default monitoring interval</span>
                  <div className="select-wrap">
                    <select
                      id="default-interval"
                      className="input select"
                      value={draft.defaultInterval}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          defaultInterval: Number(event.target.value),
                        }))
                      }
                    >
                      {INTERVAL_OPTIONS.map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes === 60 ? 'Every 60 minutes' : `Every ${minutes} minute${minutes === 1 ? '' : 's'}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="field__hint">
                    Used as the pre-selected interval in the Add monitor form. No real checks are
                    scheduled.
                  </p>
                </label>

                <fieldset className="option-fieldset">
                  <legend className="field__label">Timestamp display</legend>
                  <div className="option-grid">
                    {(['relative', 'absolute'] as const).map((value) => (
                      <label
                        key={value}
                        className={cn('radio-card', draft.timeDisplay === value && 'is-checked')}
                      >
                        <input
                          type="radio"
                          name="time-display"
                          value={value}
                          checked={draft.timeDisplay === value}
                          onChange={() => setDraft((current) => ({ ...current, timeDisplay: value }))}
                        />
                        <span className="radio-card__title">
                          {value === 'relative' ? 'Relative time' : 'Absolute time (UTC)'}
                        </span>
                        <span className="radio-card__preview mono">{TIME_PREVIEW[value]}</span>
                        <span className="radio-card__description">
                          {value === 'relative'
                            ? 'Shows how long ago a check happened.'
                            : 'Shows an exact UTC timestamp.'}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="option-fieldset">
                  <legend className="field__label">Table density</legend>
                  <div className="option-grid">
                    {(['comfortable', 'compact'] as const).map((value) => (
                      <label
                        key={value}
                        className={cn('radio-card', draft.density === value && 'is-checked')}
                      >
                        <input
                          type="radio"
                          name="density"
                          value={value}
                          checked={draft.density === value}
                          onChange={() => setDraft((current) => ({ ...current, density: value }))}
                        />
                        <span className="radio-card__title">
                          {value === 'comfortable' ? 'Comfortable' : 'Compact'}
                        </span>
                        <span className="radio-card__description">
                          {value === 'comfortable'
                            ? 'Roomier rows for easier scanning.'
                            : 'Tighter rows to fit more monitors on screen.'}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <p className="field__hint">Density applies to every table in the workspace.</p>
              </div>
            </Card>
          )}

          {tab === 'notifications' && (
            <Card>
              <CardHeader
                title="Notifications"
                description="Sample alert preferences for the demo workspace."
              />
              <div className="switch-list">
                <Switch
                  label="Incident alerts"
                  description="Notify when a monitor enters a down state and an incident is opened."
                  checked={draft.alerts.incident}
                  onChange={(checked) =>
                    setDraft((current) => ({
                      ...current,
                      alerts: { ...current.alerts, incident: checked },
                    }))
                  }
                />
                <Switch
                  label="Degraded service alerts"
                  description="Notify when response times cross the degraded threshold."
                  checked={draft.alerts.degraded}
                  onChange={(checked) =>
                    setDraft((current) => ({
                      ...current,
                      alerts: { ...current.alerts, degraded: checked },
                    }))
                  }
                />
                <Switch
                  label="Recovery alerts"
                  description="Notify when a failing monitor returns to an operational state."
                  checked={draft.alerts.recovery}
                  onChange={(checked) =>
                    setDraft((current) => ({
                      ...current,
                      alerts: { ...current.alerts, recovery: checked },
                    }))
                  }
                />
              </div>
              <DemoNote>
                These switches are stored with your local settings. NodePulse does not send email,
                SMS, chat messages, or webhook calls in this demo.
              </DemoNote>
            </Card>
          )}

          {tab === 'appearance' && (
            <Card>
              <CardHeader
                title="Appearance"
                description="Dark is the primary theme; the light theme is a fully designed alternative."
                actions={<Badge tone="accent">Applies immediately</Badge>}
              />
              <fieldset className="option-fieldset">
                <legend className="sr-only">Theme</legend>
                <div className="theme-grid">
                  {(['dark', 'light'] as const).map((value) => (
                    <label
                      key={value}
                      className={cn('theme-card', draft.theme === value && 'is-checked')}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={value}
                        checked={draft.theme === value}
                        onChange={() => handleTheme(value)}
                      />
                      <span className={cn('theme-card__preview', `theme-card__preview--${value}`)}>
                        <span className="theme-card__preview-bar" />
                        <span className="theme-card__preview-body">
                          <span className="theme-card__preview-chart" />
                          <span className="theme-card__preview-lines" />
                        </span>
                      </span>
                      <span className="theme-card__label">
                        {value === 'dark' ? <Moon size={14} aria-hidden="true" /> : <Sun size={14} aria-hidden="true" />}
                        {value === 'dark' ? 'Dark' : 'Light'}
                        {settings.theme === value && <span className="theme-card__current">Current</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="field__hint">
                The theme choice is applied and saved immediately, and is respected on your next
                visit to this browser.
              </p>
            </Card>
          )}

          {tab === 'data' && (
            <Card>
              <CardHeader
                title="Demo data"
                description="Understand what this workspace stores and how to restore it."
              />
              <div className="settings-form">
                <div className="info-grid">
                  <div className="info-row">
                    <span className="meta-label">Dataset</span>
                    <span>Deterministic fictional sample data</span>
                  </div>
                  <div className="info-row">
                    <span className="meta-label">Network monitoring</span>
                    <span>Not performed</span>
                  </div>
                  <div className="info-row">
                    <span className="meta-label">Backend or database</span>
                    <span>None</span>
                  </div>
                  <div className="info-row">
                    <span className="meta-label">Persisted values</span>
                    <span>Workspace settings and theme only</span>
                  </div>
                </div>
                <DemoNote variant="demo">
                  Record changes made in this session — added monitors, paused monitors, and resolved
                  incidents — reset on reload. Use the reset button below to restore the seeded
                  dataset immediately.
                </DemoNote>
                <div className="danger-zone">
                  <div>
                    <p className="switch-row__label">Reset demo records</p>
                    <p className="switch-row__description">
                      Restores seeded monitors, incidents, and notifications. Settings and theme are
                      kept.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    iconLeft={<RotateCcw size={15} aria-hidden="true" />}
                    onClick={() => setResetOpen(true)}
                  >
                    Reset demo data
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {savedAt && (
            <p className="settings-saved" role="status">
              <Check size={14} aria-hidden="true" />
              Last saved {formatRelative(savedAt)} · stored in this browser
            </p>
          )}
        </div>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset demo records?"
        description="This restores the seeded sample monitors, incidents, and notifications."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmReset}>
              Reset demo data
            </Button>
          </>
        }
      >
        <p className="text-secondary">
          Any monitors added in this session and any incident state changes will be discarded. Your
          workspace name, monitoring preferences, and theme will be kept.
        </p>
      </Modal>
    </div>
  );
}
