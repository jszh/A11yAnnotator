import { AlertCircle, Calendar, Info } from 'lucide-react';

export default function AnnouncementModule() {
    const announcements = [
        {
            id: 1,
            type: 'urgent',
            title: 'Disaster Relief Information',
            date: 'Updated Today',
            content: 'Resources and application forms for recent severe weather impacts are now available.',
            link: '#'
        },
        {
            id: 2,
            type: 'info',
            title: 'New Tax Filing Portal Launching',
            date: 'October 15, 2026',
            content: 'A new, modernized portal for business tax filings will launch next month. Learn about the changes.',
            link: '#'
        }
    ];

    return (
        <section className="py-12 bg-gov-neutral-50 border-t border-gov-neutral-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-gov-neutral-900 mb-6 flex items-center">
                    <Info className="w-6 h-6 mr-2 text-gov-blue-700" />
                    News & Announcements
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    {announcements.map((item) => (
                        <div
                            key={item.id}
                            className={`p-6 rounded-lg border-l-4 ${item.type === 'urgent' ? 'border-red-600 bg-red-50' : 'border-gov-blue-600 bg-white shadow-sm'}`}
                        >
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    {item.type === 'urgent' ? (
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    ) : (
                                        <Calendar className="w-6 h-6 text-gov-blue-600" />
                                    )}
                                </div>
                                <div className="ml-4">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gov-neutral-500 block mb-1">
                                        {item.date}
                                    </span>
                                    <h3 className={`text-xl font-bold mb-2 ${item.type === 'urgent' ? 'text-red-900' : 'text-gov-neutral-900'}`}>
                                        {item.title}
                                    </h3>
                                    <p className="text-gov-neutral-700 mb-4">{item.content}</p>
                                    <a href={item.link} className={`font-semibold text-sm hover:underline focus-ring inline-block py-1 ${item.type === 'urgent' ? 'text-red-700' : 'text-gov-blue-700'}`}>
                                        Read full announcement →
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
