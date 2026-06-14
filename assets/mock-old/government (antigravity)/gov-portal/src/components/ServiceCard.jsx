import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ServiceCard({ title, description, linkText, path, icon }) {
    return (
        <div className="bg-white border border-gov-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">
            <div className="p-6 flex-grow">
                <div className="text-gov-blue-700 mb-4 bg-gov-blue-50 w-12 h-12 rounded-full flex items-center justify-center">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-gov-neutral-900 mb-3 group-hover:text-gov-blue-800 transition-colors">
                    {title}
                </h3>
                <p className="text-gov-neutral-600 leading-relaxed text-sm">
                    {description}
                </p>
            </div>
            <div className="p-6 pt-0 mt-auto">
                <Link
                    to={path}
                    className="inline-flex items-center font-medium text-gov-blue-700 hover:text-gov-blue-900 hover:underline focus-ring px-1 py-1"
                >
                    {linkText || 'Learn more'}
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </div>
    );
}
