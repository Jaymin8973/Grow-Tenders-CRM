import { Shield, Award, FileCheck, CheckCircle, ArrowRight, Phone, Mail, Clock, Users, Zap, BadgeCheck, Sparkles, Check, Bell, Briefcase, Globe, Monitor, PenTool, Building2, Stamp, Factory, UtensilsCrossed, Scale, FileBadge, IndianRupee } from 'lucide-react';
import { Link } from 'react-router';
import { useState } from 'react';

// Service Categories with their services
const serviceCategories = [
  {
    id: 'tender-services',
    title: 'Tender Services',
    subtitle: 'End-to-End Tender Solutions',
    summary: 'Everything you need to discover, analyze, and win tenders — from alerts to final submission.',
    highlights: ['Daily alerts & tracking', 'Bid preparation support', 'Compliance-ready documentation'],
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
    highlight: 'from-[#1a4f72] to-blue-500',
    image: '/images/Tenders-Services.png',
    services: [
      {
        icon: Bell,
        title: 'Tender Alert Services',
        description: 'Real-time notifications about latest tenders matching your business profile.',
        features: ['Customized Keyword Alerts', 'Daily Email Notifications', 'SMS Updates', 'Category Setup Guidance'],
      },
      {
        icon: Award,
        title: 'Tender Awarded Results',
        description: 'Access comprehensive data on awarded tenders and analyze winning bids.',
        features: ['Winning Bidder Details', 'Contract Value Insights', 'GeM Portal Award Data', 'Competitor Analysis'],
      },
      {
        icon: Users,
        title: 'Bidder Enrolment',
        description: 'Enroll your company across state, central, and PSU tender portals.',
        features: ['Multi-Portal Registration', 'Profile Optimization', 'Documentation Assistance', 'Account Activation'],
      },
      {
        icon: Briefcase,
        title: 'Tender Bidding Service',
        description: 'Expert handling of bidding process from document preparation to submission.',
        features: ['Pre-Bid Query Handling', 'Technical Bid Preparation', 'Financial BOQ Filling', 'Online Submission'],
      },
      {
        icon: Monitor,
        title: 'e-Tendering Consultancy',
        description: 'Expert guidance on e-Tendering landscape with staff training and bid auditing.',
        features: ['Process Blueprinting', 'Staff Training Programs', 'Bid Auditing', 'JV Matchmaking'],
      },
      {
        icon: PenTool,
        title: 'Tender Designing/Hosting',
        description: 'Design comprehensive tender documents (RFP/RFQ) and host them securely.',
        features: ['RFP/RFQ Drafting', 'Vendor Evaluation Criteria', 'Portal Hosting', 'Query Management'],
      },
    ],
  },
  {
    id: 'govt-registrations',
    title: 'Government Registrations',
    subtitle: 'Official Portal Registrations',
    summary: 'Get registered on key government portals and unlock procurement benefits with smooth end-to-end support.',
    highlights: ['Faster approvals', 'Document checklist support', 'Portal onboarding assistance'],
    icon: Building2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
    highlight: 'from-emerald-500 to-teal-400',
    image: '/images/Goverment-Registrations.png',
    services: [
      {
        icon: Globe,
        title: 'GeM Registration',
        description: 'Get onboarded onto India\'s premier government procurement portal.',
        features: ['Seller Profile Creation', 'OEM Dashboard Setup', 'Product Catalog Upload', 'Brand Approval'],
      },
      {
        icon: Factory,
        title: 'Udyam (MSME) Registration',
        description: 'Register under MSME for government benefits, subsidies, and tender preferences.',
        features: ['Zero Paperwork Filing', 'NIC Code Selection', 'Priority Lending Benefits', 'Tender Preferences'],
      },
      {
        icon: IndianRupee,
        title: 'Make In India Registration',
        description: 'Register under Make In India initiative for government procurement benefits.',
        features: ['Registration Certificate', 'Procurement Preferences', 'Local Content Certification', 'Policy Benefits'],
      },
    ],
  },
  {
    id: 'business-licenses',
    title: 'Business Licenses & Certifications',
    subtitle: 'Compliance & Quality Standards',
    summary: 'Stay compliant with licenses and certifications that build trust and keep your business audit-ready.',
    highlights: ['End-to-end filing', 'Renewal reminders', 'Compliance guidance'],
    icon: FileBadge,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-100',
    highlight: 'from-purple-600 to-indigo-500',
    image: '/images/BusinessLicence&Certifications.png',
    services: [
      {
        icon: UtensilsCrossed,
        title: 'FSSAI Registration',
        description: 'Food safety license for food businesses from FSSAI authority.',
        features: ['License Application', 'Document Preparation', 'Renewal Support', 'Compliance Guidance'],
      },
      {
        icon: BadgeCheck,
        title: 'ISO Registration',
        description: 'International quality certification for business excellence.',
        features: ['ISO 9001, 14001, 45001', 'Documentation Support', 'Audit Preparation', 'Certification Assistance'],
      },
      {
        icon: Scale,
        title: 'Labor License',
        description: 'Obtain labor license for compliance with labor laws and regulations.',
        features: ['License Application', 'Compliance Setup', 'Renewal Management', 'Legal Support'],
      },
      {
        icon: Users,
        title: 'Labor Identification Number (LIN)',
        description: 'Unique identification for establishments under labor laws.',
        features: ['LIN Registration', 'Employee Data Management', 'Compliance Tracking', 'Portal Integration'],
      },
            {
        icon: Stamp,
        title: 'Trademark Registration',
        description: 'Protect your brand identity with trademark registration.',
        features: ['Trademark Search', 'Application Filing', 'Objection Handling', 'Registration Certificate'],
      },
    ],
  },
  {
    id: 'digital-ip',
    title: 'Digital Signature Certificates',
    subtitle: 'Security & Intellectual Property',
    summary: 'Secure your filings and protect your brand with trusted digital identity and IP registration services.',
    highlights: ['DSC issuance support', 'Trademark filing', 'Objection handling'],
    icon: Shield,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-100',
    highlight: 'from-[#f5820d] to-orange-400',
    image: '/images/Digital&IpServices.png',
    services: [
      {
        icon: Shield,
        title: 'Digital Signature Certificate',
        description: 'Class-3 DSC for e-procurement, income tax, and MCA filings.',
        features: ['Class 3 Individual/Org DSC', 'Encryption Combo', 'Secure USB Token', 'Express Issuance'],
      },

    ],
  },

  {
    id: 'vendors',
    title: 'Vendor Assessment',
    subtitle: 'Quality & Compliance Verification',
    summary: 'Get your business assessed and certified to become an approved vendor for government departments, PSUs, and large enterprises.',
    highlights: ['Vendor rating improvement', 'Compliance certification', 'Quality audit support'],
    icon: BadgeCheck,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-100',
    highlight: 'from-teal-500 to-cyan-400',
    image: '/images/Vendor-Assessment.png',
    services: [
      {
        icon: BadgeCheck,
        title: 'GeM Vendor Assessment Support with Expert Guidance',
        description: 'Register as an approved vendor on government and PSU procurement portals.',
        features: ['Portal Registration', 'Document Submission', 'Category Selection', 'Approval Follow-up'],
      },
   
    ],
  },
];

