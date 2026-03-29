// src/components/ReadingProgressBar.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const ReadingProgressBar = ({ progressOverride = null }) => {
    const [scrollProgress, setScrollProgress] = useState(0);

    /**
     * Handles the scroll event to calculate the reading progress.
     * The progress is the percentage of the page that has been scrolled.
     */
    const handleScroll = () => {
        const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = window.scrollY;

        if (totalHeight > 0) {
            const progress = (scrolled / totalHeight) * 100;
            setScrollProgress(progress);
        } else {
            setScrollProgress(0);
        }
    };

    // Set up and clean up the scroll event listener
    useEffect(() => {
        if (progressOverride !== null) {
            return undefined;
        }

        window.addEventListener('scroll', handleScroll);
        handleScroll();
        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [progressOverride]);

    const progressValue = progressOverride === null ? scrollProgress : clampProgress(progressOverride);

    const shellStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        zIndex: 50,
        pointerEvents: 'none',
        background: 'rgba(148, 163, 184, 0.12)',
        backdropFilter: 'blur(6px)',
    };

    const progressBarStyle = {
        width: `${progressValue}%`,
        height: '100%',
        borderRadius: '0 999px 999px 0',
        background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 48%, #14b8a6 100%)',
        boxShadow: '0 0 18px rgba(14, 165, 233, 0.35)',
        transition: 'width 0.15s ease-out',
    };

    return (
        <div style={shellStyle} aria-hidden='true'>
            <div style={progressBarStyle} />
        </div>
    );
};

ReadingProgressBar.propTypes = {
    progressOverride: PropTypes.number,
};

export default ReadingProgressBar;
