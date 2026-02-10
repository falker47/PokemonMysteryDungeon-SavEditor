import React, { useMemo } from 'react';
import { DataManager } from '../utils/DataManager';
import { SearchableSelect } from './SearchableSelect';

interface PokemonSelectProps {
    value: number;
    onChange: (value: number) => void;
}

export const PokemonSelect: React.FC<PokemonSelectProps> = ({ value, onChange }) => {
    const dataManager = DataManager.getInstance();

    const pokemonList = useMemo(() => {
        return Object.entries(dataManager.pokemon).map(([id, name]) => ({
            id: parseInt(id),
            name
        }));
    }, [dataManager.pokemon]);

    return (
        <SearchableSelect
            options={pokemonList}
            value={value}
            onChange={onChange}
            style={{ width: '100%' }}
        />
    );
};
