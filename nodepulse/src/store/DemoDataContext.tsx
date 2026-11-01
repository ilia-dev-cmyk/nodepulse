import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  DEMO_USER,
  REGIONS,
  defaultSettings,
  demoIncidents,
  demoMonitors,
  demoNotifications,
} from '../data/demoData';
import type {
  DemoNotification,
  DemoSettings,
  Incident,
  Monitor,
  MonitorRegion,
  MonitorStatus,
} from '../data/types';

const SETTINGS_KEY = 'nodepulse.settings.v1';

interface DemoState {
  monitors: Monitor[];
  incidents: Incident[];
  notifications: DemoNotification[];
  settings: DemoSettings;
}

type Action =
  | { type: 'ADD_MONITOR'; monitor: Monitor }
  | { type: 'SET_MONITOR_STATUS'; id: string; status: MonitorStatus }
  | { type: 'RESOLVE_INCIDENT'; id: string; at: string }
  | { type: 'REOPEN_INCIDENT'; id: string; at: string }
  | { type: 'MARK_NOTIFICATION_READ'; id: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<DemoSettings> }
  | { type: 'RESET_RECORDS' };

function freshRecords(): Pick<DemoState, 'monitors' | 'incidents' | 'notifications'> {
  return {
    monitors: demoMonitors.map((monitor) => ({
      ...monitor,
      statusHistory: [...monitor.statusHistory],
      responseHistory: [...monitor.responseHistory],
    })),
    incidents: demoIncidents.map((incident) => ({
      ...incident,
      timeline: [...incident.timeline],
      affectedMonitorIds: [...incident.affectedMonitorIds],
    })),
    notifications: demoNotifications.map((notification) => ({ ...notification })),
  };
}

function isSettings(value: unknown): value is DemoSettings {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<DemoSettings>;
  return (
    typeof candidate.workspaceName === 'string' &&
    typeof candidate.defaultInterval === 'number' &&
    (candidate.timeDisplay === 'relative' || candidate.timeDisplay === 'absolute') &&
    (candidate.density === 'comfortable' || candidate.density === 'compact') &&
    (candidate.theme === 'dark' || candidate.theme === 'light') &&
    !!candidate.alerts &&
    typeof candidate.alerts.incident === 'boolean' &&
    typeof candidate.alerts.degraded === 'boolean' &&
    typeof candidate.alerts.recovery === 'boolean'
  );
}

function loadSettings(): DemoSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed: unknown = JSON.parse(raw);
    return isSettings(parsed) ? parsed : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function initialState(): DemoState {
  return {
    ...freshRecords(),
    settings: loadSettings(),
  };
}

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'ADD_MONITOR':
      return { ...state, monitors: [...state.monitors, action.monitor] };

    case 'SET_MONITOR_STATUS':
      return {
        ...state,
        monitors: state.monitors.map((monitor) =>
          monitor.id === action.id
            ? {
                ...monitor,
                status: action.status,
                lastChecked:
                  action.status === 'paused' ? monitor.lastChecked : new Date().toISOString(),
                statusHistory: [
                  {
                    at: new Date().toISOString(),
                    status: action.status,
                    note:
                      action.status === 'paused'
                        ? 'Monitoring paused in demo workspace'
                        : 'Monitoring resumed in demo workspace',
                  },
                  ...monitor.statusHistory,
                ].slice(0, 5),
              }
            : monitor,
        ),
      };

    case 'RESOLVE_INCIDENT':
      return {
        ...state,
        incidents: state.incidents.map((incident) =>
          incident.id === action.id
            ? {
                ...incident,
                status: 'resolved',
                resolvedAt: action.at,
                timeline: [
                  ...incident.timeline,
                  {
                    id: `${incident.id}-resolved-${action.at}`,
                    at: action.at,
                    title: 'Incident marked resolved',
                    detail: 'Changed in the local demo workspace. No external team was notified.',
                    author: DEMO_USER.name,
                    addedInDemo: true,
                  },
                ],
              }
            : incident,
        ),
      };

    case 'REOPEN_INCIDENT':
      return {
        ...state,
        incidents: state.incidents.map((incident) =>
          incident.id === action.id
            ? {
                ...incident,
                status: 'investigating',
                resolvedAt: null,
                timeline: [
                  ...incident.timeline,
                  {
                    id: `${incident.id}-reopened-${action.at}`,
                    at: action.at,
                    title: 'Incident reopened',
                    detail: 'Reopened in the local demo workspace for investigation.',
                    author: DEMO_USER.name,
                    addedInDemo: true,
                  },
                ],
              }
            : incident,
        ),
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.id ? { ...notification, read: true } : notification,
        ),
      };

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.patch,
          alerts: action.patch.alerts
            ? { ...state.settings.alerts, ...action.patch.alerts }
            : state.settings.alerts,
        },
      };

    case 'RESET_RECORDS':
      return { ...state, ...freshRecords() };

    default:
      return state;
  }
}