const stats = [
  { value: '10,000+', label: 'Registrations Completed' },
  { value: '95%', label: 'Success Rate' },
  { value: '24-48 hrs', label: 'Processing Time' },
  { value: '4.9/5', label: 'Customer Rating' },
];

const whyChooseUs = [
  { icon: Users, title: 'Expert Team', desc: 'Working with top CAs & Company Secretaries for accurate documentation.' },
  { icon: Clock, title: 'Lightning Fast', desc: 'Streamlined process ensures most registrations in 24-48 hours.' },
  { icon: Zap, title: 'Zero Hassle', desc: '100% paperless and stress-free - we manage everything end-to-end.' },
  { icon: CheckCircle, title: 'High Success', desc: 'Exceptional 95%+ approval rate with our guided approach.' },
  { icon: Shield, title: 'Bank-Grade Security', desc: 'Your sensitive business data is encrypted and completely secure.' },
  { icon: Award, title: 'Lifetime Support', desc: 'Beyond registration, we assist with compliance and renewals.' },
];

export function Services() {
  const contactPhone = import.meta.env.VITE_CONTACT_PHONE || '+91 98765 43210';
  const contactPhoneTel = import.meta.env.VITE_CONTACT_PHONE_TEL || '+9106130870';

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-orange-500/30 font-sans">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 pt-24 pb-32 lg:pt-32 lg:pb-40">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#1a4f72] blur-[120px] opacity-40 mix-blend-screen animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#f5820d] blur-[120px] opacity-30 mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl transition-all duration-300 hover:bg-white/10 hover:border-orange-500/50">
            <Sparkles size={16} className="text-[#f5820d]" />
            <span className="text-sm text-slate-200 font-medium tracking-wide">Trusted by 10,000+ Businesses Worldwide</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Elevate Your Business <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5820d] to-yellow-400">
              Registration Services
            </span>
          </h1>

          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Comprehensive certification and registration solutions tailored for your success. From FSSAI to ISO, we streamline the complexity so you can focus on scaling your business.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link to="/contact"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold text-lg overflow-hidden bg-gradient-to-r from-[#f5820d] to-orange-600 shadow-[0_0_40px_-10px_rgba(245,130,13,0.8)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_60px_-15px_rgba(245,130,13,0.9)]">
              <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
              <span className="relative">Book Free Consultation</span>
              <ArrowRight size={20} className="relative group-hover:translate-x-1 transition-transform" />
            </Link>

            <a href={`tel:${contactPhoneTel}`}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg border border-slate-700 bg-slate-800/50 text-white backdrop-blur-sm transition-all duration-300 hover:bg-slate-800 hover:border-slate-500 hover:scale-[1.02]">
              <Phone size={20} className="text-slate-400" />
              <span>{contactPhone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* overlap stats */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 lg:p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
              <p className="text-3xl lg:text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-br from-[#1a4f72] to-[#f5820d]">
                {stat.value}
              </p>
              <p className="text-sm lg:text-base text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categorized Services Section */}
      <section className="py-20 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-sm font-bold tracking-widest text-[#f5820d] uppercase">Our Expertise</h2>
            <p className="text-4xl md:text-5xl font-extrabold text-[#1a4f72] tracking-tight">Premium Registration Solutions</p>
            <p className="text-lg text-slate-600 leading-relaxed">Discover our comprehensive suite of professional business services organized by category.</p>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 gap-6 lg:gap-8">
            {serviceCategories.map((category) => (
              <div key={category.id} className={`group bg-white rounded-3xl overflow-hidden shadow-lg border ${category.borderColor} transition-all duration-500 hover:shadow-2xl hover:-translate-y-1`}>
                
                <div className="flex flex-col lg:flex-row">
                  {/* Image Section */}
                  <div className="relative w-full lg:w-2/5 h-48 lg:h-auto overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-tr  mix-blend-multiply opacity-30 transition-opacity duration-500 group-hover:opacity-20 z-10`}></div>
                    <img src={category.image} alt={category.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    
                    {/* Floating Icon Badge */}
                    <div className="absolute top-4 left-4 z-20 backdrop-blur-md bg-white/90 p-3 rounded-xl shadow-lg">
                      <category.icon size={28} className={category.color} />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 flex flex-col">
                    {/* Category Header */}
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                      className={`w-full p-6 flex items-center justify-between ${category.bgColor} transition-all duration-300`}
                    >
                      <div className="text-left">
                        <h3 className="text-xl lg:text-2xl font-bold text-[#1a4f72]">{category.title}</h3>
                        <p className="text-sm text-slate-500">{category.subtitle}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md transition-transform duration-300 ${expandedCategory === category.id ? 'rotate-180' : ''}`}>
                        <ArrowRight size={20} className={category.color} />
                      </div>
                    </button>

                    {/* Category Summary (always visible) */}
                    <div className="p-6 pt-4 space-y-4">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {category.summary}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {category.highlights.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                            <Check size={14} className={`${category.color} mt-0.5`} />
                            <span className="text-xs font-medium text-slate-700">{item}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${category.bgColor} ${category.color} border ${category.borderColor}`}>
                          Includes {category.services.length} services
                        </span>
                        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Click to view details
                        </span>
                      </div>
                    </div>

                    {/* Services List - Expandable */}
                    <div className={`transition-all duration-500 ease-in-out ${expandedCategory === category.id ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                      <div className="px-6 pb-6 space-y-3">
                        {category.services.map((service, idx) => (
                          <div key={idx} className="group/service p-3 rounded-xl bg-slate-50 hover:bg-gradient-to-r hover:from-slate-100 hover:to-white transition-all duration-300 border border-slate-100 hover:border-slate-200">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.bgColor} ${category.color}`}>
                                <service.icon size={16} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-800 text-sm group-hover/service:text-[#1a4f72] transition-colors">{service.title}</h4>
                                <p className="text-xs text-slate-500 mb-2">{service.description}</p>
                                <ul className="grid grid-cols-2 gap-1">
                                  {service.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-1 text-xs text-slate-600">
                                      <Check size={10} className={category.color} />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Link
                          to="/contact"
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white text-sm shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-r ${category.highlight}`}
                        >
                          Get Started <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>

                    {/* Collapsed Preview */}
                    {expandedCategory !== category.id && (
                      <div className="px-6 pb-6">
                        <div className="flex flex-wrap gap-2">
                          {category.services.slice(0, 3).map((service, idx) => (
                            <span key={idx} className={`px-3 py-1.5 rounded-full text-xs font-medium ${category.bgColor} ${category.color} border ${category.borderColor}`}>
                              {service.title}
                            </span>
                          ))}
                          {category.services.length > 3 && (
                            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              +{category.services.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Bento Grid Style */}
      <section className="py-24 bg-white relative border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-sm font-bold tracking-widest text-[#f5820d] uppercase">The Grow Tender Advantage</h2>
            <p className="text-4xl font-extrabold text-[#1a4f72] tracking-tight">Why Industry Leaders Choose Us</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="group relative bg-slate-50 rounded-3xl p-8 transition-all duration-500 hover:bg-[#1a4f72] hover:shadow-2xl overflow-hidden border border-slate-100">
                <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity duration-500 group-hover:opacity-10">
                  <item.icon size={120} className="text-white transform rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                </div>

                <div className="relative z-10 space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md text-[#f5820d] group-hover:scale-110 transition-transform duration-500 border border-slate-100">
                    <item.icon size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-white transition-colors duration-300">{item.title}</h4>
                    <p className="text-slate-600 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Process Timeline */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm font-bold tracking-widest text-[#f5820d] uppercase mb-4">Streamlined Process</h2>
          <p className="text-4xl font-extrabold text-[#1a4f72] mb-16">Four Steps to Success</p>

          <div className="relative">
            {/* Horizontal Line Desktop */}
            <div className="hidden lg:block absolute top-[4.5rem] left-[10%] w-[80%] h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">
              {[
                { step: '01', title: 'Consultation', desc: 'Discuss your specific needs with our dedicated experts.', icon: Phone },
                { step: '02', title: 'Documentation', desc: 'Securely upload your files via our encrypted portal.', icon: FileCheck },
                { step: '03', title: 'Processing', desc: 'We handle the complex paperwork and submissions.', icon: Zap },
                { step: '04', title: 'Certification', desc: 'Receive your verified documents right at your desk.', icon: Award },
              ].map((item, i) => (
                <div key={i} className="relative group">
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center mb-6 border border-slate-100 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[#f5820d]/20 relative z-20">
                    <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#1a4f72] text-white flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white">{item.step}</span>
                    <item.icon size={36} className="text-[#f5820d]" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h4>
                  <p className="text-slate-600 px-4">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto rounded-[2.5rem] overflow-hidden relative shadow-[0_20px_60px_-15px_rgba(26,79,114,0.5)]">
          <div className="absolute inset-0 bg-[#1a4f72]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f3349] to-[#1a4f72]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f5820d] rounded-full blur-[150px] opacity-20 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500 rounded-full blur-[150px] opacity-30 -translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 px-8 py-20 text-center lg:px-16 lg:py-24">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Ready to Formalize Your Business?</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-12 font-light">
              Join thousands of successful enterprises. Let our experts manage your compliance while you focus entirely on your growth.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/contact" className="group flex items-center gap-3 px-10 py-5 bg-[#f5820d] rounded-2xl font-bold text-white text-lg transition-all duration-300 hover:bg-orange-600 hover:shadow-[0_0_30px_rgba(245,130,13,0.5)] hover:-translate-y-1">
                <span>Start Your Journey</span>
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <a href={`tel:${contactPhoneTel}`} className="flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-white text-lg border-2 border-white/20 hover:bg-white/10 transition-colors duration-300 backdrop-blur-sm">
                <Phone size={22} className="text-blue-300" />
                <span>Call {contactPhone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
