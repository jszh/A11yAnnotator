import { ExternalLink } from 'lucide-react';

export default function About() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="bg-gov-blue-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">About the Government</h1>
                    <p className="text-xl text-gov-blue-100 max-w-3xl mx-auto">
                        Our mission is to provide transparent, accessible, and secure digital services to all citizens.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col md:flex-row gap-16">

                    <div className="md:w-2/3">
                        <h2 className="text-3xl font-bold text-gov-neutral-900 mb-6">Our Digital Initiative</h2>
                        <div className="prose prose-lg text-gov-neutral-700 space-y-6">
                            <p>
                                The Department of Digital Services was created to modernize how the public interacts with government services. By centering our design on user needs, accessibility, and modern technology standards, we aim to build trust and simplify complex processes.
                            </p>
                            <p>
                                We believe that interacting with the government should be as seamless as any consumer service. That means clear language, fast load times, and an interface that works on any device, anywhere.
                            </p>
                            <h3 className="text-2xl font-bold text-gov-neutral-900 mt-10 mb-4">Core Principles</h3>
                            <ul className="list-disc pl-6 space-y-2 text-gov-neutral-700">
                                <li><strong>Accessibility First:</strong> Building tools that work for everyone, including those utilizing assistive technologies.</li>
                                <li><strong>Privacy & Security:</strong> Safeguarding citizen data with industry-leading security practices.</li>
                                <li><strong>Transparency:</strong> Making data and processes open and understandable.</li>
                                <li><strong>Continuous Improvement:</strong> Iterating on our services based directly on citizen feedback.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="md:w-1/3">
                        <div className="bg-gov-neutral-50 p-8 rounded-lg border border-gov-neutral-200 sticky top-28">
                            <h3 className="text-xl font-bold text-gov-neutral-900 mb-4">Leadership & Structure</h3>
                            <ul className="space-y-4">
                                <li>
                                    <a href="#" className="text-gov-blue-700 hover:underline focus-ring px-1 py-1 font-medium block">
                                        Branches of Government
                                    </a>
                                    <p className="text-sm text-gov-neutral-600 mt-1">Learn about the Executive, Legislative, and Judicial branches.</p>
                                </li>
                                <li>
                                    <a href="#" className="text-gov-blue-700 hover:underline focus-ring px-1 py-1 font-medium block">
                                        Agency Directory
                                    </a>
                                    <p className="text-sm text-gov-neutral-600 mt-1">A complete list of departments and agencies.</p>
                                </li>
                                <li>
                                    <a href="#" className="text-gov-blue-700 hover:underline focus-ring px-1 py-1 font-medium flex items-center">
                                        Open Data Portal <ExternalLink className="w-4 h-4 ml-1" />
                                    </a>
                                    <p className="text-sm text-gov-neutral-600 mt-1">Access public datasets and reports.</p>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
