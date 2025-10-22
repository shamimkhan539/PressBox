import React from "react";
import SiteList from "./SiteList";
import DetailsPanel from "./DetailsPanel";

const MainContent = ({ selectedSite }) => {
    return (
        <div className="flex-1 flex flex-col">
            {/* Top Bar */}
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                <h1 className="text-white text-2xl font-bold">Local sites</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-gray-400">🔍</span>
                    <span className="text-gray-400">⚙️</span>
                    <button className="border border-green-500 text-green-500 px-4 py-2 rounded hover:bg-green-500 hover:text-white">
                        Instant Reload
                    </button>
                    <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        ▶️ Start site
                    </button>
                </div>
            </div>

            {/* Sites List and Details */}
            <div className="flex flex-1">
                <SiteList selectedSite={selectedSite} />
                <DetailsPanel selectedSite={selectedSite} />
            </div>

            {/* Status Footer */}
            <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-center justify-between">
                <button className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600">
                    +
                </button>
                <span className="text-gray-400">0 sites running</span>
            </div>
        </div>
    );
};

export default MainContent;
