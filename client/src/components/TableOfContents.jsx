import React from 'react';
import { Link } from 'react-scroll';

const scrollWithinContainer = (
    containerId,
    headingId,
    { revealContainerOnNavigate = false } = {},
) => {
    if (typeof document === 'undefined') {
        return;
    }

    const container = document.getElementById(containerId);
    const target = document.getElementById(headingId);

    if (!container || !target) {
        return;
    }

    if (revealContainerOnNavigate) {
        container.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = targetRect.top - containerRect.top + container.scrollTop - 24;

    container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
    });
};

const TableOfContents = ({
    headings,
    activeId,
    onNavigate,
    scrollContainerId,
    revealContainerOnNavigate = false,
}) => {
    return (
        <nav className="toc-container">
            <h3 className="text-lg font-semibold mb-4">Table of Contents</h3>
            <ul className="space-y-2">
                {headings.map((heading) => (
                    <li
                        key={heading.id}
                        className={heading.level === 'h3' ? 'ml-6' : 'ml-4'}
                    >
                        {scrollContainerId ? (
                            <button
                                type='button'
                                onClick={() => {
                                    scrollWithinContainer(scrollContainerId, heading.id, {
                                        revealContainerOnNavigate,
                                    });
                                    if (typeof onNavigate === 'function') onNavigate(heading.id);
                                }}
                                className={`block w-full cursor-pointer text-left transition-colors duration-300 ${
                                    activeId === heading.id ? 'active-toc-item' : 'toc-link hover:text-blue-500'
                                }`}
                            >
                                {heading.text}
                            </button>
                        ) : (
                            <Link
                                to={heading.id}
                                smooth={true}
                                duration={500}
                                offset={-70} // Adjust offset to account for a fixed header if you have one
                                onClick={() => { if (typeof onNavigate === 'function') onNavigate(heading.id); }}
                                className={`block transition-colors duration-300 cursor-pointer ${
                                    activeId === heading.id ? 'active-toc-item' : 'toc-link hover:text-blue-500'
                                }`}
                            >
                                {heading.text}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default TableOfContents;
