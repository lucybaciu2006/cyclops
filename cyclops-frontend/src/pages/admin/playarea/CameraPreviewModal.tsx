import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CameraPreview from "./CameraPreview";

type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    adminWs: WebSocket | null;
    locationId: string;
    title?: string;
};

export default function CameraPreviewModal({ open, onOpenChange, adminWs, locationId, title }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{title || "Camera preview"}</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <CameraPreview adminWs={adminWs} locationId={locationId} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
