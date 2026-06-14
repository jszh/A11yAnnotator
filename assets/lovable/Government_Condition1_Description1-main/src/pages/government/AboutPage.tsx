import { Link } from "react-router-dom";
import { Download, Users } from "lucide-react";
import Layout from "@/components/government/Layout";
import cityHall from "@/assets/city-hall.jpg";
import mayor from "@/assets/mayor.jpg";
import council1 from "@/assets/council1.jpg";
import council2 from "@/assets/council2.jpg";
import council3 from "@/assets/council3.jpg";
import council4 from "@/assets/council4.jpg";

const leaders = [
  { name: "James R. Mitchell", title: "Mayor", image: mayor, since: "2022" },
  { name: "Sarah Nguyen", title: "Council Member, District 1", image: council1, since: "2020" },
  { name: "Robert Castellano", title: "Council Member, District 2", image: council2, since: "2018" },
  { name: "Patricia Owens", title: "Council Member, District 3", image: council3, since: "2020" },
  { name: "David Chen", title: "Council Member, District 4", image: council4, since: "2024" },
];

const AboutPage = () => {
  return (
    <Layout>
      <section className="bg-primary text-primary-foreground">
        <div className="gov-container py-12">
          <nav className="text-sm mb-4 opacity-70">
            <Link to="/">Home</Link> <span className="mx-2">/</span> <span>About</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">About Lakewood</h1>
          <p className="text-lg opacity-85 max-w-2xl">
            Learn about our city's rich history, dedicated leadership, and vision for the future.
          </p>
        </div>
      </section>

      {/* City History */}
      <section className="gov-section">
        <div className="gov-container">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Our City</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  The City of Lakewood was incorporated on April 16, 1954, and has since grown into one of the most
                  vibrant communities in Los Angeles County. With approximately 160,000 residents across 9.5 square
                  miles, Lakewood is known for its well-maintained neighborhoods, excellent parks, and strong sense
                  of community.
                </p>
                <p>
                  Originally developed as a planned community in the post-World War II era, Lakewood pioneered the
                  "Lakewood Plan" — a model of municipal governance that allows cities to contract with county
                  agencies for essential services, keeping costs low while maintaining high quality of life.
                </p>
                <p>
                  Today, Lakewood continues to invest in infrastructure, public safety, and community programs
                  that make it an ideal place to live, work, and raise a family.
                </p>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img src={cityHall} alt="Lakewood City Hall" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="bg-secondary">
        <div className="gov-container py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Our Mission</h2>
            <blockquote className="text-lg text-muted-foreground italic leading-relaxed border-l-4 border-accent pl-6 text-left">
              "To provide responsive, cost-effective municipal services that enhance the quality of life for all
              Lakewood residents, foster economic vitality, and preserve the character of our neighborhoods — guided
              by transparency, integrity, and community engagement."
            </blockquote>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="gov-section">
        <div className="gov-container">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-serif font-bold text-foreground flex items-center justify-center gap-2">
              <Users className="h-6 w-6 text-accent" />
              City Leadership
            </h2>
            <p className="text-muted-foreground mt-2">Meet the elected officials serving Lakewood</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {leaders.map((leader) => (
              <div key={leader.name} className="bg-card border rounded-lg overflow-hidden text-center group hover:shadow-md transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-serif font-bold text-foreground">{leader.name}</h3>
                  <p className="text-sm text-muted-foreground">{leader.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">Since {leader.since}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Annual Report */}
      <section className="bg-card border-t border-b">
        <div className="gov-container py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-foreground">2025 Annual Report</h3>
              <p className="text-sm text-muted-foreground">Review the city's accomplishments, financials, and future plans.</p>
            </div>
            <a
              href="#"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
