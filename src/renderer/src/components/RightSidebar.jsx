import React from "react";

const RightSidebar = () => {
    return (
        <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
            <div className="space-y-4">
                <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
                    📰 WP Admin
                </button>
                <button className="w-full border border-green-500 text-green-500 py-2 rounded hover:bg-green-500 hover:text-white">
                    🌐 Open site
                </button>
            </div>
            <div className="mt-6 text-center">
                <span className="text-gray-400 text-sm">
                    Last started: Oct 16
                </span>
            </div>
        </div>
    );
};

export default RightSidebar;
