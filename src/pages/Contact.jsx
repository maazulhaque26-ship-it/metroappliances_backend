import React, { useState } from 'react';
import {
  FiMail, FiPhone, FiMapPin, FiClock, FiSend,
  FiMessageSquare, FiChevronDown,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const CONTACT_INFO = [
  { icon: FiPhone,   title: 'Call Us',       value: '1800-XXX-XXXX',              sub: 'Mon–Sat, 9 AM–7 PM',    href: 'tel:1800XXXXXXX' },
  { icon: FiMail,    title: 'Email',          value: 'support@metroappliances.in', sub: 'Response within 24h', href: 'mailto:support@metroappliances.in' },
  { icon: FiMapPin,  title: 'Metro HQ',       value: 'Andheri East, Mumbai',       sub: '400069, Maharashtra',  href: '#' },
  { icon: FiClock,   title: 'Working Hours',  value: 'Mon–Sat: 9 AM–7 PM',        sub: 'Sun: 10 AM–4 PM',      href: '#' },
];

const SUBJECTS = [
  'Product Inquiry',
  'Order Support',
  'Return & Refund',
  'Installation Support',
  'Warranty Claim',
  'Press & Media',
  'Other',
];

const FAQS = [
  { q: 'How long does delivery take?',   a: '2–5 business days across most cities. Same-day delivery available in select metros.' },
  { q: 'What does the warranty cover?',  a: 'All Metro products include a 1-year comprehensive manufacturer warranty on parts and labour.' },
  { q: 'Do you offer installation?',     a: 'Yes, complimentary professional installation is available in 100+ cities.' },
  { q: 'How do I return a product?',     a: 'Raise a return request within 30 days. We arrange pickup at no extra cost.' },
  { q: 'Are Metro products ISI certified?', a: 'Every Metro product meets BIS standards and carries the ISI mark.' },
];

export default function Contact() {
  const [form,    setForm]    = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      await new Promise(r => setTimeout(r, 1200));
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      toast.success('Message received. Our team will respond within 24 hours.');
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] pt-32 pb-24">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 mb-24">
        <span className="block text-sm font-bold tracking-[0.2em] uppercase text-gray-500 mb-6">Get in Touch</span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#111111] mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>We Are Here to Help</h1>
        <p className="text-[#444444] text-lg max-w-xl mx-auto leading-relaxed">
          Whether it is a product question, an order issue, or just a hello — our dedicated support team is always ready.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Contact info cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {CONTACT_INFO.map(({ icon: Icon, title, value, sub, href }) => (
            <a
              key={title}
              href={href}
              className="bg-white border border-[#E5E5E5] p-8 text-center transition-colors hover:border-[#111111]"
            >
              <div className="w-12 h-12 bg-[#F7F6F3] flex items-center justify-center mx-auto mb-6">
                <Icon size={20} className="text-[#111111]" />
              </div>
              <h3 className="text-[#111111] font-bold text-sm mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{title}</h3>
              <p className="text-[#111111] font-medium text-sm mb-1">{value}</p>
              <p className="text-[#666666] text-xs">{sub}</p>
            </a>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact form */}
          <div className="bg-white border border-[#E5E5E5] p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <FiMessageSquare size={24} className="text-[#111111]" />
              <h2 className="text-[#111111] font-extrabold text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>Send a Message</h2>
            </div>

            {sent && (
              <div className="p-4 bg-[#F7F6F3] border border-[#111111] mb-8 text-[#111111] text-sm font-bold tracking-widest uppercase">
                Message sent successfully.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">Full Name</label>
                  <input value={form.name} onChange={set('name')} placeholder="Your name" className="w-full border border-[#E5E5E5] px-4 py-3 outline-none focus:border-[#111111] bg-[#F7F6F3] transition-colors text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">Email Address</label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" className="w-full border border-[#E5E5E5] px-4 py-3 outline-none focus:border-[#111111] bg-[#F7F6F3] transition-colors text-sm" required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">Phone Number</label>
                  <input value={form.phone} onChange={set('phone')} placeholder="+91 XXXXX XXXXX" className="w-full border border-[#E5E5E5] px-4 py-3 outline-none focus:border-[#111111] bg-[#F7F6F3] transition-colors text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">Subject</label>
                  <select value={form.subject} onChange={set('subject')} className="w-full border border-[#E5E5E5] px-4 py-3 outline-none focus:border-[#111111] bg-[#F7F6F3] transition-colors text-sm" required>
                    <option value="">Select a subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">Message</label>
                <textarea
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Describe your query in detail..."
                  className="w-full border border-[#E5E5E5] px-4 py-3 outline-none focus:border-[#111111] bg-[#F7F6F3] transition-colors text-sm resize-none h-40"
                  required
                />
              </div>
              <button type="submit" disabled={sending} className="w-full bg-[#111111] text-white px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-[#333333] transition-colors flex items-center justify-center gap-3">
                {sending ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><FiSend size={16} /> Send Message</>
                )}
              </button>
            </form>
          </div>

          {/* FAQs */}
          <div className="space-y-8">
            <div className="bg-white border border-[#E5E5E5] p-8 md:p-12">
              <h3 className="text-[#111111] font-extrabold text-2xl mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>Frequently Asked Questions</h3>
              <div className="space-y-4">
                {FAQS.map(({ q, a }, i) => (
                  <div key={i} className="border-b border-[#E5E5E5] last:border-0 pb-4 last:pb-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between text-left transition-colors"
                    >
                      <span className="text-[#111111] text-sm font-bold pr-4" style={{ fontFamily: 'Poppins, sans-serif' }}>{q}</span>
                      <FiChevronDown
                        size={16}
                        className={`text-[#666666] flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="text-[#666666] text-sm leading-relaxed pt-4">
                        {a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp / Quick support */}
            <div className="bg-white border border-[#E5E5E5] p-8 flex items-center gap-6 group hover:border-[#111111] transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-[#F7F6F3] flex items-center justify-center flex-shrink-0 group-hover:bg-[#111111] transition-colors">
                <FiMessageSquare size={24} className="text-[#111111] group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-[#111111] font-extrabold text-lg mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Chat Support</p>
                <p className="text-[#666666] text-sm leading-relaxed">Instant help via WhatsApp — available Mon–Sat, 9 AM to 7 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
