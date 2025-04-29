import { ChangeEvent } from "react";

interface UploadButtonProps {
    onUpload: (file: File) => void;
}

/**
 * UploadButton component for selecting audio files.
 * @param onUpload Callback when file is uploaded
 */
export function UploadButton({ onUpload }: UploadButtonProps) {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith("audio/")) {
            onUpload(file);
        } else {
            // Optional: alert user if file type is invalid
            alert("Please upload a valid audio file.");
        }
    };

    return (
        <div className="flex items-center justify-center">
            <input
                type="file"
                accept="audio/*"
                onChange={handleChange}
                className="hidden"
                id="file-upload"
            />
            <label
                htmlFor="file-upload"
                className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md shadow hover:bg-primary/80"
            >
                Upload Audio
            </label>
        </div>
    );
}