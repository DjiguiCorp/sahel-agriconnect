import { Link } from 'react-router-dom';
import { Shield, Building2, Tractor, BadgeCheck, Globe } from 'lucide-react';

export default function Pricing() {
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-forest via-brand-forest to-brand-sage text-white">
        <div className="section-container py-16 md:py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Pricing</h1>
          <p className="mt-4 text-lg text-white/90 max-w-3xl mx-auto">
            Flexible plans for farmers, cooperatives, transformation centers, and organizations.
          </p>
        </div>
      </section>

      {/* Existing pricing cards (baseline) */}
      <section className="section-container">
        <h2 className="text-2xl md:text-3xl font-extrabold text-brand-forest mb-6">Platform plans</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { Icon: Globe, title: 'Marketplace Visibility', text: 'Get discovered by buyers with verified listings.' },
            { Icon: BadgeCheck, title: 'Certification Support', text: 'Apply for local → export certification flows.' },
            { Icon: Tractor, title: 'Equipment Programs', text: 'Access cooperative equipment fund pathways.' },
            { Icon: Building2, title: 'Cooperative Tools', text: 'Manage members, crops, and eligibility.' },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="card border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-brand-iconBg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-brand-forest" aria-hidden />
              </div>
              <h3 className="text-xl font-bold text-brand-forest">{title}</h3>
              <p className="mt-2 text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5) Governments & Organizations */}
      <section className="section-container pt-0">
        <h2 className="text-2xl md:text-3xl font-extrabold text-brand-forest mb-6">For Governments & Organizations</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-amber/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-brand-forest" aria-hidden />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-brand-forest">Country platform licensing</h3>
                <p className="mt-2 text-gray-600">
                  Deploy the full platform in your country. Sovereign data, custom admin, global marketplace visibility.
                  From $999/month.
                </p>
                <Link to="/platform-licensing" className="mt-4 inline-flex btn-secondary">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6) Cooperatives */}
      <section className="section-container pt-0 pb-20">
        <h2 className="text-2xl md:text-3xl font-extrabold text-brand-forest mb-6">For Cooperatives</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-iconBg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-brand-forest" aria-hidden />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-brand-forest">Cooperative membership</h3>
                <p className="mt-2 text-gray-600">
                  Register your cooperative. Access equipment funds, certification, and diaspora investment. $199/year.
                </p>
                <Link to="/cooperative-registration" className="mt-4 inline-flex btn-primary">
                  Register Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

