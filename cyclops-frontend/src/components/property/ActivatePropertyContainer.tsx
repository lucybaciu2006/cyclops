import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import React, {Fragment, useEffect, useState} from "react";
import {Property} from "@/model/property.ts";
import {useNavigate} from "react-router-dom";
import {EventService, EventType, Event} from "@/core/event.service.ts";
import {ActivatePropertyComponent} from "@/components/property/ActivatePropertyComponent.tsx";

export default function ActivatePropertyContainer() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [property, setProperty] = useState<Property | undefined>(undefined);

    const navigate = useNavigate();

    useEffect(() => {
        const subscription = EventService.subscribeToEvent(EventType.ACTIVATE_PROPERTY).subscribe((event: Event) => {
            setProperty(event.payload);
            console.log(event);
            openModal()
        });
        return () => subscription.unsubscribe();
    }, []);

    const openModal = () => {
        setIsModalOpen(true);
    }

    const hideModal = () => {
        setIsModalOpen(false);
    }

    const handleActivationComplete = () => {
    }

    return (
        <Fragment>
            {isModalOpen &&
                <ActivatePropertyComponent
                    property={property!}
                    onClose={() => hideModal()}
                    onActivate={handleActivationComplete}
                />
            }
        </Fragment>
    )
}