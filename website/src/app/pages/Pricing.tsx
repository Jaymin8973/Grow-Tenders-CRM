import { useState } from 'react';
import { useEffect } from 'react';
import { Check, X, Zap, Star, Crown, Shield, Bell, Search, FileText, Phone, ChevronDown, ChevronUp, Mail, MapPin, Upload, FileCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

const plans = [
  {
    name: 'Starter',
    icon: Zap,
    price: '10,000',
    gstNote: '+ GST',
    color: '#1a4f72',
    bgColor: '#e0f0ff',
    description: 'Perfect for small businesses starting with GeM tenders',
    features: [
      { label: '7 Tender Bids', included: true, highlight: true },
      { label: '3 Months Email Alerts', included: true },
      { label: 'Single State Coverage', included: true },
      { label: 'Your Keywords Matching', included: true },
      { label: '5 Catalogue Uploads', included: true, highlight: true },
      { label: 'Tender Search', included: true },
      { label: 'Tender Details View', included: true },
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    icon: Star,
    price: '18,000',
    gstNote: '+ GST',
    color: '#f5820d',
    bgColor: '#fef3e2',
    description: 'Best for growing businesses winning multiple tenders',
    features: [
      { label: '15 Tender Bids', included: true, highlight: true },
      { label: '12 Months Email Alerts', included: true },
      { label: 'Single State Coverage', included: true },
      { label: 'Your Keywords Matching', included: true },
      { label: '10 Catalogue Uploads', included: true, highlight: true },
      { label: 'Tender Search', included: true },
      { label: 'Tender Details View', included: true },
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Custom Package',
    icon: Crown,
    price: 'Build Your Plan',
    gstNote: '',
    color: '#1a4f72',
    bgColor: '#e0f0ff',
    description: 'Customize your own plan based on your needs',
    features: [
      { label: 'Select Number of Tender Bids', included: true, highlight: true },
      { label: 'Choose Subscription Duration', included: true, highlight: true },
      { label: 'Single or Multiple States', included: true },
      { label: 'Custom Keywords Selection', included: true },
      { label: 'Flexible Catalogue Uploads', included: true, highlight: true },
      { label: 'Pay Only For What You Need', included: true, highlight: true },
    ],
    cta: 'Build Your Package',
    popular: false,
  },
];

const faqs = [
  {
    q: 'What is GeM and how does Grow Tender help?',
    a: 'GeM (Government e-Marketplace) is India\'s official online portal for government procurement. Grow Tender aggregates all GeM tenders in real-time and provides advanced search, filters, and alerts to help you find relevant procurement opportunities faster.',
  },
  {
    q: 'Is there a free trial available?',
    a: 'Yes! We offer a 7-day free trial with full access to all features of the Professional plan. No credit card required to start your trial.',
  },
  {
    q: 'How quickly are tenders updated on Grow Tender?',
    a: 'Our system syncs with the GeM portal every 30 minutes, ensuring you get the most up-to-date tender information. Real-time email alerts are sent within minutes of new tenders matching your keywords.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period, and we offer a 7-day money-back guarantee.',
  },
  {
    q: 'Do you cover all government departments on GeM?',
    a: 'Yes, Grow Tender covers tenders from all central government ministries, PSUs, and state government departments that are listed on the GeM portal — over 59,000 buyer organizations.',
  },
  {
    q: 'Is my business data secure?',
    a: 'Absolutely. We use 256-bit SSL encryption and follow industry-standard security practices. Your business information is never shared with third parties.',
  },
];

export function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handlePlanClick = (planName: string) => {
    window.location.href = `/contact?plan=${encodeURIComponent(planName)}`;
  };

  return (
    <div style={{ background: '#f8fafc' }} className="min-h-screen">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f3349, #1a4f72)' }} className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(245,130,13,0.2)', border: '1px solid rgba(245,130,13,0.4)' }}>
            <Star size={13} style={{ color: '#f5820d' }} />
            <span className="text-xs text-orange-300">Simple, Transparent Pricing</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Choose Your <span style={{ color: '#f5820d' }}>GeM Tender</span> Plan
          </h1>
          <p className="text-blue-300 mb-6">
            Flexible plans for businesses of all sizes. No hidden fees.
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name}
              className={`bg-white rounded-2xl shadow-md border overflow-hidden transition-transform hover:-translate-y-1 relative`}
              style={{ borderColor: plan.popular ? '#f5820d' : '#e5e7eb', borderWidth: plan.popular ? '2px' : '1px' }}>
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 py-1.5 text-center text-xs font-bold text-white"
                  style={{ background: '#f5820d' }}>
                  ⭐ Most Popular
                </div>
              )}
              <div className={`p-6 ${plan.popular ? 'pt-10' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: plan.bgColor }}>
                    <plan.icon size={20} style={{ color: plan.color }} />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: '#1a4f72' }}>{plan.name}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold" style={{ color: plan.popular ? '#f5820d' : '#1a4f72' }}>
                      {plan.price === 'Contact Sales' ? '' : '₹'}{plan.price}
                    </span>
                    {plan.gstNote && (
                      <span className="text-gray-500 text-sm">{plan.gstNote}</span>
                    )}
                  </div>
                  {plan.price !== 'Contact Sales' && (
                    <p className="text-xs text-gray-500 mt-0.5">One-time payment</p>
                  )}
                </div>
                <button
                  onClick={() => handlePlanClick(plan.name)}
                  className="w-full py-3 rounded-xl text-sm font-semibold mb-5 transition-opacity hover:opacity-90"
                  style={plan.popular
                    ? { background: '#f5820d', color: 'white' }
                    : { background: '#1a4f72', color: 'white' }}>
                  {plan.cta}
                </button>
                <div className="space-y-2.5">
                  {plan.features.map((feat) => (
                    <div key={feat.label} className="flex items-center gap-2.5">
                      {feat.included ? (
                        <Check size={14} className="flex-shrink-0" style={{ color: feat.highlight ? '#f5820d' : '#15803d' }} />
                      ) : (
                        <X size={14} className="flex-shrink-0 text-gray-300" />
                      )}
                      <span className={`text-xs ${feat.included ? (feat.highlight ? 'font-semibold text-gray-800' : 'text-gray-700') : 'text-gray-400'}`}>
                        {feat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Free Trial Banner */}
        <div className="mt-8 rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #fff8f0, #fef3e2)', border: '1px solid #fed7aa' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap size={18} style={{ color: '#f5820d' }} />
            <h3 className="font-bold" style={{ color: '#1a4f72' }}>7-Day Free Trial — No Credit Card Required</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Get full access to Professional plan features for 7 days, completely free.</p>
          <button
            onClick={() => handlePlanClick('Free Trial')}
            className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#f5820d' }}>
            Start Your Free Trial Now
          </button>
        </div>

        {/* Trust badges */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Shield, label: '256-bit SSL Encryption' },
            { icon: Check, label: '7-Day Money Back Guarantee' },
            { icon: Phone, label: '24/7 Customer Support' },
            { icon: Zap, label: 'Instant Activation' },
          ].map((badge) => (
            <div key={badge.label} className="bg-white rounded-xl p-4 text-center shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
              <badge.icon size={20} className="mx-auto mb-2" style={{ color: '#1a4f72' }} />
              <p className="text-xs text-gray-600">{badge.label}</p>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-center mb-6" style={{ color: '#1a4f72' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => (
              <div key={idx}
                className="bg-white rounded-xl border overflow-hidden shadow-sm"
                style={{ borderColor: '#e5e7eb' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left">
                  <span className="text-sm font-semibold" style={{ color: '#1a4f72' }}>{faq.q}</span>
                  {openFaq === idx
                    ? <ChevronUp size={16} style={{ color: '#f5820d' }} />
                    : <ChevronDown size={16} style={{ color: '#6b7280' }} />}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t" style={{ borderColor: '#f3f4f6' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
