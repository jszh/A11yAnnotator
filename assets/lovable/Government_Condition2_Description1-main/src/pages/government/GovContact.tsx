import { useState, useRef } from "react";
import GovBreadcrumb from "@/components/government/Breadcrumb";
import { Phone, Clock, MapPin, Send, CheckCircle2 } from "lucide-react";

const departments = [
  { name: "City Clerk", phone: "(555) 555-1001", hours: "Mon–Fri 8am–5pm" },
  { name: "Public Works", phone: "(555) 555-1002", hours: "Mon–Fri 7am–4pm" },
  { name: "Parks & Recreation", phone: "(555) 555-1003", hours: "Mon–Sat 6am–9pm" },
  { name: "Police (Non-Emergency)", phone: "(555) 555-1004", hours: "24/7" },
  { name: "Fire Department", phone: "(555) 555-1005", hours: "24/7" },
  { name: "Planning & Development", phone: "(555) 555-1006", hours: "Mon–Fri 8am–5pm" },
  { name: "Water & Utilities", phone: "(555) 555-1007", hours: "Mon–Fri 7:30am–5:30pm" },
  { name: "Community Services", phone: "(555) 555-1008", hours: "Mon–Fri 8am–5pm" },
];

const deptOptions = ["General Inquiry", ...departments.map(d => d.name)];

const GovContact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const confirmRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "", email: "", department: "", message: "",
  });

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Your name is required.";
    if (!form.email.trim()) errors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Please enter a valid email address.";
    if (!form.department) errors.department = "Please select a department.";
    if (!form.message.trim()) errors.message = "Message is required.";
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      setSubmitted(true);
      setTimeout(() => confirmRef.current?.focus(), 100);
    }
  };

  return (
    <>
      <GovBreadcrumb items={[{ label: "Contact" }]} />

      <section aria-labelledby="contact-heading" className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h1 id="contact-heading" className="font-serif text-3xl font-bold text-foreground mb-2">Contact Us</h1>
          <p className="font-sans text-muted-foreground mb-10 max-w-2xl">Get in touch with City of Lakewood departments and services.</p>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* Department directory */}
            <section aria-labelledby="directory-heading">
              <h2 id="directory-heading" className="font-serif text-xl font-bold text-foreground mb-4">Department Directory</h2>
              <ul className="space-y-3">
                {departments.map((dept) => (
                  <li key={dept.name} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <h3 className="font-sans font-semibold text-foreground text-sm">{dept.name}</h3>
                    <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-muted-foreground font-sans">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" aria-hidden="true" />
                        <a href={`tel:${dept.phone.replace(/\D/g, "")}`} className="hover:text-foreground transition-colors">{dept.phone}</a>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {dept.hours}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Map */}
              <div className="mt-6 rounded-lg border border-border overflow-hidden">
                <div className="bg-gov-info p-8 text-center" role="img" aria-label="Map showing City Hall at 123 Civic Center Drive, Lakewood, CA 90712">
                  <MapPin className="h-10 w-10 text-primary mx-auto mb-2" aria-hidden="true" />
                  <p className="font-sans font-semibold text-foreground text-sm">City Hall</p>
                  <p className="font-sans text-xs text-muted-foreground">123 Civic Center Drive, Lakewood, CA 90712</p>
                  <a
                    href="https://maps.google.com/?q=123+Civic+Center+Drive+Lakewood+CA+90712"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 rounded bg-primary px-4 py-2 font-sans text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>

              {/* Social */}
              <div className="mt-6">
                <h2 className="font-serif text-lg font-bold text-foreground mb-3">Follow Us</h2>
                <div className="flex gap-3 flex-wrap">
                  {["Facebook", "X (Twitter)", "Instagram", "YouTube"].map((platform) => (
                    <a key={platform} href="#" className="rounded border border-border bg-card px-4 py-2 font-sans text-sm text-foreground hover:bg-secondary transition-colors">{platform}</a>
                  ))}
                </div>
              </div>
            </section>

            {/* Contact form */}
            <section aria-labelledby="form-heading">
              <h2 id="form-heading" className="font-serif text-xl font-bold text-foreground mb-4">Send Us a Message</h2>

              {submitted ? (
                <div ref={confirmRef} tabIndex={-1} className="rounded-lg border-2 border-gov-success bg-gov-success-bg p-8 text-center" role="status" aria-live="polite">
                  <CheckCircle2 className="h-12 w-12 text-gov-success mx-auto mb-3" aria-hidden="true" />
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2">Message Sent</h3>
                  <p className="font-sans text-muted-foreground mb-4">Thank you for contacting us. We'll respond within 2 business days.</p>
                  <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", department: "", message: "" }); setFormErrors({}); }} className="rounded bg-primary px-5 py-2 font-sans font-semibold text-sm text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-5">
                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className="block font-sans text-sm font-medium text-foreground mb-1">
                      Name <span aria-hidden="true" className="text-gov-alert">*</span>
                    </label>
                    <input id="contact-name" type="text" required aria-required="true" aria-invalid={!!formErrors.name} aria-describedby={formErrors.name ? "cname-error" : undefined} value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full rounded border border-input bg-background px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    {formErrors.name && <p id="cname-error" className="text-sm text-gov-alert font-sans mt-1" role="alert">{formErrors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="block font-sans text-sm font-medium text-foreground mb-1">
                      Email <span aria-hidden="true" className="text-gov-alert">*</span>
                    </label>
                    <input id="contact-email" type="email" required aria-required="true" aria-invalid={!!formErrors.email} aria-describedby={formErrors.email ? "cemail-error" : undefined} value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full rounded border border-input bg-background px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    {formErrors.email && <p id="cemail-error" className="text-sm text-gov-alert font-sans mt-1" role="alert">{formErrors.email}</p>}
                  </div>

                  {/* Department */}
                  <div>
                    <label htmlFor="contact-dept" className="block font-sans text-sm font-medium text-foreground mb-1">
                      Department <span aria-hidden="true" className="text-gov-alert">*</span>
                    </label>
                    <select id="contact-dept" required aria-required="true" aria-invalid={!!formErrors.department} aria-describedby={formErrors.department ? "cdept-error" : undefined} value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="w-full rounded border border-input bg-background px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Select a department</option>
                      {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {formErrors.department && <p id="cdept-error" className="text-sm text-gov-alert font-sans mt-1" role="alert">{formErrors.department}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="block font-sans text-sm font-medium text-foreground mb-1">
                      Message <span aria-hidden="true" className="text-gov-alert">*</span>
                    </label>
                    <textarea id="contact-message" required aria-required="true" aria-invalid={!!formErrors.message} aria-describedby={formErrors.message ? "cmsg-error" : undefined} rows={5} value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} className="w-full rounded border border-input bg-background px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-vertical" />
                    {formErrors.message && <p id="cmsg-error" className="text-sm text-gov-alert font-sans mt-1" role="alert">{formErrors.message}</p>}
                  </div>

                  <button type="submit" className="inline-flex items-center gap-2 rounded bg-primary px-6 py-2.5 font-sans font-semibold text-sm text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Submit Inquiry
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>
      </section>
    </>
  );
};

export default GovContact;
