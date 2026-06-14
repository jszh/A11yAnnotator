function LogoTrustStrip() {
    const partners = ['Google', 'IBM', 'Stanford', 'Duke', 'Meta', 'Imperial College'];

    return (
        <div className="bg-slate-50 py-10 border-b border-slate-200">
            <div className="container mx-auto px-4">
                <p className="text-center text-slate-500 font-semibold mb-6 uppercase tracking-wider text-sm">We collaborate with {partners.length}+ leading universities and companies</p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
                    {partners.map((partner, index) => (
                        <div key={index} className="text-xl font-black text-slate-400">
                            {partner}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default LogoTrustStrip;
