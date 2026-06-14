import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import LessonListItem from './LessonListItem';

function CurriculumSidebar() {
    const [sections, setSections] = useState([
        {
            title: 'Module 1: Getting Started',
            duration: '45 min',
            isExpanded: true,
            lessons: [
                { title: 'Welcome to the Course', duration: '5 min', type: 'video', isCompleted: true, active: false },
                { title: 'Setting Up Your Environment', duration: '15 min', type: 'video', isCompleted: true, active: false },
                { title: 'Course Resources', duration: '5 min', type: 'reading', isCompleted: true, active: false },
                { title: 'First Quiz', duration: '20 min', type: 'quiz', isCompleted: false, active: true },
            ]
        },
        {
            title: 'Module 2: Core Concepts',
            duration: '2h 15m',
            isExpanded: false,
            lessons: [
                { title: 'Understanding the Basics', duration: '30 min', type: 'video', isLocked: true },
                { title: 'Advanced Theory', duration: '45 min', type: 'video', isLocked: true },
                { title: 'Practical Application', duration: '60 min', type: 'reading', isLocked: true },
            ]
        },
        {
            title: 'Module 3: Final Project',
            duration: '4h',
            isExpanded: false,
            lessons: [
                { title: 'Project Overview', duration: '15 min', type: 'video', isLocked: true },
                { title: 'Submission Guidelines', duration: '10 min', type: 'reading', isLocked: true },
                { title: 'Final Assessment', duration: '3h 35min', type: 'quiz', isLocked: true },
            ]
        }
    ]);

    const toggleSection = (index) => {
        const newSections = [...sections];
        newSections[index].isExpanded = !newSections[index].isExpanded;
        setSections(newSections);
    };

    return (
        <div className="bg-white border-r border-slate-200 h-full overflow-y-auto w-80 flex-shrink-0 flex flex-col">
            <div className="p-6 border-b border-slate-200 flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Course Content</h2>
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>3 Modules</span>
                    <span>7h Total</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <p className="text-xs text-slate-500 text-right">25% completed</p>
            </div>

            <div className="flex-grow">
                {sections.map((section, idx) => (
                    <div key={idx} className="border-b border-slate-200 last:border-none">
                        <button
                            onClick={() => toggleSection(idx)}
                            className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between"
                        >
                            <div>
                                <h3 className="font-semibold text-slate-900">{section.title}</h3>
                                <p className="text-xs text-slate-500 mt-1">{section.lessons.length} lessons • {section.duration}</p>
                            </div>
                            {section.isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>

                        {section.isExpanded && (
                            <div className="bg-slate-50 border-t border-slate-100">
                                {section.lessons.map((lesson, lIdx) => (
                                    <LessonListItem key={lIdx} {...lesson} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CurriculumSidebar;
