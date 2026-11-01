import { Bell, CheckCheck, CircleAlert, CircleCheck, Inbox, TriangleAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Popover } from '../ui/Popover';
import { useDemo } from '../../store/DemoDataContext';
import { getUnreadNotificationCount } from '../../lib/selectors';
import { formatTimestamp } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { NotificationKind } from '../../data/types';

const KIND_ICON = {
  down: CircleAlert,
  degraded: TriangleAlert,
  recovered: CircleCheck,
  digest: Inbox,
} as const;

const KIND_CLASS: Record<NotificationKind, string> = {
  down: 'notification--down',
  degraded: 'notification--warning',
  recovered: 'notification--healthy',
  digest: 'notification--neutral',
};

export function NotificationMenu() {
  const { notifications, settings, markNotificationRead, markAllNotificationsRead } = useDemo();
  const navigate = useNavigate();
  const unread = getUnreadNotificationCount(notifications);

  return (
    <Popover
      label="Notifications"
      panelClassName="notification-panel"
      trigger={({ onClick, ref, ...aria }) => (
        <button
          type="button"
          className="icon-btn topbar__icon-btn"
          onClick={onClick}
          ref={ref}
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          {...aria}
        >
          <Bell size={17} aria-hidden="true" />
          {unread > 0 && <span className="icon-btn__badge" aria-hidden="true">{unread}</span>}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="notification-panel__header">
            <div>
              <p className="menu__title">Notifications</p>
              <p className="menu__hint">{unread > 0 ? `${unread} unread sample alerts` : 'All caught up'}</p>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => markAllNotificationsRead()}
              disabled={unread === 0}
            >
              <CheckCheck size={14} aria-hidden="true" />
              Mark all read
            </button>
          </div>
          <ul className="notification-list">
            {notifications.map((notification) => {
              const Icon = KIND_ICON[notification.kind];
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={cn(
                      'notification',
                      KIND_CLASS[notification.kind],
                      notification.read && 'is-read',
                    )}
                    onClick={() => {
                      markNotificationRead(notification.id);
                      close();
                      navigate(notification.href);
                    }}
                  >
                    <span className="notification__icon" aria-hidden="true">
                      <Icon size={15} />
                    </span>
                    <span className="notification__content">
                      <span className="notification__title">
                        {notification.title}
                        {!notification.read && (
                          <span className="notification__unread" aria-label="Unread" />
                        )}
                      </span>
                      <span className="notification__body">{notification.body}</span>
                      <span className="notification__time">
                        {formatTimestamp(notification.at, settings.timeDisplay)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="notification-panel__footer">
            <Link to="/app/incidents" className="menu__item" onClick={close}>
              View all incidents
            </Link>
          </div>
        </>
      )}
    </Popover>
  );
}
