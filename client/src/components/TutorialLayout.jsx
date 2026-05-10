import React from 'react';

/**
 * A reusable layout component for tutorial pages.
 * It provides a two-column structure with a sticky sidebar for navigation.
 *
 * @param {object} props The component props.
 * @param {React.ReactNode} props.sidebarContent The content to be displayed in the sidebar.
 * @param {React.ReactNode} props.mainContent The main content of the tutorial.
 */
export default function TutorialLayout({ sidebarContent, mainContent }) {
    return (
        <div className="flex min-h-screen min-w-0 flex-col md:flex-row">
            {/* Sidebar section */}
            <aside className="z-10 max-h-[45svh] w-full overflow-y-auto border-b border-gray-200 bg-gray-100 p-4 shadow-lg transition-all duration-300 ease-in-out scrollbar-custom dark:border-gray-700 dark:bg-gray-800 md:sticky md:top-0 md:max-h-screen md:w-72 md:shrink-0 md:border-b-0 md:border-r">
                {sidebarContent}
            </aside>

            {/* Main content section */}
            <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 md:p-10">
                {mainContent}
            </main>
        </div>
    );
}    
