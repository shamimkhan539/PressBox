import React from "react";

const Sidebar = ({ selectedSite, setSelectedSite }) => {
    const sites = [
        { name: "dev", icon: "folder", active: true },
        { name: "Hardloop Helden", icon: "cloud", active: false },
        { name: "tabnine", icon: "wifi", active: false },
        { name: "tabnine", icon: "phone", active: false },
        { name: "wp test", icon: "folder", active: false },
    ];

    const getIcon = (icon) => {
        switch (icon) {
            case "folder":
                return "📁";
            case "cloud":
                return "☁️";
            case "wifi":
                return "📶";
            case "phone":
                return "📱";
            default:
                return "📁";
        }
    };

    return (
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
            <div className="flex items-center mb-6">
                <img
                    src="https://via.placeholder.com/40"
                    alt="Avatar"
                    className="w-10 h-10 rounded-full mr-3"
                />
                <h2 className="text-white text-xl font-bold">Local</h2>
                <span className="ml-auto text-gray-400">🕒</span>
            </div>
            <nav>
                <ul>
                    {sites.map((site) => (
                        <li
                            key={site.name}
                            className={`flex items-center p-2 mb-1 rounded cursor-pointer ${
                                selectedSite === site.name
                                    ? "bg-gray-700"
                                    : "hover:bg-gray-700"
                            }`}
                            onClick={() => setSelectedSite(site.name)}
                        >
                            <span className="mr-3">{getIcon(site.icon)}</span>
                            <span className="text-gray-300">{site.name}</span>
                            {site.active && (
                                <span className="ml-auto w-2 h-2 bg-green-500 rounded-full"></span>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
