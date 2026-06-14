import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

const EduFooter = () => (
  <footer className="border-t border-border bg-primary text-primary-foreground">
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10">
              <GraduationCap className="h-5 w-5 text-edu-gold" />
            </div>
            <span className="font-display text-xl font-bold">
              Skill<span className="text-edu-gold">Forge</span>
            </span>
          </div>
          <p className="text-sm text-primary-foreground/70 leading-relaxed">
            Industry-recognized certifications for career changers and professionals.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3 text-edu-gold">Programs</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><Link to="/edu-portal/courses" className="hover:text-primary-foreground transition-colors">Browse Courses</Link></li>
            <li><Link to="/edu-portal/pricing" className="hover:text-primary-foreground transition-colors">Pricing & Plans</Link></li>
            <li><span className="cursor-default">Career Paths</span></li>
            <li><span className="cursor-default">Employer Partners</span></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3 text-edu-gold">Resources</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><Link to="/edu-portal/study" className="hover:text-primary-foreground transition-colors">Learning Tools</Link></li>
            <li><span className="cursor-default">Blog</span></li>
            <li><span className="cursor-default">Help Center</span></li>
            <li><span className="cursor-default">Student Handbook</span></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3 text-edu-gold">Company</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><span className="cursor-default">About Us</span></li>
            <li><span className="cursor-default">Accreditation</span></li>
            <li><span className="cursor-default">Careers</span></li>
            <li><span className="cursor-default">Contact</span></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-primary-foreground/50">© 2026 SkillForge. All rights reserved.</p>
        <div className="flex gap-6 text-xs text-primary-foreground/50">
          <span className="cursor-default">Privacy Policy</span>
          <span className="cursor-default">Terms of Service</span>
          <span className="cursor-default">Accreditation</span>
        </div>
      </div>
    </div>
  </footer>
);

export default EduFooter;
