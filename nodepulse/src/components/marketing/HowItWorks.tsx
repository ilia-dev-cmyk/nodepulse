import { ArrowRight, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    index: '01',
    title: 'Add a monitor',
    copy: 'Name an endpoint, choose an interval and a probe region. In the demo, the record is created locally so you can explore the workflow immediately.',
    href: '/app/monitors',
    cta: 'Open the monitor form',
  },
  {
    index: '02',
    title: 'Track service health',
    copy: 'Scan status, uptime, and response time across the workspace. The overview keeps the fleet summary, trends, and monitors in one view.',
    href: '/app',
    cta: 'View the overview',
  },
  {
    index: '03',
    title: 'Investigate incidents',
    copy: 'Follow an incident timeline, inspect affected services, and resolve or reopen the record to see how state flows through the demo workspace.',
    href: '/app/incidents',
    cta: 'Open incidents',
  },
];

export function HowItWorks() {
  return (
    <section className="section section--muted" id="how-it-works">
      <div className="container">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="section-heading__title">A short path from endpoint to insight.</h2>
          </div>
          <p className="section-heading__copy">
            The demo mirrors a real monitoring workflow in three steps. Every step links directly
            into the interactive dashboard.
          </p>
        </div>

        <ol className="steps">
          {STEPS.map((step) => (
            <li className="step" key={step.index}>
              <span className="step__index mono">{step.index}</span>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__copy">{step.copy}</p>
              <Link to={step.href} className="step__link">
                {step.cta}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>

        <div className="steps-note">
          <FlaskConical size={16} aria-hidden="true" />
          <p>
            This portfolio demo uses local sample data only. No network requests, monitoring jobs,
            emails, or pages are generated — the interface, state transitions, and charts are real,
            the monitoring service is not.
          </p>
        </div>
      </div>
    </section>
  );
}
