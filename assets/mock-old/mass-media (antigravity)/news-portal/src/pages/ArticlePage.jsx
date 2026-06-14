import { useParams } from 'react-router-dom';

export default function ArticlePage() {
    const { id } = useParams();

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <article>
                <header className="mb-8">
                    <span className="text-brand-red font-bold text-sm tracking-widest uppercase mb-2 block">World News</span>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-4">
                        Sample Article Headline for Story {id}
                    </h1>
                    <p className="text-xl text-gray-600 mb-6">
                        A comprehensive subheading that provides more context about the article's main topic and draws the reader in.
                    </p>
                    <div className="flex items-center text-sm text-gray-500 border-t border-b border-gray-200 py-3">
                        <span className="font-bold text-gray-900 mr-2">By John Doe</span>
                        <span>| Updated 2 hours ago</span>
                    </div>
                </header>

                <div className="prose prose-lg max-w-none font-serif text-gray-800 leading-relaxed">
                    <p className="mb-6">
                        Article content goes here. This is a placeholder for the actual text of the story.
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
                        ut labore et dolore magna aliqua.
                    </p>
                    <p className="mb-6">
                        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                        dolore eu fugiat nulla pariatur.
                    </p>
                </div>
            </article>
        </div>
    );
}
