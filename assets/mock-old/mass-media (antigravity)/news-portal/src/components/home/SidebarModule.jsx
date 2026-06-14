import { Link } from 'react-router-dom';

const OPINIONS = [
    { id: 101, author: 'David Brooks', title: 'The Shift in Modern Demographics', role: 'Columnist' },
    { id: 102, author: 'Paul Krugman', title: 'Economic Realities of the New Deal', role: 'Columnist' },
    { id: 103, author: 'Fareed Zakaria', title: 'Global Power Dynamics in 2026', role: 'Global Analyst' },
    { id: 104, author: 'Guest Essay', title: 'Why We Need to Rethink Urban Planning', role: 'Contributor' },
];

export default function SidebarModule() {
    return (
        <aside className="border-l-0 lg:border-l-2 border-gray-200 lg:pl-8 h-full">
            <div className="mb-10">
                <h3 className="text-xl font-serif font-black uppercase tracking-tight mb-4 border-b-2 border-black pb-2 text-brand-red">
                    Opinion & Analysis
                </h3>
                <ul className="divide-y divide-gray-200">
                    {OPINIONS.map((opinion) => (
                        <li key={opinion.id} className="py-4 first:pt-0">
                            <Link to={`/opinion/${opinion.id}`} className="block group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red rounded">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                                    {opinion.author} <span className="font-normal text-gray-400 capitalize">| {opinion.role}</span>
                                </span>
                                <h4 className="text-lg font-serif font-bold leading-tight group-hover:text-brand-red transition-colors">
                                    {opinion.title}
                                </h4>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-gray-100 p-6 border-t-4 border-black">
                <h3 className="text-xl font-serif font-bold mb-2">The Daily Briefing</h3>
                <p className="text-sm text-gray-700 mb-4 font-sans">
                    Start your day with the stories you need to know. Delivered to your inbox every morning.
                </p>
                <form className="flex flex-col space-y-3" onSubmit={(e) => e.preventDefault()}>
                    <label htmlFor="email-signup" className="sr-only">Email address</label>
                    <input
                        type="email"
                        id="email-signup"
                        placeholder="Your email address"
                        className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-sans text-sm rounded-none"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-black text-white font-bold py-2 uppercase tracking-wide text-sm hover:bg-brand-red transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red"
                    >
                        Sign Up
                    </button>
                </form>
            </div>
        </aside>
    );
}
