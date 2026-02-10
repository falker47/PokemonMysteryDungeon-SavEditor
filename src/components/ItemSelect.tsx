import React, { useMemo } from 'react';
import { DataManager } from '../utils/DataManager';
import { SearchableSelect } from './SearchableSelect';

interface ItemSelectProps {
    value: number;
    onChange: (value: number) => void;
}

export const ItemSelect: React.FC<ItemSelectProps> = ({ value, onChange }) => {
    const dataManager = DataManager.getInstance();

    // Simple optimization: only compute list once or when data changes
    const items = useMemo(() => {
        return Object.entries(dataManager.items).map(([id, name]) => ({
            id: parseInt(id),
            name
        }));
    }, [dataManager.items]);

    return (
        <SearchableSelect
            options={items}
            value={value}
            onChange={onChange}
            style={{ width: '100%' }}
        />
    );
};
