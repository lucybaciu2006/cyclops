import {DialogContent} from "@/components/ui/dialog.tsx";
import {CreatePropertyWizard} from "@/pages/dashboard/CreatePropertyWizard.tsx";
import {Dialog} from "@radix-ui/react-dialog";
import React, {useEffect, useState} from "react";
import {Property} from "@/model/property.ts";
import {useNavigate} from "react-router-dom";
import {EventService, EventType} from "@/core/event.service.ts";

export default function CreatePropertyContainer() {
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const subscription = EventService.subscribeToEvent(EventType.OPEN_CREATE_PROPERTY).subscribe(() => openCreateProperty());
        return () => subscription.unsubscribe();
    }, []);

    const openCreateProperty = () => {
        setIsWizardOpen(true);
    }

    const closeCreateProperty = () => {
        setIsWizardOpen(false);
    }

    const handlePropertyCreated = (p: Property) => {
        closeCreateProperty();
        setTimeout(() => {
            navigate(`/properties/${p._id}/details`);
        }, 500);
    }

    return (
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
            <DialogContent className="w-[800px] max-w-full max-h-[90vh] bg-white flex flex-col overflow-hidden">
                <CreatePropertyWizard onSuccess={handlePropertyCreated} onDismiss={closeCreateProperty}/>
            </DialogContent>
        </Dialog>
    )
}