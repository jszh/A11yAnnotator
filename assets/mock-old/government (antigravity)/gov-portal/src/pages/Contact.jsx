import { Phone, Mail, MapPin, Search } from 'lucide-react';

export default function Contact() {
    return (
        <div className="bg-white">
            <div className="bg-gov-blue-50 py-12 border-b border-gov-blue-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="text-sm mb-4" aria-label="Breadcrumb">
                        <ol className="list-none p-0 inline-flex">
                            <li className="flex items-center">
                                <a href="/" className="text-gov-blue-700 hover:text-gov-blue-900 hover:underline">Home</a>
                                <span className="text-gov-neutral-500 mx-2">/</span>
                            </li>
                            <li className="text-gov-neutral-500" aria-current="page">Contact Us</li>
                        </ol>
                    </nav>
                    <h1 className="text-4xl font-bold text-gov-blue-900 mb-4">Contact Us</h1>
                    <p className="text-xl text-gov-blue-800 max-w-3xl">
                        Get answers to your questions and find the right agency to help you.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid lg:grid-cols-2 gap-16">

                    <div>
                        <h2 className="text-2xl font-bold text-gov-neutral-900 mb-6">How can we help?</h2>

                        <div className="space-y-8">
                            <div className="flex">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-12 h-12 bg-gov-blue-100 rounded-full flex items-center justify-center text-gov-blue-700">
                                        <Search className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="ml-6">
                                    <h3 className="text-xl font-bold text-gov-neutral-900 mb-2">Find an Agency</h3>
                                    <p className="text-gov-neutral-600 mb-4">
                                        The fastest way to get help is to contact the specific agency responsible for your issue (e.g., taxes, passports, or social security).
                                    </p>
                                    <button className="bg-gov-blue-700 text-white px-6 py-2 rounded-md hover:bg-gov-blue-800 focus-ring font-medium shadow-sm transition-colors">
                                        Search Agencies
                                    </button>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-12 h-12 bg-gov-blue-100 rounded-full flex items-center justify-center text-gov-blue-700">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="ml-6">
                                    <h3 className="text-xl font-bold text-gov-neutral-900 mb-2">Call the Call Center</h3>
                                    <p className="text-gov-neutral-600 mb-4">
                                        Our general information hotline can help direct you to the right place. Available 8 AM - 8 PM ET, Monday - Friday.
                                    </p>
                                    <p className="text-2xl font-bold text-gov-neutral-900">
                                        1-800-FED-INFO
                                    </p>
                                    <p className="text-sm text-gov-neutral-500 mt-1">
                                        (1-800-333-4636)
                                    </p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-12 h-12 bg-gov-blue-100 rounded-full flex items-center justify-center text-gov-blue-700">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="ml-6">
                                    <h3 className="text-xl font-bold text-gov-neutral-900 mb-2">Email Us</h3>
                                    <p className="text-gov-neutral-600 mb-4">
                                        Send us your general questions. We aim to respond within 2-3 business days. For specific case information, please contact the relevant agency directly.
                                    </p>
                                    <a href="mailto:contact@gov.example" className="font-semibold text-gov-blue-700 hover:text-gov-blue-900 hover:underline focus-ring px-1 py-1 inline-block">
                                        contact@gov.example
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="bg-gov-neutral-50 border border-gov-neutral-200 rounded-lg p-8 h-full">
                            <h2 className="text-2xl font-bold text-gov-neutral-900 mb-6">Send a Message</h2>
                            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                                <div>
                                    <label htmlFor="topic" className="block text-sm font-medium text-gov-neutral-900 mb-1">
                                        What is this regarding? <span className="text-red-600" aria-label="Required">*</span>
                                    </label>
                                    <select
                                        id="topic"
                                        name="topic"
                                        required
                                        className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gov-neutral-300 focus:outline-none focus:ring-2 focus:ring-gov-blue-500 rounded-md"
                                    >
                                        <option value="">Select a topic...</option>
                                        <option value="taxes">Taxes & Finances</option>
                                        <option value="benefits">Benefits & Assistance</option>
                                        <option value="immigration">Immigration</option>
                                        <option value="technical">Technical Support with this Website</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="first-name" className="block text-sm font-medium text-gov-neutral-900 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="first-name"
                                            name="first-name"
                                            className="mt-1 block w-full px-3 py-3 border border-gov-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gov-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="last-name" className="block text-sm font-medium text-gov-neutral-900 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="last-name"
                                            name="last-name"
                                            className="mt-1 block w-full px-3 py-3 border border-gov-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gov-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gov-neutral-900 mb-1">
                                        Email Address <span className="text-red-600" aria-label="Required">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        className="mt-1 block w-full px-3 py-3 border border-gov-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gov-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gov-neutral-900 mb-1">
                                        Message <span className="text-red-600" aria-label="Required">*</span>
                                    </label>
                                    <p className="text-sm text-gov-neutral-500 mb-2">Please do not include sensitive information like your Social Security Number.</p>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        required
                                        className="mt-1 block w-full px-3 py-3 border border-gov-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gov-blue-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gov-blue-700 text-white font-bold py-3 px-4 rounded hover:bg-gov-blue-800 focus-ring shadow-sm transition-colors"
                                >
                                    Submit Inquiry
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
