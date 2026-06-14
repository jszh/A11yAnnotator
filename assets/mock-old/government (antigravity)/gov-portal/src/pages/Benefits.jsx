import ServiceCard from '../components/ServiceCard';
import { Briefcase, FileText, CheckCircle } from 'lucide-react';

export default function Benefits() {
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
                            <li className="text-gov-neutral-500" aria-current="page">Benefits & Assistance</li>
                        </ol>
                    </nav>
                    <h1 className="text-4xl font-bold text-gov-neutral-900 mb-4">Benefits & Assistance</h1>
                    <p className="text-xl text-gov-neutral-700 max-w-3xl">
                        Check your eligibility and apply for government assistance programs, including unemployment, food stamps, and housing aid.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="lg:w-2/3">
                        <h2 className="text-2xl font-bold text-gov-neutral-900 mb-6 border-b pb-4">Popular Benefit Programs</h2>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <ServiceCard
                                title="Unemployment Benefits"
                                description="Apply for financial assistance if you have lost your job through no fault of your own."
                                path="#"
                                icon={<Briefcase />}
                                linkText="Apply for unemployment"
                            />
                            <ServiceCard
                                title="SNAP (Food Stamps)"
                                description="Get assistance buying healthy food for you and your family."
                                path="#"
                                icon={<CheckCircle />}
                                linkText="Check SNAP eligibility"
                            />
                        </div>

                        <div className="mt-12 bg-gov-blue-50 border-l-4 border-gov-blue-600 p-6 rounded-r-lg">
                            <h3 className="text-xl font-bold text-gov-blue-900 mb-2">Need help finding benefits?</h3>
                            <p className="text-gov-blue-800 mb-4">
                                Use our Benefits Finder tool to see which programs you may be eligible for in less than 5 minutes.
                            </p>
                            <button className="bg-white text-gov-blue-700 border border-gov-blue-700 font-semibold py-2 px-6 rounded hover:bg-gov-blue-50 focus-ring shadow-sm transition-colors">
                                Start Benefits Finder
                            </button>
                        </div>
                    </div>

                    <div className="lg:w-1/3">
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 className="font-bold text-lg mb-4 text-gov-neutral-900">Before you apply</h3>
                            <p className="text-sm text-gov-neutral-700 mb-4">Make sure you have the following information ready:</p>
                            <ul className="space-y-3 text-sm text-gov-neutral-700">
                                <li className="flex items-start"><FileText className="w-4 h-4 mr-2 text-gov-neutral-500 mt-0.5" /> Social Security Number</li>
                                <li className="flex items-start"><FileText className="w-4 h-4 mr-2 text-gov-neutral-500 mt-0.5" /> Recent pay stubs</li>
                                <li className="flex items-start"><FileText className="w-4 h-4 mr-2 text-gov-neutral-500 mt-0.5" /> Bank account information</li>
                                <li className="flex items-start"><FileText className="w-4 h-4 mr-2 text-gov-neutral-500 mt-0.5" /> Identity verification</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
