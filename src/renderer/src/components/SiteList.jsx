import React from "react";

const SiteList = ({ selectedSite }) => {
    const sites = [
        { name: "dev", active: true },
        { name: "Hardloop Helden", active: false },
        { name: "tabnine", active: false },
        { name: "wp test", active: false },
    ];

    return (
        <div className="w-80 bg-gray-900 p-4 border-r border-gray-700">
            {sites.map((site) => (
                <div
                    key={site.name}
                    className={`mb-4 p-3 rounded ${site.name === selectedSite ? "border border-green-500" : "border border-gray-700"}`}
                >
                    <div className="flex items-center mb-2">
                        <span className="text-gray-300">{site.name}</span>
                        {site.active && (
                            <span className="ml-auto w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                    </div>
                    {site.name === selectedSite && (
                        <div className="space-y-1">
                            <a
                                href="#"
                                className="flex items-center text-green-500 hover:text-green-400"
                            >
                                <span className="mr-2">📁</span> Site folder
                            </a>
                            <a
                                href="#"
                                className="flex items-center text-gray-400 hover:text-gray-300"
                            >
                                <span className="mr-2">💻</span> Site shell
                            </a>
                            <a
                                href="#"
                                className="flex items-center text-green-500 hover:text-green-400"
                            >
                                <span className="mr-2">💻</span> VS Code
                            </a>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SiteList;
