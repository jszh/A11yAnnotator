import { useState } from "react";
import { MessageCircle, Phone, Globe, Send, CheckCircle2 } from "lucide-react";
import Layout from "@/components/government/Layout";

const departments = [
  { name: "General Inquiries", phone: "(802) 828-1110" },
  { name: "Department of Motor Vehicles", phone: "(802) 828-2000" },
  { name: "Department of Health", phone: "(802) 863-7200" },
  { name: "Agency of Human Services", phone: "(802) 241-0440" },
  { name: "Department of Taxes", phone: "(802) 828-2505" },
  { name: "Agency of Education", phone: "(802) 828-1130" },
];

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Layout>
      <section className="bg-primary">
        <div className="container py-12 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-3">Contact Us</h1>
          <p className="text-primary-foreground/80 font-body text-lg">We're here to help. Reach out by chat, phone, or email.</p>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Live Chat */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <MessageCircle className="text-secondary-foreground" size={20} />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-foreground">Live Chat</h2>
                  <p className="text-xs text-muted-foreground font-body">Mon–Fri, 8:00 AM – 5:00 PM EST</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-body mb-4">
                Chat with a state representative for quick answers about services, forms, and eligibility.
              </p>
              <button className="w-full py-3 rounded-md bg-primary text-primary-foreground font-body font-semibold hover:opacity-90 transition-opacity">
                Start Chat
              </button>
            </div>

            {/* Phone Directory */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="text-secondary" size={20} />
                <h2 className="font-heading font-bold text-foreground">Phone Directory</h2>
              </div>
              <div className="space-y-3">
                {departments.map((d) => (
                  <div key={d.name} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="font-body text-sm text-foreground">{d.name}</span>
                    <a href={`tel:${d.phone}`} className="font-body text-sm font-semibold text-primary hover:underline">{d.phone}</a>
                  </div>
                ))}
              </div>
            </div>

            {/* Multilingual */}
            <div className="bg-muted rounded-xl p-5 flex items-start gap-3">
              <Globe className="text-secondary shrink-0 mt-0.5" size={18} />
              <div className="font-body text-sm text-muted-foreground">
                <strong className="text-foreground">Multilingual Support:</strong> Interpretation services are available
                in over 20 languages. When you call, request an interpreter and one will be connected at no cost to you.
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-heading text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Send size={18} className="text-secondary" /> Website Feedback
            </h2>
            <p className="text-sm text-muted-foreground font-body mb-6">
              Help us improve this website. Share your suggestions, report issues, or let us know what's working well.
            </p>

            {!submitted ? (
              <form
                onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-body font-semibold text-foreground mb-1">Name</label>
                  <input type="text" required className="w-full border border-border rounded-md px-3 py-2 font-body text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-body font-semibold text-foreground mb-1">Email</label>
                  <input type="email" required className="w-full border border-border rounded-md px-3 py-2 font-body text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-body font-semibold text-foreground mb-1">Category</label>
                  <select required className="w-full border border-border rounded-md px-3 py-2 font-body text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select...</option>
                    <option>General Feedback</option>
                    <option>Bug Report</option>
                    <option>Feature Request</option>
                    <option>Content Correction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-body font-semibold text-foreground mb-1">Message</label>
                  <textarea required rows={4} className="w-full border border-border rounded-md px-3 py-2 font-body text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Share your thoughts..." />
                </div>
                <button type="submit" className="w-full py-3 rounded-md bg-primary text-primary-foreground font-body font-semibold hover:opacity-90 transition-opacity">
                  Submit Feedback
                </button>
              </form>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="text-secondary mx-auto mb-4" size={40} />
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">Thank You!</h3>
                <p className="text-sm text-muted-foreground font-body">Your feedback has been received. We review all submissions and will respond within 2 business days if a reply is needed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
