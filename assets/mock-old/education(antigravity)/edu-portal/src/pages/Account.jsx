import { User, Mail, Lock, CreditCard, Bell } from 'lucide-react';

function Account() {
    return (
        <div className="bg-slate-50 min-h-[calc(100vh-4rem)] p-4 md:p-8">
            <div className="container mx-auto max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
                    <p className="text-slate-600">Manage your profile, preferences, and billing.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-64 flex-shrink-0">
                        <nav className="space-y-1 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-brand-50 text-brand-700 rounded-lg font-medium">
                                <User className="w-5 h-5" /> Profile
                            </a>
                            <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                                <Mail className="w-5 h-5" /> Email Preferences
                            </a>
                            <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                                <Lock className="w-5 h-5" /> Security
                            </a>
                            <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                                <CreditCard className="w-5 h-5" /> Billing & Plans
                            </a>
                            <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                                <Bell className="w-5 h-5" /> Notifications
                            </a>
                        </nav>
                    </div>

                    <div className="flex-grow space-y-6">
                        <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Information</h2>

                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center text-slate-400 text-3xl font-black">
                                    S
                                </div>
                                <div>
                                    <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md font-medium text-sm hover:bg-slate-50 transition-colors">
                                        Change Avatar
                                    </button>
                                </div>
                            </div>

                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                                        <input type="text" defaultValue="Student" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                                        <input type="text" defaultValue="User" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                    <input type="email" defaultValue="student@example.com" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                                    <textarea rows="4" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" placeholder="Tell us about yourself..."></textarea>
                                </div>
                                <div className="pt-4 border-t border-slate-200 flex justify-end gap-4">
                                    <button type="button" className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                                    <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Account;