export interface NewMonitorInput {
  name: string;
  url: string;
  interval: number;
  region: MonitorRegion;
  description: string;
}

interface DemoContextValue {
  monitors: Monitor[];
  incidents: Incident[];
  notifications: DemoNotification[];
  settings: DemoSettings;
  addMonitor: (input: NewMonitorInput) => Monitor;
  setMonitorStatus: (id: string, status: MonitorStatus) => void;
  resolveIncident: (id: string) => void;
  reopenIncident: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateSettings: (patch: Partial<DemoSettings>) => void;
  resetRecords: () => void;
  getMonitor: (id: string) => Monitor | undefined;
  getIncident: (id: string) => Incident | undefined;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    } catch {
      /* Storage can be unavailable in private browsing; the demo still works. */
    }
  }, [state.settings]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute(
        'content',
        state.settings.theme === 'dark' ? '#080C14' : '#F4F7FB',
      );
    }
  }, [state.settings.theme]);

  const addMonitor = useCallback(
    (input: NewMonitorInput) => {
      const baseId = slugify(input.name) || 'monitor';
      let id = baseId;
      let suffix = 2;
      while (state.monitors.some((monitor) => monitor.id === id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      const monitor: Monitor = {
        id,
        name: input.name.trim(),
        url: input.url.trim(),
        status: 'paused',
        uptime: null,
        responseTime: null,
        region: input.region,
        regionCode:
          REGIONS.find((region) => region.name === input.region)?.code ?? 'us-east',
        interval: input.interval,
        lastChecked: null,
        description: input.description.trim(),
        responseHistory: [],
        statusHistory: [
          {
            at: new Date().toISOString(),
            status: 'paused',
            note: 'Created in the local demo workspace',
          },
        ],
        createdInDemo: true,
      };
      dispatch({ type: 'ADD_MONITOR', monitor });
      return monitor;
    },
    [state.monitors],
  );

  const value = useMemo<DemoContextValue>(
    () => ({
      monitors: state.monitors,
      incidents: state.incidents,
      notifications: state.notifications,
      settings: state.settings,
      addMonitor,
      setMonitorStatus: (id, status) => dispatch({ type: 'SET_MONITOR_STATUS', id, status }),
      resolveIncident: (id) =>
        dispatch({ type: 'RESOLVE_INCIDENT', id, at: new Date().toISOString() }),
      reopenIncident: (id) =>
        dispatch({ type: 'REOPEN_INCIDENT', id, at: new Date().toISOString() }),
      markNotificationRead: (id) => dispatch({ type: 'MARK_NOTIFICATION_READ', id }),
      markAllNotificationsRead: () => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' }),
      updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', patch }),
      resetRecords: () => dispatch({ type: 'RESET_RECORDS' }),
      getMonitor: (id) => state.monitors.find((monitor) => monitor.id === id),
      getIncident: (id) => state.incidents.find((incident) => incident.id === id),
    }),
    [state, addMonitor],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
}
