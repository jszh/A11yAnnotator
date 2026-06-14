const SponsoredCard = ({ brandTitle, brandImage, products, link }) => {
    return (
        <div className="bg-white p-6 rounded-system-lg shadow-md hover:shadow-xl transition-shadow flex flex-col h-full ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-navy relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 leading-tight">{brandTitle}</h3>
                <span className="text-xs text-gray-500 tracking-wider uppercase font-semibold">Sponsored</span>
            </div>

            {/* Main Brand Image */}
            <div className="bg-gray-100 rounded-system-md mb-4 flex items-center justify-center overflow-hidden aspect-video p-2">
                <img src={brandImage} alt={`${brandTitle} Brand Header`} className="object-cover w-full h-full mix-blend-multiply" loading="lazy" />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4 mt-auto">
                {products.map((prod, idx) => (
                    <div key={idx} className="bg-gray-50 aspect-square rounded flex items-center justify-center overflow-hidden border border-gray-100 p-1">
                        <img src={prod} alt={`Sponsored product ${idx + 1}`} className="object-contain w-full h-full mix-blend-multiply" loading="lazy" />
                    </div>
                ))}
            </div>

            <a href={link} className="text-blue-600 hover:text-blue-800 hover:underline mt-auto text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1 w-fit block" aria-label={`Shop more from ${brandTitle}`}>
                Explore more from this brand
            </a>
        </div>
    );
};

window.SponsoredCard = SponsoredCard;
