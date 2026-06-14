import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Upload, CheckCircle2, Clock, AlertCircle, Search } from "lucide-react";
import Layout from "@/components/government/Layout";

const projectTypes = [
  "Residential Remodel",
  "New Construction",
  "Commercial Renovation",
  "Electrical Work",
  "Plumbing Work",
  "Demolition",
  "Sign Permit",
  "Special Event",
];

const mockApplications = [
  { id: "PKL-2026-0847", type: "Residential Remodel", address: "1425 Oak St", status: "approved", date: "Oct 15, 2026" },
  { id: "PKL-2026-0901", type: "Electrical Work", address: "3200 Main Ave", status: "review", date: "Nov 1, 2026" },
  { id: "PKL-2026-0923", type: "Sign Permit", address: "500 Lakewood Blvd", status: "pending", date: "Nov 10, 2026" },
];

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  approved: { label: "Approved", className: "bg-success/10 text-success", icon: CheckCircle2 },
  review: { label: "Under Review", className: "bg-accent/20 text-accent-foreground", icon: Clock },
  pending: { label: "Pending", className: "bg-secondary text-muted-foreground", icon: AlertCircle },
};

const PermitsPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", projectType: "", address: "", description: "" });
  const [trackingId, setTrackingId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground">
        <div className="gov-container py-12">
          <nav className="text-sm mb-4 opacity-70">
            <Link to="/">Home</Link> <span className="mx-2">/</span>
            <Link to="/services">Services</Link> <span className="mx-2">/</span>
            <span>Permits & Licenses</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Permits & Licenses</h1>
          <p className="text-lg opacity-85 max-w-2xl">
            Apply for building permits, check application status, and manage your existing permits online.
          </p>
        </div>
      </section>

      <section className="gov-section">
        <div className="gov-container">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Application Form */}
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
                <FileText className="h-6 w-6 text-accent" />
                Online Permit Application
              </h2>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Applicant Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Full legal name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Project Type</label>
                    <select
                      required
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Select a project type</option>
                      {projectTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Project Address</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Street address in Lakewood"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Project Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      placeholder="Brief description of the work..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Upload Documents</label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-accent transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop files here, or <span className="text-primary font-medium">browse</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB each</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                  >
                    Submit Application
                  </button>
                </form>
              ) : (
                <div className="bg-card border border-success/30 rounded-lg p-8 text-center">
                  <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                  <h3 className="text-xl font-serif font-bold text-foreground mb-2">Application Submitted!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your permit application has been received. Your tracking number is:
                  </p>
                  <p className="text-2xl font-mono font-bold text-primary mb-4">PKL-2026-0955</p>
                  <p className="text-sm text-muted-foreground">
                    You will receive a confirmation email shortly. Expected review time: 5–10 business days.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 px-6 py-2 border rounded-md text-sm font-medium text-primary hover:bg-secondary transition-colors"
                  >
                    Submit Another Application
                  </button>
                </div>
              )}
            </div>

            {/* Status Tracker */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
                <Search className="h-6 w-6 text-accent" />
                Track Your Application
              </h2>

              <div className="bg-card border rounded-lg p-6 mb-6">
                <label className="block text-sm font-medium text-foreground mb-1.5">Permit Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="e.g. PKL-2026-0847"
                  />
                  <button className="px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity">
                    Search
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-3">Recent Applications</h3>
              <div className="space-y-3">
                {mockApplications.map((app) => {
                  const status = statusConfig[app.status];
                  const StatusIcon = status.icon;
                  return (
                    <div key={app.id} className="bg-card border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono text-sm font-semibold text-foreground">{app.id}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${status.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{app.type}</p>
                      <p className="text-xs text-muted-foreground">{app.address} · Filed {app.date}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PermitsPage;
