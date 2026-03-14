import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

export function Contact() {
  const contactPhone = import.meta.env.VITE_CONTACT_PHONE || '+91 98765 43210';
  const contactPhoneAlt = import.meta.env.VITE_CONTACT_PHONE_ALT || '+91 87654 32109';
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'support@growtender.in';
  const contactSalesEmail = import.meta.env.VITE_CONTACT_SALES_EMAIL || 'sales@growtender.in';
  const whatsappLink = import.meta.env.VITE_WHATSAPP_LINK || 'https://wa.me/9106130870?text=Hi%2C%20I%20need%20help%20with%20GeM%20Tender%20services.%20Please%20assist%20me.';

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', type: 'General Inquiry' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitInquiry({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        type: form.type || undefined,
        subject: form.subject,
        message: form.message,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc' }} className="min-h-screen">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f3349, #1a4f72)' }} className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-3">
            Contact <span style={{ color: '#f5820d' }}>Grow Tender</span>
          </h1>
          <p className="text-blue-300">Our GeM tender experts are here to help you succeed</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            {[
              { icon: Phone, title: 'Call Us', lines: [contactPhone, contactPhoneAlt].filter(Boolean), color: '#f5820d' },
              { icon: Mail, title: 'Email Us', lines: [contactEmail, contactSalesEmail].filter(Boolean), color: '#1a4f72' },

              { icon: Clock, title: 'Working Hours', lines: ['Mon–Sat: 10:00 AM – 7:00 PM'], color: '#1a4f72' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-5 border shadow-sm flex items-start gap-4"
                style={{ borderColor: '#e5e7eb' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: item.color === '#f5820d' ? '#fef3e2' : '#e0f0ff' }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: '#1a4f72' }}>{item.title}</h3>
                  {item.lines.map((line, i) => (
                    <p key={i} className="text-sm text-gray-600">{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick Connect */}
            <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #1a4f72, #0f3349)' }}>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={16} style={{ color: '#f5820d' }} />
                <h3 className="font-semibold text-white text-sm">WhatsApp Support</h3>
              </div>
              <p className="text-blue-300 text-xs mb-3">Get instant help on WhatsApp for tender-related queries</p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                className="block text-center py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#25d366' }}>
                💬 Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#15803d' }} />
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#1a4f72' }}>Message Sent!</h3>
                  <p className="text-gray-600 mb-4">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                  <button onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
                    style={{ background: '#f5820d' }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-bold mb-5" style={{ color: '#1a4f72' }}>Send us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                        {error}
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Full Name *</label>
                        <input type="text" required value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Your full name"
                          className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                          style={{ borderColor: '#d1d5db' }} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Email Address *</label>
                        <input type="email" required value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="your@email.com"
                          className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                          style={{ borderColor: '#d1d5db' }} />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Phone Number</label>
                        <input type="tel" value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none"
                          style={{ borderColor: '#d1d5db' }} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Inquiry Type</label>
                        <select value={form.type}
                          onChange={(e) => setForm({ ...form, type: e.target.value })}
                          className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none text-gray-700"
                          style={{ borderColor: '#d1d5db' }}>
                          <option>General Inquiry</option>
                          <option>Subscription Query</option>
                          <option>Technical Support</option>
                          <option>Sales Inquiry</option>
                          <option>Partnership</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Subject *</label>
                      <input type="text" required value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="How can we help you?"
                        className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none"
                        style={{ borderColor: '#d1d5db' }} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Message *</label>
                      <textarea required value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Describe your query in detail..."
                        rows={5}
                        className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none resize-none"
                        style={{ borderColor: '#d1d5db' }} />
                    </div>
                    <button type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{ background: '#f5820d', opacity: submitting ? 0.8 : 1 }}>
                      <Send size={15} /> {submitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
