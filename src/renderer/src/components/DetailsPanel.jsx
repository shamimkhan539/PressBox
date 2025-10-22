import React from "react";

const DetailsPanel = ({ selectedSite }) => {
    return (
        <div className="flex-1 bg-gray-900 p-6">
            {/* Tabs */}
            <div className="flex space-x-4 mb-6">
                <span className="text-green-500 border-b-2 border-green-500 pb-1">
                    Overview
                </span>
                <span className="text-gray-400 cursor-pointer hover:text-gray-300">
                    Database
                </span>
                <span className="text-gray-400 cursor-pointer hover:text-gray-300">
                    Tools
                </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center">
                    <label className="text-gray-300 mr-2">Site domain</label>
                    <input
                        value="dev.local"
                        className="bg-gray-700 text-white px-2 py-1 rounded"
                        readOnly
                    />
                    <a
                        href="#"
                        className="text-green-500 ml-2 hover:text-green-400"
                    >
                        Change
                    </a>
                </div>
                <div className="flex items-center">
                    <label className="text-gray-300 mr-2">SSL</label>
                    <span className="text-gray-400">dev.local.crt</span>
                    <button className="border border-green-500 text-green-500 px-2 py-1 rounded ml-2 hover:bg-green-500 hover:text-white">
                        Trust
                    </button>
                </div>
                <div className="flex items-center">
                    <label className="text-gray-300 mr-2">Web server</label>
                    <select className="bg-green-500 text-white px-2 py-1 rounded">
                        <option>nginx</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <label className="text-gray-300 mr-2">PHP version</label>
                    <span className="text-gray-400">8.1.23</span>
                    <a
                        href="#"
                        className="text-green-500 ml-2 hover:text-green-400"
                    >
                        Update
                    </a>
                </div>
                <div className="flex items-center">
                    <label className="text-gray-300 mr-2">Database</label>
                    <span className="text-gray-400">MySQL 8.0.16</span>
                </div>
                <div className="flex items-center">
                    <label className="text-gray-300 mr-2">
                        One-click admin
                    </label>
                    <input type="radio" className="mr-2" />
                    <select className="bg-gray-700 text-white px-2 py-1 rounded">
                        <option>Select admin</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <label className="text-gray-300 mr-2">
                        WordPress version
                    </label>
                    <span className="text-gray-400">6.8</span>
                </div>
                <div className="flex items-center">
                    <label className="text-gray-300 mr-2">Multisite</label>
                    <span className="text-gray-400">No</span>
                </div>
                <div className="flex items-center">
                    <label className="text-gray-300 mr-2">Xdebug</label>
                    <input type="radio" />
                </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-6 flex items-center space-x-4">
                <label className="text-gray-300">Live Link</label>
                <input type="checkbox" className="mr-2" />
                <a href="#" className="text-green-500 hover:text-green-400">
                    Enable
                </a>
                <button className="border border-gray-500 text-gray-400 px-4 py-2 rounded hover:bg-gray-500 hover:text-white">
                    ⬇️ Pull
                </button>
                <button className="border border-gray-500 text-gray-400 px-4 py-2 rounded hover:bg-gray-500 hover:text-white">
                    ⬆️ Push
                </button>
            </div>
        </div>
    );
};

export default DetailsPanel;
