import { useState } from "react";
import { MessageCircle, Phone, Globe, Send, CheckCircle2 } from "lucide-react";
import GovLayout from "@/components/government/GovLayout";
import Breadcrumbs from "@/components/government/Breadcrumbs";
import { Button } from "@/components/ui/button";

const departments = [
  { name: "General Inquiries", phone: "1-800-VT-HELP1" },
  { name: "Department of Motor Vehicles", phone: "1-802-828-2000" },
  { name: "Department of Health", phone: "1-802-863-7200" },
  { name: "Agency of Human Services", phone: "1-802-241-0440" },
  { name: "Department of Education", phone: "1-802-479-1030" },
  { name: "Department of Taxes", phone: "1-802-828-2505" },
];

export default function ContactPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ name: "", email: "", category: "", message: "" });

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Please enter your name.";
    if (!formData.email.trim()) errs.email = "Please enter your email address.";
    if (!formData.message.trim()) errs.message = "Please enter your feedback message.";
    setFormErrors(errs);
    if (Object.keys(errs).length === 0) setFeedbackSent(true);
  };

  return (
    <GovLayout title="Contact">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Contact" }]} />

      <section className="gov-container gov-section" aria-labelledby="contact-heading">
        <h1 id="contact-heading" className="text-3xl font-serif font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground text-lg mb-10">Get in touch with Vermont state services. We're here to help.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Chat & Phone */}
          <div className="lg:col-span-1 space-y-6">
            {/* Live Chat */}
            <section className="rounded-lg border bg-card p-6" aria-labelledby="chat-heading">
              <h2 id="chat-heading" className="font-serif font-bold text-lg mb-3 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />
                Live Chat
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Chat with a representative<br />
                <strong>Mon–Fri, 8:00 AM – 5:00 PM EST</strong>
              </p>
              <Button
                onClick={() => setChatOpen(!chatOpen)}
                className="w-full"
                aria-label={chatOpen ? "Close live chat" : "Start live chat"}
                aria-expanded={chatOpen}
              >
                {chatOpen ? "Close Chat" : "Start Chat"}
              </Button>
              {chatOpen && (
                <div className="mt-4 rounded-md border bg-muted p-4 text-sm text-muted-foreground" role="status" aria-live="polite">
                  <p className="font-medium text-foreground mb-2">Chat Widget</p>
                  <p>A representative will be with you shortly. Current wait time: ~2 minutes.</p>
                  <div className="mt-3 space-y-2">
                    <div className="bg-card rounded p-2 text-xs">
                      <strong>Agent:</strong> Hello! How can I help you today?
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Multilingual */}
            <section className="rounded-lg border bg-card p-6" aria-labelledby="multilingual-heading">
              <h2 id="multilingual-heading" className="font-serif font-bold text-lg mb-3 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
                Multilingual Support
              </h2>
              <p className="text-sm text-muted-foreground">
                Assistance is available in English, Spanish, and French. Translation services for other languages available upon request.
              </p>
            </section>

            {/* Phone Directory */}
            <section className="rounded-lg border bg-card p-6" aria-labelledby="phone-heading">
              <h2 id="phone-heading" className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
                Helpline Directory
              </h2>
              <ul className="space-y-3" role="list" aria-label="Department phone numbers">
                {departments.map((dept) => (
                  <li key={dept.name} className="flex items-center justify-between text-sm border-b last:border-0 pb-3 last:pb-0">
                    <span className="text-card-foreground font-medium">{dept.name}</span>
                    <a href={`tel:${dept.phone.replace(/[^0-9]/g, "")}`} className="text-primary font-medium hover:underline focus-ring rounded" aria-label={`Call ${dept.name} at ${dept.phone}`}>
                      {dept.phone}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right: Feedback Form */}
          <div className="lg:col-span-2">
            <section className="rounded-lg border bg-card p-6 sm:p-8" aria-labelledby="feedback-heading">
              <h2 id="feedback-heading" className="font-serif font-bold text-xl mb-2 flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" aria-hidden="true" />
                Website Feedback
              </h2>
              <p className="text-sm text-muted-foreground mb-6">Help us improve this website. Share your suggestions or report issues.</p>

              {feedbackSent ? (
                <div className="rounded-lg bg-gov-success/10 border border-gov-success/20 p-6 text-center" role="status" aria-live="polite">
                  <CheckCircle2 className="h-10 w-10 text-gov-success mx-auto mb-3" aria-hidden="true" />
                  <h3 className="font-serif font-bold text-lg text-foreground mb-1">Thank You!</h3>
                  <p className="text-sm text-muted-foreground">Your feedback has been submitted. We review all suggestions to improve our services.</p>
                  <Button variant="outline" className="mt-4" onClick={() => { setFeedbackSent(false); setFormData({ name: "", email: "", category: "", message: "" }); }}>
                    Submit Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={validateAndSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="fb-name" className="block text-sm font-semibold text-foreground mb-1.5">
                        Name <span className="text-destructive" aria-label="required">*</span>
                      </label>
                      <input
                        id="fb-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-md border bg-background px-4 py-2.5 text-foreground focus-ring"
                        aria-required="true"
                        aria-describedby={formErrors.name ? "name-err" : undefined}
                        aria-invalid={!!formErrors.name}
                      />
                      {formErrors.name && <p id="name-err" className="text-sm text-destructive mt-1" role="alert">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="fb-email" className="block text-sm font-semibold text-foreground mb-1.5">
                        Email <span className="text-destructive" aria-label="required">*</span>
                      </label>
                      <input
                        id="fb-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-md border bg-background px-4 py-2.5 text-foreground focus-ring"
                        aria-required="true"
                        aria-describedby={formErrors.email ? "email-err" : undefined}
                        aria-invalid={!!formErrors.email}
                      />
                      {formErrors.email && <p id="email-err" className="text-sm text-destructive mt-1" role="alert">{formErrors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="fb-category" className="block text-sm font-semibold text-foreground mb-1.5">Category</label>
                    <select
                      id="fb-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-md border bg-background px-4 py-2.5 text-foreground focus-ring"
                    >
                      <option value="">Select a category (optional)</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="bug">Bug Report</option>
                      <option value="accessibility">Accessibility Issue</option>
                      <option value="content">Content Error</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="fb-message" className="block text-sm font-semibold text-foreground mb-1.5">
                      Message <span className="text-destructive" aria-label="required">*</span>
                    </label>
                    <textarea
                      id="fb-message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-md border bg-background px-4 py-2.5 text-foreground focus-ring resize-y"
                      aria-required="true"
                      aria-describedby={formErrors.message ? "msg-err" : undefined}
                      aria-invalid={!!formErrors.message}
                      placeholder="Tell us how we can improve..."
                    />
                    {formErrors.message && <p id="msg-err" className="text-sm text-destructive mt-1" role="alert">{formErrors.message}</p>}
                  </div>
                  <Button type="submit" aria-label="Submit feedback form">
                    Submit Feedback <Send className="h-4 w-4 ml-1" aria-hidden="true" />
                  </Button>
                </form>
              )}
            </section>
          </div>
        </div>
      </section>
    </GovLayout>
  );
}
