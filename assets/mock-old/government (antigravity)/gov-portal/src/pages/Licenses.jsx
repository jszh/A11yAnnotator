import ServiceCard from '../components/ServiceCard';
import { Building, Car, Briefcase } from 'lucide-react';

export default function Licenses() {
    return (
        <div className="bg-white">
            <div className="bg-gov-neutral-50 py-12 border-b border-gov-neutral-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="text-sm mb-4" aria-label="Breadcrumb">
                        <ol className="list-none p-0 inline-flex">
                            <li className="flex items-center">
                                <a href="/" className="text-gov-blue-700 hover:text-gov-blue-900 hover:underline">Home</a>
                                <span className="text-gov-neutral-500 mx-2">/</span>
                            </li>
                            <li className="flex items-center">
                                <a href="/services" className="text-gov-blue-700 hover:text-gov-blue-900 hover:underline">Services</a>
                                <span className="text-gov-neutral-500 mx-2">/</span>
                            </li>
                            <li className="text-gov-neutral-500" aria-current="page">Licenses & Permits</li>
                        </ol>
                    </nav>
                    <h1 className="text-4xl font-bold text-gov-neutral-900 mb-4">Licenses & Permits</h1>
                    <p className="text-xl text-gov-neutral-700 max-w-3xl">
                        Apply for, renew, or replace personal and business licenses, permits, and certificates.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <ServiceCard
                        title="Business Licenses"
                        description="Start or expand your business. Apply for standard operating licenses and specialized permits."
                        path="#"
                        icon={<Building />}
                        linkText="Business portal"
                    />
                    <ServiceCard
                        title="Driver's Licenses & ID"
                        description="Renew your driver's license, apply for a real ID, or update your vehicle registration."
                        path="#"
                        icon={<Car />}
                        linkText="DMV services"
                    />
                    <ServiceCard
                        title="Professional Licensing"
                        description="Credentials, certifications, and licenses for teachers, contractors, healthcare workers, and more."
                        path="#"
                        icon={<Briefcase />}
                        linkText="Professional portal"
                    />
                </div>
            </div>
        </div>
    );
}
