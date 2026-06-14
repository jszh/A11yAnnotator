import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Clock, Mail, MapPin, Send, CheckCircle2, Facebook, Twitter, Youtube } from "lucide-react";
import Layout from "@/components/government/Layout";

const departments = [
  { name: "City Manager's Office", phone: "(562) 866-9771 x2100", hours: "Mon–Fri 8AM–5PM" },
  { name: "Public Works", phone: "(562) 866-9771 x2200", hours: "Mon–Fri 7AM–4PM" },
  { name: "Community Development", phone: "(562) 866-9771 x2300", hours: "Mon–Fri 8AM–5PM" },
  { name: "Parks & Recreation", phone: "(562) 866-9771 x2400", hours: "Mon–Fri 8AM–6PM" },
  { name: "Finance Department", phone: "(562) 866-9771 x2500", hours: "Mon–Fri 8AM–5PM" },
  { name: "Water Resources", phone: "(562) 866-9771 x2600", hours: "Mon–Fri 7:30AM–4:30PM" },
];

const deptOptions = ["General Inquiry", ...departments.map((d) => d.name)];

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground">
        <div className="gov-container py-12">
          <nav className="text-sm mb-4 opacity-70">
            <Link to="/">Home</Link> <span className="mx-2">/</span> <span>Contact</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Contact Us</h1>
          <p className="text-lg opacity-85 max-w-2xl">
            We're here to help. Reach out to the appropriate department or send us a message.
          </p>
        </div>
      </section>

      <section className="gov-section">
        <div className="gov-container">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
                <Send className="h-6 w-6 text-accent" />
                Send Us a Message
              </h2>

              {!submitted ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                  className="bg-card border rounded-lg p-6 space-y-5"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Your Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="you@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Department</label>
                    <select className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                      {deptOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                    <textarea
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                  >
                    Send Message
                  </button>
                </form>
              ) : (
                <div className="bg-card border border-success/30 rounded-lg p-8 text-center">
                  <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                  <h3 className="text-xl font-serif font-bold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">We typically respond within 2 business days.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 px-6 py-2 border rounded-md text-sm font-medium text-primary hover:bg-secondary transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              )}

              {/* Map */}
              <div className="mt-8">
                <h3 className="font-serif font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" />
                  City Hall Location
                </h3>
                <div className="rounded-lg overflow-hidden border h-64">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3317.1!2d-118.135!3d33.845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDUwJzQyLjAiTiAxMTjCsDA4JzA2LjAiVw!5e0!3m2!1sen!2sus!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="City Hall Map"
                  />
                </div>
              </div>
            </div>

            {/* Department Directory */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6">Department Directory</h2>
              <div className="space-y-3">
                {departments.map((dept) => (
                  <div key={dept.name} className="bg-card border rounded-lg p-4">
                    <h3 className="font-semibold text-sm text-foreground mb-2">{dept.name}</h3>
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 text-accent" />
                        {dept.phone}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 text-accent" />
                        {dept.hours}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Media */}
              <div className="mt-8 bg-card border rounded-lg p-6">
                <h3 className="font-serif font-bold text-foreground mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  <a href="#" className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-md text-sm text-secondary-foreground hover:bg-accent/20 transition-colors">
                    <Facebook className="h-4 w-4" /> Facebook
                  </a>
                  <a href="#" className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-md text-sm text-secondary-foreground hover:bg-accent/20 transition-colors">
                    <Twitter className="h-4 w-4" /> Twitter
                  </a>
                  <a href="#" className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-md text-sm text-secondary-foreground hover:bg-accent/20 transition-colors">
                    <Youtube className="h-4 w-4" /> YouTube
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ContactPage;
