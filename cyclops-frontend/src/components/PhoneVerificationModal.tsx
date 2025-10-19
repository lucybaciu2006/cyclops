import { Dialog, DialogContent } from "@/components/ui/dialog";
import PhoneVerificationContent from "./PhoneVerificationContent";

export default function PhoneVerificationModal({ property, onClose, onVerified }) {
    return (
        <Dialog open onOpenChange={onClose} >
            <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
                <PhoneVerificationContent property={property} onVerified={onVerified} onCancel={onClose} />
            </DialogContent>
        </Dialog>
    );
}
