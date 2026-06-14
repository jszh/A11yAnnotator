const ProductCard = ({ title, imagePlaceholder, link, linkText = "Shop now" }) => {
    return (
        <div className="bg-white p-6 rounded-system-lg shadow-md hover:shadow-xl transition-shadow flex flex-col h-full ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-navy">
            <h3 className="text-xl font-bold mb-4 text-gray-800 leading-tight">{title}</h3>
            <div className="bg-gray-100 aspect-square rounded-system-md mb-4 flex items-center justify-center overflow-hidden p-4">
                <img src={imagePlaceholder} alt={title} className="object-contain w-full h-full mix-blend-multiply" loading="lazy" />
            </div>
            <a href={link} className="text-blue-600 hover:text-blue-800 hover:underline mt-auto text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1 w-fit" aria-label={`Shop ${title}`}>
                {linkText}
            </a>
        </div>
    );
};

window.ProductCard = ProductCard;
