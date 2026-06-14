import HeroProductPlans from '../components/HeroProductPlans';
import PlanComparisonCard from '../components/PlanComparisonCard';

function Plans() {
    const plans = [
        {
            title: "Basic",
            description: "Essential tools for casual learners.",
            price: "Free",
            features: ["Access to free courses", "Basic flashcards", "Community support"],
            isPopular: false,
            buttonText: "Start Learning"
        },
        {
            title: "Plus",
            description: "Everything you need to master new skills.",
            price: "$19.99",
            features: ["All Basic features", "Unlimited practice tests", "AI-powered study paths", "Offline access"],
            isPopular: true,
            buttonText: "Start 7-day Free Trial"
        },
        {
            title: "Pro",
            description: "Advanced features for serious professionals.",
            price: "$39.99",
            features: ["All Plus features", "Certificates of completion", "1-on-1 expert coaching", "Career services access"],
            isPopular: false,
            buttonText: "Upgrade to Pro"
        }
    ];

    return (
        <div className="bg-slate-50 min-h-screen">
            <HeroProductPlans />

            <div className="container mx-auto px-4 py-20 -mt-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, i) => (
                        <div key={i} className={i === 1 ? 'transform md:-translate-y-4' : ''}>
                            <PlanComparisonCard {...plan} />
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                    <p className="text-slate-600 mb-8">Have questions? We're here to help.</p>
                    <a href="#" className="font-semibold text-brand-600 hover:text-brand-700 underline">Visit our Help Center</a>
                </div>
            </div>
        </div>
    );
}

export default Plans;
