import { useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "lucide-react";
import { AUDIO_FILE_ACCEPT } from "@/utils/audioFile";

interface UploadButtonProps {
  onUpload: (file: File) => void;
}

export function UploadButton({ onUpload }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onUpload(file);
  };

  return (
    <div className="flex items-center justify-center">
      <input
        ref={inputRef}
        aria-label="Choose audio file"
        className="hidden"
        type="file"
        accept={AUDIO_FILE_ACCEPT}
        onChange={handleChange}
      />
      <Button
        className="gap-2 pl-4 pr-6 cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon className="w-5 h-5" />
        Upload Audio
      </Button>
    </div>
  );
}
