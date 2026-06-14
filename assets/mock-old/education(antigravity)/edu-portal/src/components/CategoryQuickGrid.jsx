import { ArrowRight } from 'lucide-react';

function CategoryQuickGrid() {
    const categories = [
        { title: 'Data Science', count: 420, icon: '📊' },
        { title: 'Business', count: 850, icon: '💼' },
        { title: 'Computer Science', count: 640, icon: '💻' },
        { title: 'Information Technology', count: 320, icon: '🌐' },
        { title: 'Language Learning', count: 180, icon: '🗣️' },
        { title: 'Health', count: 210, icon: '🏥' },
        { title: 'Personal Development', count: 530, icon: '🌟' },
        { title: 'Arts and Humanities', count: 290, icon: '🎨' },
    ];

    return (
        <div className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Explore top categories</h2>
                        <p className="text-slate-600">Find the right path for your next career move</p>
                    </div>
                    <button className="hidden sm:flex text-brand-600 font-medium hover:text-brand-700 items-center gap-1">
                        See all <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categories.map((cat, i) => (
                        <div key={i} className="group p-6 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100 transition-all cursor-pointer bg-slate-50 hover:bg-white flex flex-col h-full">
                            <div className="text-3xl mb-4 bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm text-center">
                                {cat.icon}
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">{cat.title}</h3>
                            <p className="text-sm text-slate-500 mt-auto">{cat.count} courses</p>
                        </div>
                    ))}
                </div>

                <button className="w-full mt-6 sm:hidden text-brand-600 font-medium hover:text-brand-700 flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-lg">
                    See all categories <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default CategoryQuickGrid;
