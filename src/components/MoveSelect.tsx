import React, { useState, useEffect } from 'react';
import { DataManager } from '../utils/DataManager';
import { SearchableSelect } from './SearchableSelect';

interface MoveSelectProps {
    value: number;
    onChange: (value: number) => void;
}

export const MoveSelect: React.FC<MoveSelectProps> = ({ value, onChange }) => {
    const dataManager = DataManager.getInstance();
    const [moves, setMoves] = useState<Record<number, string>>({});

    useEffect(() => {
        setMoves(dataManager.moves);
    }, []);

    // Convert object to sorted array for display
    const sortedMoves = Object.entries(moves)
        .map(([id, name]) => ({ id: parseInt(id), name }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <SearchableSelect
            options={sortedMoves}
            value={value}
            onChange={onChange}
            style={{ width: '100%' }}
        />
    );
};
