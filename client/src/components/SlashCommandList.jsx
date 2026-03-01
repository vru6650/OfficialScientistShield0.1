import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const SlashCommandList = forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const items = Array.isArray(props.items) ? props.items : [];

    const selectItem = (index) => {
        const item = items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => setSelectedIndex(0), [items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (!items.length) {
                return false;
            }

            if (event.key === 'ArrowUp') {
                setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((prev) => (prev + 1) % items.length);
                return true;
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2">
            {items.length ? (
                items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => selectItem(index)}
                        className={`w-full text-left flex items-center gap-2 p-2 rounded-md ${index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.title}</span>
                    </button>
                ))
            ) : (
                <div className="p-2">No results</div>
            )}
        </div>
    );
});

export default SlashCommandList;
