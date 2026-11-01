import { ArrowRight, Check, Info } from 'lucide-react';
import { ButtonLink } from '../ui/Button';
import { Badge } from '../ui/Badge';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$0',
    cadence: 'per month',
    description: 'For side projects and early prototypes.',
    features: ['5 monitors', '5-minute checks', '7-day history', 'Email alerts', 'One probe region'],
    featured: false,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29',
    cadence: 'per month',
    description: 'For small teams watching production.',
    features: [
      '25 monitors',
      '1-minute checks',
      '90-day history',
      'Incident timelines',
      'Public status page',
      'Five probe regions',
    ],
    featured: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '$89',
    cadence: 'per month',
    description: 'For growing products with wider surface area.',
    features: [
      '100 monitors',
      '30-second checks',
      '1-year history',
      'Multi-region assertions',
      'Alert routing by service',
      'Priority support',
    ],
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-heading section-heading--center">
          <p className="eyebrow">Pricing</p>
          <h2 className="section-heading__title">Simple plans, shown for illustration.</h2>
          <p className="section-heading__copy">
            These fictional prices demonstrate how a pricing section could look. NodePulse has no
            checkout, subscription, or billing system.
          </p>
          <span className="pricing-flag">
            <Info size={13} aria-hidden="true" />
            Illustrative demo pricing — not a live commercial offer
          </span>
        </div>

        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={plan.featured ? 'price-card price-card--featured' : 'price-card'}
            >
              <div className="price-card__head">
                <h3 className="price-card__name">{plan.name}</h3>
                {plan.featured && <Badge tone="accent">Example</Badge>}
              </div>
              <p className="price-card__description">{plan.description}</p>
              <p className="price-card__price">
                {plan.price}
                <span>{plan.cadence}</span>
              </p>
              <ul className="price-card__features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={14} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <ButtonLink
                to="/app"
                variant={plan.featured ? 'primary' : 'secondary'}
                className="price-card__cta"
                iconRight={<ArrowRight size={15} aria-hidden="true" />}
              >
                Explore the demo
              </ButtonLink>
              <p className="price-card__note">No sign-up required</p>
            </article>
          ))}
        </div>
        <p className="pricing-footnote">
          Plan limits and prices are placeholders for the portfolio demonstration. Nothing can be
          purchased on this site.
        </p>
      </div>
    </section>
  );
}
