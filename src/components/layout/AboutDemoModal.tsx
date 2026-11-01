import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { DemoNote } from '../ui/DemoNote';

export function AboutDemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="About this demo"
      description="NodePulse is a frontend portfolio demonstration, not a live monitoring service."
      footer={
        <>
          <Link to="/" className="btn btn--ghost btn--md" onClick={onClose}>
            Back to marketing site
          </Link>
          <Button variant="primary" onClick={onClose}>
            Continue exploring
          </Button>
        </>
      }
    >
      <ul className="about-demo-list">
        <li>
          <strong>All data is fictional.</strong> Monitors, incidents, regions, and customers are
          seeded sample records, not verified production statistics.
        </li>
        <li>
          <strong>No requests are made.</strong> Adding or resuming a monitor does not start a real
          network check, and nothing is emailed or paged.
        </li>
        <li>
          <strong>Changes are local.</strong> Monitor and incident edits live in this browser
          session; only workspace settings and the theme are saved to localStorage.
        </li>
        <li>
          <strong>Charts use the same dataset.</strong> Uptime and latency charts are generated
          deterministically from the demo monitors and incidents you can inspect in the tables.
        </li>
      </ul>
      <DemoNote variant="demo">
        This project exists to demonstrate frontend engineering and interface design skills. There
        is no backend, authentication, payment flow, or external monitoring infrastructure.
      </DemoNote>
    </Modal>
  );
}
