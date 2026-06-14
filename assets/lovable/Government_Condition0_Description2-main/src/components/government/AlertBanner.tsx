import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface AlertBannerProps {
  message: string;
  cta?: string;
  ctaLink?: string;
}

const AlertBanner = ({ message, cta, ctaLink }: AlertBannerProps) => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="bg-gov-alert text-gov-alert-foreground">
      <div className="container flex items-center justify-between py-3 gap-4">
        <div className="flex items-center gap-3 font-body text-sm font-semibold">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{message}</span>
          {cta && ctaLink && (
            <a href={ctaLink} className="underline font-bold hover:no-underline ml-1">{cta}</a>
          )}
        </div>
        <button onClick={() => setVisible(false)} className="shrink-0 hover:opacity-70">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default AlertBanner;
