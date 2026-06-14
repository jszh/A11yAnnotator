import ServiceCard from '../components/ServiceCard';
import { DollarSign, FileCheck, HelpCircle } from 'lucide-react';

export default function Taxes() {
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
                            <li className="text-gov-neutral-500" aria-current="page">Taxes</li>
                        </ol>
                    </nav>
                    <h1 className="text-4xl font-bold text-gov-neutral-900 mb-4">Taxes</h1>
                    <p className="text-xl text-gov-neutral-700 max-w-3xl">
                        Information and services for filing taxes, making payments, and understanding your tax obligations.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    <ServiceCard
                        title="File Your Taxes"
                        description="Access free online filing tools, forms, and instructions for the current tax year."
                        path="#"
                        icon={<FileCheck />}
                        linkText="Start filing"
                    />
                    <ServiceCard
                        title="Make a Payment"
                        description="Pay your taxes securely online directly from your bank account or by card."
                        path="#"
                        icon={<DollarSign />}
                        linkText="Pay now"
                    />
                    <ServiceCard
                        title="Where's My Refund?"
                        description="Check the status of your tax refund online. Available 24 hours after e-filing."
                        path="#"
                        icon={<HelpCircle />}
                        linkText="Check status"
                    />
                </div>

                <div className="bg-white border text-center p-10 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold mb-4">Tax Preparation Assistance</h2>
                    <p className="max-w-2xl mx-auto text-gov-neutral-700 mb-6">
                        Free tax preparation assistance is available for qualifying taxpayers, including those with lower incomes, seniors, and non-English speakers.
                    </p>
                    <button className="bg-gov-blue-700 text-white px-6 py-2 rounded-md hover:bg-gov-blue-800 focus-ring font-medium">
                        Find free tax help near you
                    </button>
                </div>
            </div>
        </div>
    );
}
