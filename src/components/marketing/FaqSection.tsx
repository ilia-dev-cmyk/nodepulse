import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    id: 'real-service',
    question: 'Is NodePulse a real monitoring service?',
    answer:
      'No. NodePulse is a frontend portfolio project. The dashboard, charts, filters, and forms are fully functional, but they operate on a fictional dataset inside the browser. There is no backend and no monitoring infrastructure.',
  },
  {
    id: 'requests',
    question: 'Does adding a monitor start a real check?',
    answer:
      'No network requests are made. Adding a monitor creates a local demo record in a paused state, and pausing or resuming a monitor only changes local state. The interval and region fields are stored for the demonstration.',
  },
  {
    id: 'data',
    question: 'Where do the metrics and incidents come from?',
    answer:
      'They come from a deterministic sample dataset shipped with the app: 12 monitors, several incidents, and derived latency and uptime series. The numbers shown in charts are computed from that same local data, which keeps tables, filters, and charts consistent.',
  },
  {
    id: 'persistence',
    question: 'What happens when I reload the page?',
    answer:
      'Workspace settings and the theme persist in localStorage. Monitors added in a session, pause states, and incident resolution changes reset to the seeded sample data on reload, so the demo always starts from a known state.',
  },
  {
    id: 'build',
    question: 'How was it built?',
    answer:
      'With React, TypeScript, Vite, React Router, and handcrafted SVG charts. Styling uses CSS custom properties and a small set of reusable components; there is no UI framework, charting library, or backend dependency.',
  },
];

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);

  return (
    <section className="section section--muted" id="faq">
      <div className="container faq-layout">
        <div className="faq-intro">
          <p className="eyebrow">Questions</p>
          <h2 className="section-heading__title">Honest details about the demo.</h2>
          <p className="section-heading__copy">
            NodePulse is built to be inspected. Here is exactly what is real, what is simulated, and
            what resets.
          </p>
        </div>
        <div className="faq-list">
          {FAQS.map((faq) => {
            const open = openId === faq.id;
            return (
              <div className={open ? 'faq-item is-open' : 'faq-item'} key={faq.id}>
                <h3 className="faq-item__heading">
                  <button
                    type="button"
                    className="faq-item__trigger"
                    aria-expanded={open}
                    aria-controls={`faq-panel-${faq.id}`}
                    id={`faq-trigger-${faq.id}`}
                    onClick={() => setOpenId(open ? null : faq.id)}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown size={16} aria-hidden="true" className="faq-item__chevron" />
                  </button>
                </h3>
                <div
                  className="faq-item__panel"
                  id={`faq-panel-${faq.id}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${faq.id}`}
                  hidden={!open}
                >
                  <p>{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
