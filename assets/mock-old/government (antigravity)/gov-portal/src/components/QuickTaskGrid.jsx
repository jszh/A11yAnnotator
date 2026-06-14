import { FileText, Briefcase, Heart, Building, GraduationCap, Car } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuickTaskGrid() {
    const tasks = [
        { name: 'Apply for Unemployment', icon: <Briefcase className="w-8 h-8" />, path: '/services/benefits' },
        { name: 'File Taxes', icon: <FileText className="w-8 h-8" />, path: '/services/taxes' },
        { name: 'Healthcare Benefits', icon: <Heart className="w-8 h-8" />, path: '/services/benefits' },
        { name: 'Business Licenses', icon: <Building className="w-8 h-8" />, path: '/services/licenses' },
        { name: 'Student Loans', icon: <GraduationCap className="w-8 h-8" />, path: '/services' },
        { name: 'DMV Services', icon: <Car className="w-8 h-8" />, path: '/services' },
    ];

    return (
        <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-gov-neutral-900 mb-8">What do you need to do?</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {tasks.map((task, index) => (
                        <Link
                            key={index}
                            to={task.path}
                            className="flex flex-col items-center justify-center p-6 text-center border-2 border-gov-neutral-200 rounded-lg hover:border-gov-blue-600 hover:shadow-md transition-all focus-ring group"
                        >
                            <div className="text-gov-blue-700 mb-4 group-hover:scale-110 transition-transform duration-300">
                                {task.icon}
                            </div>
                            <span className="text-sm font-semibold text-gov-neutral-900">{task.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
