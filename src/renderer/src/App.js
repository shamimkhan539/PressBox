import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import RightSidebar from "./components/RightSidebar";

function App() {
    const [selectedSite, setSelectedSite] = useState("dev");

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            <Sidebar
                selectedSite={selectedSite}
                setSelectedSite={setSelectedSite}
            />
            <MainContent selectedSite={selectedSite} />
            <RightSidebar />
        </div>
    );
}

export default App;
