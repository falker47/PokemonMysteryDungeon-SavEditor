import React, { useState, useEffect } from 'react';
import { SkySave } from '../save/SkySave';
import { TDSave } from '../save/TDSave';
import { RBSave } from '../save/RBSave';
import { SaveFile } from '../save/SaveFile';
import { FileUpload } from './FileUpload';
import { GeneralTab } from './GeneralTab';
import { ItemsTab } from './ItemsTab';
import { PokemonTab } from './PokemonTab';
import { DataManager } from '../utils/DataManager';
import { useTranslation } from '../hooks/useTranslation';

export const SaveEditor: React.FC = () => {
    const [saveFile, setSaveFile] = useState<SaveFile | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>('general');
    const [updateKey, setUpdateKey] = useState<number>(0);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [language, setLanguage] = useState('en');
    const { t } = useTranslation(language);

    useEffect(() => {
        DataManager.getInstance().loadData().then(() => setDataLoaded(true));
    }, []);

    const handleFileLoaded = (data: Uint8Array, name: string) => {
        try {
            // Checksum validation as heuristic

            try {
                const sky = new SkySave(data);
                if (sky.isPrimaryChecksumValid() || sky.isSecondaryChecksumValid()) {
                    console.log("Detected Explorers of Sky save");
                    DataManager.getInstance().loadData('Sky').then(() => setUpdateKey(k => k + 1));
                    setSaveFile(sky);
                    setFileName(name);
                    return;
                }
            } catch (e) { console.log("Not Sky", e); }

            try {
                const td = new TDSave(data);
                if (td.isPrimaryChecksumValid() || td.isSecondaryChecksumValid()) {
                    console.log("Detected Explorers of Time/Darkness save");
                    DataManager.getInstance().loadData('TimeDarkness').then(() => setUpdateKey(k => k + 1));
                    setSaveFile(td);
                    setFileName(name);
                    return;
                }
            } catch (e) { console.log("Not Time/Darkness", e); }

            try {
                const rb = new RBSave(data);
                if (rb.isPrimaryChecksumValid() || rb.isSecondaryChecksumValid()) {
                    console.log("Detected Rescue Team save");
                    DataManager.getInstance().loadData('RescueTeam').then(() => setUpdateKey(k => k + 1));
                    setSaveFile(rb);
                    setFileName(name);
                    return;
                }
            } catch (e) { console.log("Not Rescue Team", e); }

            // Fallback
            console.warn("Could not validate checksums. Defaulting to Sky.");
            const defaultSave = new SkySave(data);
            setSaveFile(defaultSave);
            setFileName(name);

        } catch (e) {
            console.error(e);
            alert("Failed to load save file. Check console for details.");
        }
    };

    const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lang = e.target.value;
        setLanguage(lang);
        setDataLoaded(false);
        await DataManager.getInstance().setLanguage(lang);
        setDataLoaded(true);
        forceUpdate();
    };

    const handleDownload = () => {
        if (!saveFile) return;

        try {
            const data = saveFile.toByteArray();
            const blob = new Blob([data as unknown as BlobPart], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert("Failed to save. Check console.");
        }
    };

    const forceUpdate = () => setUpdateKey(prev => prev + 1);

    const handleUnload = () => {
        setSaveFile(null);
        setFileName("");
        setActiveTab('general');
        setUpdateKey(0);
        // We don't necessarily need to reset dataLoaded or empty DataManager, 
        // as the language/resources might still be valid. 
        // But let's keep it simple.
    };

    if (!saveFile) {
        return <FileUpload onFileLoaded={handleFileLoaded} />;
    }

    if (!dataLoaded) {
        return <div className="card">Loading game data...</div>;
    }

    return (
        <div>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #646cff', paddingBottom: '0.5em', marginBottom: '1em' }}>
                    <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Editing: {fileName}</h2>
                    <button
                        onClick={handleUnload}
                        style={{ backgroundColor: '#d32f2f', color: 'white' }}
                    >
                        Go Back
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="tabs">
                        <div
                            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            {t('General')}
                        </div>
                        <div
                            className={`tab ${activeTab === 'items' ? 'active' : ''}`}
                            onClick={() => setActiveTab('items')}
                        >
                            {t('Items')}
                        </div>
                        <div
                            className={`tab ${activeTab === 'pokemon' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pokemon')}
                        >
                            {t('Pokemon')}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select value={language} onChange={handleLanguageChange} style={{ padding: '5px' }}>
                            <option value="en">English</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                            <option value="it">Italiano</option>
                            <option value="es">Español</option>
                        </select>
                        <button onClick={handleDownload}>Download Save</button>
                    </div>
                </div>
            </div>

            {activeTab === 'general' && (
                <GeneralTab save={saveFile} onUpdate={forceUpdate} language={language} />
            )}

            {activeTab === 'items' && (
                <ItemsTab save={saveFile} onUpdate={forceUpdate} language={language} />
            )}

            {activeTab === 'pokemon' && (
                <PokemonTab save={saveFile} onUpdate={forceUpdate} language={language} />
            )}
        </div>
    );
};
