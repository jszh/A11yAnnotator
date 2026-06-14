import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 font-serif text-4xl font-bold text-foreground">Welcome</h1>
        <p className="text-lg text-muted-foreground font-sans mb-6">Choose a project to explore:</p>
        <Link
          to="/mass-media"
          className="inline-block px-6 py-3 bg-foreground text-primary-foreground font-sans font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          The Meridian — News Portal
        </Link>
      </div>
    </div>
  );
};

export default Index;
