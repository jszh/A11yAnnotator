import ServiceCard from '../components/ServiceCard';
import { Briefcase, Heart, Home, GraduationCap, Shield, Activity } from 'lucide-react';

export default function Services() {
    const services = [
        { title: 'Employment & Jobs', description: 'Find jobs, file for unemployment, and explore training programs.', icon: <Briefcase /> },
        { title: 'Healthcare', description: 'Apply for Medicaid, Medicare, and find public health resources.', icon: <Activity /> },
        { title: 'Housing & Utilities', description: 'Get help with rent, mortgages, and utility bills.', icon: <Home /> },
        { title: 'Education', description: 'Student loans, grants, and continuing education resources.', icon: <GraduationCap /> },
        { title: 'Family & Social Services', description: 'Childcare assistance, food benefits, and family support.', icon: <Heart /> },
        { title: 'Safety & Justice', description: 'Report a crime, find consumer protection info, and more.', icon: <Shield /> }
    ];

    return (
        <div className="bg-white">
            <div className="bg-gov-blue-50 py-12 border-b border-gov-blue-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-bold text-gov-blue-900 mb-4">All Services</h1>
                    <p className="text-xl text-gov-blue-800 max-w-3xl">
                        Browse by category to find exactly what you need. From healthcare to business licenses, we're here to help.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <ServiceCard
                            key={index}
                            title={service.title}
                            description={service.description}
                            path="/services/benefits"
                            icon={service.icon}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
