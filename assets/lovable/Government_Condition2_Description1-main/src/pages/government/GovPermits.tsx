import { useState, useRef } from "react";
import GovBreadcrumb from "@/components/government/Breadcrumb";
import { CheckCircle2, Clock, FileCheck, Upload } from "lucide-react";

type Step = "form" | "confirmation";

const projectTypes = [
  "Residential Remodel",
  "New Construction",
  "Commercial Tenant Improvement",
  "Electrical Work",
  "Plumbing Work",
  "Demolition",
  "Other",
];

const trackerSteps = [
  { label: "Submitted", status: "complete" as const },
  { label: "Under Review", status: "current" as const },
  { label: "Approved", status: "pending" as const },
  { label: "Issued", status: "pending" as const },
];

const GovPermits = () => {
  const [step, setStep] = useState<Step>("form");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const confirmRef = useRef<HTMLHeadingElement>(null);

  const [form, setForm] = useState({
    name: "",
    projectType: "",
    address: "",
    files: null as FileList | null,
  });

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Applicant name is required.";
    if (!form.projectType) errors.projectType = "Please select a project type.";
    if (!form.address.trim()) errors.address = "Project address is required.";
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      setStep("confirmation");
      setTimeout(() => confirmRef.current?.focus(), 100);
    }
  };

  return (
    <>
      <GovBreadcrumb items={[{ label: "Services", path: "/government/services" }, { label: "Permits & Licenses" }]} />

      <section aria-labelledby="permits-heading" className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 id="permits-heading" className="font-serif text-3xl font-bold text-foreground mb-2">Permits & Licenses</h1>
          <p className="font-sans text-muted-foreground mb-8">Apply for building permits, track existing applications, and manage your licenses online.</p>

          {step === "form" ? (
            <>
              {/* Application form */}
              <section aria-labelledby="apply-heading" className="rounded-lg border border-border bg-card p-6 shadow-sm mb-10">
                <h2 id="apply-heading" className="font-serif text-xl font-bold text-foreground mb-6">Online Permit Application</h2>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="space-y-5">
                    {/* Name */}
                    <div>
                      <label htmlFor="applicant-name" className="block font-sans text-sm font-medium text-foreground mb-1">
                        Applicant Name <span aria-hidden="true" className="text-gov-alert">*</span>
                      </label>
                      <input
                        id="applicant-name"
                        type="text"
                        required
                        aria-required="true"
                        aria-invalid={!!formErrors.name}
                        aria-describedby={formErrors.name ? "name-error" : undefined}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded border border-input bg-background px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      {formErrors.name && <p id="name-error" className="text-sm text-gov-alert font-sans mt-1" role="alert">{formErrors.name}</p>}
                    </div>

                    {/* Project type */}
                    <div>
                      <label htmlFor="project-type" className="block font-sans text-sm font-medium text-foreground mb-1">
                        Project Type <span aria-hidden="true" className="text-gov-alert">*</span>
                      </label>
                      <select
                        id="project-type"
                        required
                        aria-required="true"
                        aria-invalid={!!formErrors.projectType}
                        aria-describedby={formErrors.projectType ? "type-error" : undefined}
                        value={form.projectType}
                        onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                        className="w-full rounded border border-input bg-background px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select a project type</option>
                        {projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {formErrors.projectType && <p id="type-error" className="text-sm text-gov-alert font-sans mt-1" role="alert">{formErrors.projectType}</p>}
                    </div>

                    {/* Address */}
                    <div>
                      <label htmlFor="project-address" className="block font-sans text-sm font-medium text-foreground mb-1">
                        Project Address <span aria-hidden="true" className="text-gov-alert">*</span>
                      </label>
                      <input
                        id="project-address"
                        type="text"
                        required
                        aria-required="true"
                        aria-invalid={!!formErrors.address}
                        aria-describedby={formErrors.address ? "address-error" : undefined}
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full rounded border border-input bg-background px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      {formErrors.address && <p id="address-error" className="text-sm text-gov-alert font-sans mt-1" role="alert">{formErrors.address}</p>}
                    </div>

                    {/* File upload */}
                    <div>
                      <label htmlFor="doc-upload" className="block font-sans text-sm font-medium text-foreground mb-1">
                        Supporting Documents (optional)
                      </label>
                      <div className="flex items-center gap-3">
                        <label htmlFor="doc-upload" className="inline-flex items-center gap-2 rounded border border-input bg-secondary px-4 py-2 font-sans text-sm cursor-pointer hover:bg-secondary/80 transition-colors">
                          <Upload className="h-4 w-4" aria-hidden="true" />
                          Choose Files
                        </label>
                        <input
                          id="doc-upload"
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={(e) => setForm({ ...form, files: e.target.files })}
                          accept=".pdf,.jpg,.png,.doc,.docx"
                        />
                        <span className="text-sm text-muted-foreground font-sans">
                          {form.files ? `${form.files.length} file(s) selected` : "No files chosen"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-sans mt-1">Accepted formats: PDF, JPG, PNG, DOC. Max 10MB each.</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-6 rounded bg-primary px-6 py-2.5 font-sans font-semibold text-sm text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Submit Permit Application
                  </button>
                </form>
              </section>

              {/* Status tracker */}
              <section aria-labelledby="tracker-heading" className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 id="tracker-heading" className="font-serif text-xl font-bold text-foreground mb-2">Application Status Tracker</h2>
                <p className="font-sans text-sm text-muted-foreground mb-6">Track your existing permit application (Demo: Application #PKT-2024-0847)</p>
                <div className="flex items-center gap-0" role="list" aria-label="Application progress">
                  {trackerSteps.map((s, i) => (
                    <div key={s.label} className="flex items-center flex-1" role="listitem">
                      <div className="flex flex-col items-center text-center flex-1">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          s.status === "complete" ? "bg-gov-success border-gov-success text-primary-foreground" :
                          s.status === "current" ? "border-primary bg-gov-info text-primary" :
                          "border-border bg-muted text-muted-foreground"
                        }`} aria-label={`${s.label}: ${s.status === "complete" ? "Complete" : s.status === "current" ? "In progress" : "Pending"}`}>
                          {s.status === "complete" ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> :
                           s.status === "current" ? <Clock className="h-5 w-5" aria-hidden="true" /> :
                           <FileCheck className="h-5 w-5" aria-hidden="true" />}
                        </div>
                        <span className={`text-xs font-sans mt-2 ${s.status === "current" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                      </div>
                      {i < trackerSteps.length - 1 && (
                        <div className={`h-0.5 flex-1 ${s.status === "complete" ? "bg-gov-success" : "bg-border"}`} aria-hidden="true" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section aria-labelledby="confirm-heading" className="rounded-lg border-2 border-gov-success bg-gov-success-bg p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-gov-success mx-auto mb-4" aria-hidden="true" />
              <h2 id="confirm-heading" ref={confirmRef} tabIndex={-1} className="font-serif text-2xl font-bold text-foreground mb-2">Application Submitted</h2>
              <p className="font-sans text-muted-foreground mb-1" aria-live="polite">Your permit application has been successfully submitted.</p>
              <p className="font-sans text-sm text-muted-foreground mb-6">Reference Number: <strong className="text-foreground">PKT-2024-0848</strong></p>
              <button onClick={() => { setStep("form"); setForm({ name: "", projectType: "", address: "", files: null }); setFormErrors({}); }} className="rounded bg-primary px-6 py-2.5 font-sans font-semibold text-sm text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                Submit Another Application
              </button>
            </section>
          )}
        </div>
      </section>
    </>
  );
};

export default GovPermits;
