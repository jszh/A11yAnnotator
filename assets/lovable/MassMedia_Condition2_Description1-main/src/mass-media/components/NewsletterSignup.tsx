import { useState, useRef } from "react";

interface Props {
  variant?: "default" | "footer";
}

export default function NewsletterSignup({ variant = "default" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = "newsletter-error";
  const successId = "newsletter-success";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      inputRef.current?.focus();
      return;
    }
    setStatus("success");
    setEmail("");
  };

  const isFooter = variant === "footer";

  return (
    <form
      onSubmit={handleSubmit}
      className={isFooter ? "" : "bg-secondary p-6 border border-border"}
      noValidate
    >
      {!isFooter && (
        <h3 className="font-serif text-lg font-bold mb-2 text-foreground">Newsletter</h3>
      )}
      <p className={`font-sans text-sm mb-3 ${isFooter ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        Get the day's top stories delivered to your inbox.
      </p>
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor={`newsletter-email-${variant}`} className="sr-only">Email address</label>
          <input
            ref={inputRef}
            id={`newsletter-email-${variant}`}
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
            placeholder="your@email.com"
            aria-required="true"
            aria-invalid={status === "error"}
            aria-describedby={status === "error" ? errorId : undefined}
            className={`w-full px-3 py-2 text-sm font-sans border ${
              isFooter
                ? "bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50"
                : "bg-card border-border text-foreground placeholder:text-muted-foreground"
            } focus:outline-none focus:ring-2 focus:ring-accent`}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-accent text-accent-foreground text-sm font-sans font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0"
        >
          Sign Up
        </button>
      </div>
      {status === "error" && (
        <p id={errorId} role="alert" className="text-sm mt-2 font-sans text-accent">
          {errorMsg}
        </p>
      )}
      {status === "success" && (
        <p id={successId} role="status" aria-live="polite" className="text-sm mt-2 font-sans text-green-600">
          Thank you! Check your inbox to confirm.
        </p>
      )}
    </form>
  );
}
