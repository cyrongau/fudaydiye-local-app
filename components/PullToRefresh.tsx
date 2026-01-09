
import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface PullToRefreshProps {
    children: ReactNode;
    onRefresh?: () => Promise<void> | void; // Allow custom refresh or default reload
    threshold?: number;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
    children,
    onRefresh,
    threshold = 120
}) => {
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Logic to only allow pull if we are at the top
    const isAtTop = () => {
        if (!contentRef.current) return false;
        // Check both window scroll and element scroll just in case
        return window.scrollY === 0 && contentRef.current.scrollTop === 0;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isAtTop()) return;
        setStartY(e.touches[0].clientY);
        setIsPulling(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isPulling) return;

        // If we scrolled down then back up, don't trigger abruptly
        const y = e.touches[0].clientY;
        const diff = y - startY;

        if (diff > 0 && isAtTop()) {
            // Add resistance (logarithmic or simple division)
            setCurrentY(diff * 0.4);
            // Prevent default only if we are creating a pull effect to avoid native scroll conflict? 
            // Careful, preventing default might block scrolling. 
            // Usually better to let it happen if it's strictly at top.
        } else {
            // If pushing up, reset
            setCurrentY(0);
        }
    };

    const handleTouchEnd = async () => {
        if (!isPulling) return;
        setIsPulling(false);

        if (currentY > threshold) {
            setIsLoading(true);
            setCurrentY(60); // Stay open a bit

            if (onRefresh) {
                await onRefresh();
            } else {
                // Default: Reload Page
                window.location.reload();
            }

            // Reset after action
            setTimeout(() => {
                setIsLoading(false);
                setCurrentY(0);
            }, 500);
        } else {
            setCurrentY(0); // Snap back
        }
    };

    return (
        <div
            ref={contentRef}
            className="min-h-screen relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Refresh Indicator */}
            <div
                className="fixed top-0 left-0 right-0 flex justify-center pointer-events-none z-50 transition-transform duration-200 ease-out"
                style={{
                    transform: `translateY(${Math.max(currentY - 40, -50)}px)`,
                    opacity: currentY > 10 ? 1 : 0
                }}
            >
                <div className={`size-10 rounded-full bg-white dark:bg-surface-dark shadow-xl flex items-center justify-center text-primary ${isLoading ? 'animate-spin' : ''}`}>
                    <span className="material-symbols-outlined" style={{ transform: `rotate(${currentY * 2}deg)` }}>
                        {isLoading ? 'progress_activity' : 'refresh'}
                    </span>
                </div>
            </div>

            {/* Content with transform */}
            <div
                className="transition-transform duration-200 ease-out"
                style={{ transform: `translateY(${currentY}px)` }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
