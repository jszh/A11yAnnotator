import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const GovBreadcrumb = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav aria-label="Breadcrumb" className="bg-secondary py-3">
    <div className="container mx-auto px-4">
      <ol className="flex items-center gap-1.5 text-sm font-sans text-muted-foreground">
        <li>
          <Link to="/government" className="hover:text-foreground transition-colors">Home</Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            {item.path ? (
              <Link to={item.path} className="hover:text-foreground transition-colors">{item.label}</Link>
            ) : (
              <span aria-current="page" className="text-foreground font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  </nav>
);

export default GovBreadcrumb;
