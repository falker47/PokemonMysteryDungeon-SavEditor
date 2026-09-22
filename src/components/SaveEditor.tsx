import React, { useState, useEffect } from 'react';
import { SaveFile } from '../save/SaveFile';
import { detectSaveFile } from '../save/detectSaveFile';
import { FileUpload } from './FileUpload';
import { GeneralTab } from './GeneralTab';
import { ItemsTab } from './ItemsTab';
import { PokemonTab } from './PokemonTab';
import { DataManager } from '../utils/DataManager';
import { useTranslation } from '../hooks/useTranslation';

const Footer = () => (
    <footer style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
        <a
            href="https://falker47.github.io/Nexus-portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
        >
            &copy; {new Date().getFullYear()} Maurizio Falconi - falker47
        </a>
    </footer>
);

export const SaveEditor: React.FC = () => {
    const [saveFile, setSaveFile] = useState<SaveFile | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>('general');
    const [, setUpdateKey] = useState<number>(0);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [language, setLanguage] = useState(localStorage.getItem('pmd-save-editor-language') || 'en');
    const { t } = useTranslation(language);

    useEffect(() => {
        DataManager.getInstance().setLanguage(language).then(() => setDataLoaded(true));
    }, []);

    const handleFileLoaded = (data: Uint8Array, name: string) => {
        const detectedSave = detectSaveFile(data);

        if (!detectedSave) {
            console.warn("Unsupported or invalid save file: no supported checksum matched.");
            alert(t('LoadError'));
            return;
        }

        setDataLoaded(false);
        setSaveFile(detectedSave);
        setFileName(name);

        DataManager.getInstance()
            .loadData(detectedSave.gameType)
            .then(() => {
                setDataLoaded(true);
                setUpdateKey(k => k + 1);
            });
    };

    const handleLanguageChange = async (lang: string) => {
        setLanguage(lang);
        localStorage.setItem('pmd-save-editor-language', lang);
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
            alert(t('SaveError'));
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
        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
                <FileUpload onFileLoaded={handleFileLoaded} currentLanguage={language} onLanguageChange={handleLanguageChange} />
                <Footer />
            </div>
        );
    }

    if (!dataLoaded) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
                <div className="card">{t('LoadingGameData')}</div>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <div className="card" style={{ padding: '0.8em', marginBottom: '0.5em' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #646cff', paddingBottom: '0.3em', flexWrap: 'wrap', gap: '10px' }}>
                        <h2 style={{ margin: 0, border: 'none', padding: 0, flex: 1, minWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '1rem', fontSize: '1.5rem' }} title={`${t('Editing')} ${fileName}`}>
                            {t('Editing')} {fileName}
                        </h2>
                        <button
                            onClick={handleUnload}
                            style={{ backgroundColor: '#d32f2f', color: 'white', whiteSpace: 'nowrap', padding: '0.3em 0.8em' }}
                        >
                            {t('GoBack')}
                        </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        <div className="tabs" style={{ flexWrap: 'wrap', marginBottom: 0 }}>
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
                            <button onClick={handleDownload} style={{ width: '100%', backgroundColor: '#2e7d32', padding: '0.3em 0.8em' }}>{t('Download')}</button>
                        </div>
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
            <Footer />
        </div>
    );
};
