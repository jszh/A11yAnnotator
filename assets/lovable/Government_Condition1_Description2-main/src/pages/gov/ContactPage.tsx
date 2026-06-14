import { useState } from "react";
import { MessageCircle, Phone, Globe, Send } from "lucide-react";
import Layout from "@/components/gov/Layout";

const departments = [
  { name: "General Helpline", phone: "(802) 828-1110" },
  { name: "Department of Motor Vehicles", phone: "(802) 828-2000" },
  { name: "Department of Health", phone: "(802) 863-7200" },
  { name: "Department of Labor", phone: "(802) 828-4000" },
  { name: "Agency of Education", phone: "(802) 828-1130" },
  { name: "Agency of Human Services", phone: "(802) 241-0440" },
];

const ContactPage = () => {
  const [feedbackSent, setFeedbackSent] = useState(false);

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container">
          <h1 className="font-display text-3xl md:text-4xl font-bold">Contact Us</h1>
          <p className="mt-2 opacity-80 text-lg">We're here to help — reach out by phone, chat, or form.</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Live Chat */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gov-green/10 text-gov-green">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">Live Chat</h2>
              </div>
              <p className="text-sm text-muted-foreground">Chat with a representative for immediate assistance.</p>
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium text-foreground">Available Mon–Fri, 8:00 AM – 5:00 PM ET</p>
                <p className="text-muted-foreground mt-1">Average wait time: ~3 minutes</p>
              </div>
              <button className="w-full rounded-lg bg-gov-green px-4 py-3 text-sm font-semibold text-accent-foreground hover:bg-gov-green-light transition-colors focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Start Chat
              </button>
            </div>

            {/* Multilingual */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gov-sky text-gov-navy">
                  <Globe className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">Multilingual Support</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                We provide assistance in English, Spanish, and French. Translation services are available for other languages upon request.
              </p>
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="text-muted-foreground">
                  Para asistencia en español, llame al <strong className="text-foreground">(802) 828-1110</strong> y presione 2.
                </p>
                <p className="text-muted-foreground mt-2">
                  Pour l'assistance en français, appelez le <strong className="text-foreground">(802) 828-1110</strong> et appuyez sur 3.
                </p>
              </div>
            </div>
          </div>

          {/* Phone directory */}
          <div className="mt-10">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-gov-green" aria-hidden="true" /> Department Helplines
            </h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th scope="col" className="px-5 py-3 text-left font-semibold text-foreground">Department</th>
                    <th scope="col" className="px-5 py-3 text-left font-semibold text-foreground">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.name} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-foreground">{dept.name}</td>
                      <td className="px-5 py-3 text-muted-foreground font-mono">{dept.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feedback form */}
          <div className="mt-10">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-gov-green" aria-hidden="true" /> Website Feedback
            </h2>
            {feedbackSent ? (
              <div className="rounded-lg border border-gov-green bg-gov-green/5 p-6 text-center" role="alert">
                <p className="text-sm font-semibold text-foreground">Thank you for your feedback!</p>
                <p className="text-sm text-muted-foreground mt-1">We review all submissions and use them to improve our services.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); setFeedbackSent(true); }}
                className="rounded-xl border border-border bg-card p-6 space-y-4"
              >
                <div>
                  <label htmlFor="fb-name" className="block text-sm font-medium text-foreground mb-1">Name (optional)</label>
                  <input id="fb-name" type="text" className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label htmlFor="fb-email" className="block text-sm font-medium text-foreground mb-1">Email (optional)</label>
                  <input id="fb-email" type="email" className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label htmlFor="fb-message" className="block text-sm font-medium text-foreground mb-1">Your feedback</label>
                  <textarea id="fb-message" rows={4} required className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y" placeholder="Tell us how we can improve…" />
                </div>
                <button type="submit" className="rounded-lg bg-gov-green px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-gov-green-light transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
                  Submit Feedback
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ContactPage;
