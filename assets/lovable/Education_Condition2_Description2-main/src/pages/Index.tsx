import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-edu-navy">
      <BookOpen className="h-16 w-16 text-edu-amber mb-6" aria-hidden="true" />
      <h1 className="text-4xl font-bold text-primary-foreground mb-2">SkillForge</h1>
      <p className="text-primary-foreground/60 mb-8">Education Platform Mockup</p>
      <Link
        to="/edu-portal"
        className="inline-flex items-center gap-2 rounded-lg bg-edu-amber px-6 py-3 font-semibold text-edu-navy hover:opacity-90 transition-opacity"
      >
        Enter Platform <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </Link>
    </div>
  );
};

export default Index;
