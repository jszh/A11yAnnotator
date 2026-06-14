import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface AlertBannerProps {
  message: string;
  linkText?: string;
  linkHref?: string;
}

export default function AlertBanner({ message, linkText, linkHref }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gov-alert text-gov-alert-foreground" role="alert" aria-live="assertive">
      <div className="gov-container flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-semibold">
            {message}
            {linkText && linkHref && (
              <>
                {" — "}
                <a href={linkHref} className="underline hover:no-underline focus-ring rounded font-bold">
                  {linkText}
                </a>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="focus-ring rounded-sm p-1 hover:bg-gov-alert-foreground/10 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
