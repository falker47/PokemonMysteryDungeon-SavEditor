import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface SearchableSelectOption {
    id: number;
    name: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    style?: React.CSSProperties;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = "Select...", style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Filter options
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const lowerTerm = searchTerm.toLowerCase();
        return options.filter(opt =>
            opt.name.toLowerCase().includes(lowerTerm) ||
            opt.id.toString().includes(lowerTerm)
        );
    }, [options, searchTerm]);

    const selectedOption = options.find(o => o.id === value);

    return (
        <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block', width: '100%', ...style }}>
            <div
                onClick={() => {
                    setIsOpen(!isOpen);
                    setSearchTerm(""); // Reset search on open
                }}
                className="searchable-select-trigger"
                style={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
            >
                {selectedOption ? `${selectedOption.name} (${selectedOption.id})` : (value === 0 ? "None" : `Unknown (${value})`)}
            </div>

            {
                isOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        backgroundColor: '#333',
                        border: '1px solid #555',
                        maxHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={placeholder}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '5px',
                                border: 'none',
                                borderBottom: '1px solid #555',
                                backgroundColor: '#222',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(opt => (
                                    <div
                                        key={opt.id}
                                        onClick={() => {
                                            onChange(opt.id);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            padding: '5px',
                                            cursor: 'pointer',
                                            backgroundColor: value === opt.id ? '#444' : 'transparent',
                                            borderBottom: '1px solid #444'
                                        }}
                                        className="searchable-option"
                                    >
                                        {opt.name} ({opt.id})
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '5px', color: '#999' }}>No results</div>
                            )}
                        </div>
                    </div>
                )
            }
            <style>
                {`
                .searchable-option:hover {
                    background-color: #555 !important;
                }
                `}
            </style>
        </div >
    );
};
