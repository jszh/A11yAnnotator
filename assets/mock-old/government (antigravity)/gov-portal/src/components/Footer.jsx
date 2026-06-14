import { Link } from 'react-router-dom';
import { Mail, Phone, ExternalLink } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gov-neutral-100 border-t border-gov-neutral-200" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">Footer</h2>

            {/* Pre-footer - Sign up */}
            <div className="bg-gov-blue-50 py-12 border-b border-gov-neutral-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="md:w-1/2">
                            <h3 className="text-xl font-bold text-gov-neutral-900 mb-2">Sign up for email updates</h3>
                            <p className="text-gov-neutral-600 mb-0">Get news and alerts delivered to your inbox.</p>
                        </div>
                        <div className="mt-4 md:mt-0 md:w-1/2 md:flex md:justify-end">
                            <form className="sm:flex max-w-md w-full" onSubmit={(e) => e.preventDefault()}>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full px-5 py-3 placeholder-gov-neutral-500 focus:ring-2 focus:ring-gov-blue-500 focus:border-transparent border-gov-neutral-300 rounded-md sm:max-w-xs text-sm"
                                    placeholder="Enter your email"
                                />
                                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3 sm:flex-shrink-0">
                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gov-blue-700 hover:bg-gov-blue-800 focus-ring"
                                    >
                                        Sign up
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Links */}
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="xl:grid xl:grid-cols-4 xl:gap-8">
                    <div className="space-y-8 xl:col-span-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gov-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                US
                            </div>
                            <span className="text-xl font-bold text-gov-neutral-900 leading-tight">
                                United States<br />
                                <span className="text-sm font-normal">Government</span>
                            </span>
                        </div>
                        <p className="text-gov-neutral-600 text-sm">
                            An official website of the United States Government.
                        </p>
                        <div className="flex space-x-6">
                            <a href="tel:1-800-FED-INFO" className="text-gov-neutral-600 hover:text-gov-blue-700 flex items-center focus-ring p-1">
                                <span className="sr-only">Phone</span>
                                <Phone className="h-5 w-5 mr-2" />
                                1-800-FED-INFO
                            </a>
                        </div>
                        <div className="flex space-x-6">
                            <a href="mailto:contact@gov.example" className="text-gov-neutral-600 hover:text-gov-blue-700 flex items-center focus-ring p-1">
                                <span className="sr-only">Email</span>
                                <Mail className="h-5 w-5 mr-2" />
                                Contact Support
                            </a>
                        </div>
                    </div>
                    <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-3">
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-bold text-gov-neutral-900 tracking-wider uppercase mb-4">About Us</h3>
                                <ul className="space-y-3">
                                    <li><Link to="/about" className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block">About the Government</Link></li>
                                    <li><a href="#" className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block">Careers</a></li>
                                    <li><a href="#" className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block flex items-center">Open Data <ExternalLink className="ml-1 w-3 h-3" /></a></li>
                                </ul>
                            </div>
                            <div className="mt-12 md:mt-0">
                                <h3 className="text-sm font-bold text-gov-neutral-900 tracking-wider uppercase mb-4">Services</h3>
                                <ul className="space-y-3">
                                    <li><Link to="/services" className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block">All Services</Link></li>
                                    <li><Link to="/services/benefits" className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block">Benefits & Grants</Link></li>
                                    <li><Link to="/services/taxes" className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block">Taxes</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-bold text-gov-neutral-900 tracking-wider uppercase mb-4">Legal</h3>
                                <ul className="space-y-3">
                                    <li><a href="#" className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block">Privacy Policy</a></li>
                                    <li><a href="#" className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block">Terms of Service</a></li>
                                    <li><a href="#" className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block">Accessibility</a></li>
                                </ul>
                            </div>
                            <div className="mt-12 md:mt-0">
                                <h3 className="text-sm font-bold text-gov-neutral-900 tracking-wider uppercase mb-4">Language</h3>
                                <ul className="space-y-3">
                                    <li><button className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block text-left w-full">Español</button></li>
                                    <li><button className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block text-left w-full">Français</button></li>
                                    <li><button className="text-base text-gov-neutral-600 hover:text-gov-blue-800 hover:underline focus-ring px-1 py-1 block text-left w-full">中文</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-gov-neutral-900 py-6 text-center">
                <p className="text-gov-neutral-400 text-sm">
                    &copy; {new Date().getFullYear()} United States Government. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
