import { ChangeEvent, useCallback, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { UploadIcon, OctagonAlert } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const MB_TO_BYTES = 1024 ** 2;
const MAX_SIZE = 20;
const ACCEPTED_TYPES = [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/mp4',
    'audio/x-m4a'
];

interface UploadButtonProps {
    onUpload: (file: File) => void;
}

export function UploadButton({
    onUpload,
}: UploadButtonProps) {
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState("");

    const clearAlert = useCallback(() => {
        setAlertOpen(false);
        setAlertTitle("");
    }, []);

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        // validate file type
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setAlertTitle("Invalid File Type");
            setAlertOpen(true);
            event.target.value = "";
            return;
        }
        // validate size
        if (file.size > MAX_SIZE * MB_TO_BYTES) {
            setAlertTitle("File Too Large");
            setAlertOpen(true);
            event.target.value = "";
            return;
        }

        onUpload(file);
        // reset input to allow uploading file again
        event.target.value = "";
    }, [onUpload]);

    return (
        <div className="flex items-center justify-center">
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    {/* ALERT HEADER */}
                    <AlertDialogHeader className="items-center">
                        {/* ALERT TITLE */}
                        <AlertDialogTitle>
                            <div className="mb-2 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                                <OctagonAlert className="h-5 w-5 text-destructive" />
                            </div>
                            {alertTitle}
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    {/* ALERT FOOTER */}
                    <AlertDialogFooter className="sm:justify-center">
                        <AlertDialogAction
                            className={`${buttonVariants({ variant: "destructive" })} cursor-pointer`}
                            onClick={clearAlert}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* INPUT FIELD */}
            <input
                id="audio-upload"
                className="hidden"
                type="file"
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