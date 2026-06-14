import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-body">
      <div className="text-center">
        <h1 className="font-display text-5xl text-foreground mb-2">
          <span className="text-folia-coral">f</span>olia
        </h1>
        <p className="text-muted-foreground mb-8">A creative community for artists & designers</p>
        <Link to="/social-media">
          <Button className="bg-folia-coral text-primary-foreground hover:bg-folia-coral/90 gap-2 font-semibold">
            Enter Platform <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
