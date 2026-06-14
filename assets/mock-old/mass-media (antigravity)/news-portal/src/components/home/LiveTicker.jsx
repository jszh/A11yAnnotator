export default function LiveTicker() {
    return (
        <div className="bg-brand-red text-white py-2 px-4 flex items-center overflow-hidden whitespace-nowrap">
            <div className="font-bold tracking-widest text-xs mr-4 uppercase flex-shrink-0 animate-pulse">
                Breaking News
            </div>
            <div className="w-px h-4 bg-white opacity-50 mr-4"></div>
            <div className="text-sm overflow-hidden text-ellipsis flex items-center space-x-8 animate-[ticker_30s_linear_infinite]">
                <span>Global markets rally on unexpected economic data</span>
                <span className="opacity-50">•</span>
                <span>Senate passes landmark infrastructure bill after marathon session</span>
                <span className="opacity-50">•</span>
                <span>Tech giant unveils revolutionary AI assistant</span>
                <span className="opacity-50">•</span>
                <span>Major breakthrough in clean energy research announced</span>
            </div>
        </div>
    );
}
