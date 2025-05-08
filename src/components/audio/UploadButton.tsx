import { ChangeEvent, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "lucide-react";

interface UploadButtonProps {
    onUpload: (file: File) => void;
    accept?: string;
    maxSize?: number;
}

const MB_TO_BYTES = 1024 ** 2;

export function UploadButton({
    onUpload,
    accept = "audio/*",
    maxSize = 20
}: UploadButtonProps) {
    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // validate file type
        if (!file.type.startsWith('audio/')) {
            alert(`UploadButton : Invalid file type`);
            return;
        }

        // validate size (MB to bytes)
        if (file.size > maxSize * MB_TO_BYTES) {
            alert(`File too large. Maximum size is ${maxSize}MB`);
            return;
        }

        onUpload(file);

        // reset input to allow uploading file again
        event.target.value = "";
    }, [maxSize, onUpload]);

    return (
        <div className="flex items-center justify-center">
            <input
                id="audio-upload"
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleChange}
            />
            <Button asChild variant="default" className="gap-2 pl-4 pr-6 cursor-pointer">
                <label htmlFor="audio-upload">
                    <UploadIcon className="w-5 h-5" />
                    Upload Audio
                </label>
            </Button>
        </div>
    );
}