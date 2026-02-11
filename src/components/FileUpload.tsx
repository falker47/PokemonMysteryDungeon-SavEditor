import React, { useRef } from 'react';

interface FileUploadProps {
    onFileLoaded: (data: Uint8Array, fileName: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded }) => {
    const fileInput = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const buffer = event.target?.result as ArrayBuffer;
            if (buffer) {
                onFileLoaded(new Uint8Array(buffer), file.name);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const buffer = event.target?.result as ArrayBuffer;
            if (buffer) {
                onFileLoaded(new Uint8Array(buffer), file.name);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="card">
            <h2>Load Save File</h2>
            <div
                className="file-upload"
                onClick={() => fileInput.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInput}
                    style={{ display: 'none' }}
                    accept=".sav"
                    onChange={handleFileChange}
                />
                <p>Click or Drag & Drop to upload .sav file</p>
            </div>
        </div>
    );
};
