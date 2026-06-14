import HeroEnterpriseSaaS from '../components/HeroEnterpriseSaaS';
import EnterpriseSolutionCard from '../components/EnterpriseSolutionCard';
import LogoTrustStrip from '../components/LogoTrustStrip';

function Enterprise() {
    const solutions = [
        {
            title: "For Business",
            description: "Upskill your employees with curated learning paths aligned with your strategic business goals. Track progress and measure ROI with powerful analytics.",
            imageColorClass: "bg-blue-600",
            linkText: "Explore Business Solutions"
        },
        {
            title: "For Campus",
            description: "Enhance your university's curriculum with job-relevant skills from top tech companies. Improve student employability and career outcomes.",
            imageColorClass: "bg-emerald-600",
            linkText: "Explore Campus Solutions"
        },
        {
            title: "For Government",
            description: "Empower citizens with the skills they need for the modern workforce. Build scalable, high-impact workforce development programs.",
            imageColorClass: "bg-purple-600",
            linkText: "Explore Government Solutions"
        }
    ];

    return (
        <div className="bg-slate-50 min-h-screen">
            <HeroEnterpriseSaaS />

            <LogoTrustStrip />

            <div className="container mx-auto px-4 py-24">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Tailored solutions for every organization</h2>
                    <p className="text-xl text-slate-600">Discover how our platform can help you achieve your learning and development objectives at scale.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {solutions.map((solution, i) => (
                        <EnterpriseSolutionCard key={i} {...solution} />
                    ))}
                </div>
            </div>

            <div className="bg-slate-900 text-white py-24 border-t border-slate-800 text-center">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-3xl font-bold mb-6">Ready to transform your workforce?</h2>
                    <p className="text-xl text-slate-400 mb-10">Get in touch with our team to discuss your needs and get a customized demo.</p>
                    <button className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-1">
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Enterprise;
