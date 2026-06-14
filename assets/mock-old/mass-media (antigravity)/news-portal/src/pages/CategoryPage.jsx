export default function CategoryPage({ title }) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-6 font-serif">{title} News</h2>
            <p className="text-gray-600">Latest updates from the {title} section.</p>
        </div>
    );
}
