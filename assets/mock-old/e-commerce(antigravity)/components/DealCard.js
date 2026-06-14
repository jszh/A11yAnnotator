const DealCard = ({ title, imagePlaceholder, discount, dealDesc, link }) => {
    return (
        <div className="bg-white p-6 rounded-system-lg shadow-md hover:shadow-xl transition-shadow flex flex-col h-full ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-navy">
            <h3 className="text-xl font-bold mb-4 text-gray-800 leading-tight">{title}</h3>
            <div className="bg-gray-100 aspect-square rounded-system-md mb-4 flex items-center justify-center overflow-hidden p-4 relative">
                {/* Discount Badge */}
                <div className="absolute top-2 left-2 bg-[#cc0c39] text-white text-xs font-bold px-2 py-1 rounded">
                    Up to {discount}% off
                </div>
                <img src={imagePlaceholder} alt={title} className="object-contain w-full h-full mix-blend-multiply" loading="lazy" />
            </div>

            <div className="mt-auto">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#cc0c39] text-white text-xs font-bold px-2 py-1 rounded">Deal of the Day</span>
                    <span className="text-sm font-semibold text-[#cc0c39]">{dealDesc}</span>
                </div>
                <a href={link} className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1 w-fit block" aria-label={`Shop deals on ${title}`}>
                    See all deals
                </a>
            </div>
        </div>
    );
};

window.DealCard = DealCard;
