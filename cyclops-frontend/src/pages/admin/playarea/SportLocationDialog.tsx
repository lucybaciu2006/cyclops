import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SportLocation } from "@/model/sport-location.ts";
import { AdminService } from "@/services/AdminService.ts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {SportType} from "@/model/sport-type.ts";

interface PlayAreaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateSuccess: () => void;
    onUpdate: (area: Partial<SportLocation> & { imageFile?: File }) => void;
    initialData?: SportLocation | null;
}

const PLAY_AREA_TYPES: SportType[] = [SportType.MINI_FOOTBALL] as const;

export default function SportLocationDialog({
                                           open,
                                           onOpenChange,
                                           onUpdate,
                                           onCreateSuccess,
                                           initialData,
                                       }: PlayAreaDialogProps) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [address, setAddress] = useState("");
    const [type, setType] = useState<SportType>(SportType.MINI_FOOTBALL);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (initialData) {
            setName(initialData?.name || "");
            setSlug(initialData?.slug || "");
            setAddress(initialData?.address || "");
            setType(initialData?.sport || SportType.MINI_FOOTBALL);
            setCoordinates(initialData?.coordinates || null);
            setImagePreview(initialData.image?.url);
            setImageFile(null);
        }
    }, [initialData]);

    const handleSubmit = async () => {
        if (!name || !slug || !address) return;

        const newLocation: Partial<SportLocation> = {
            name,
            slug,
            address,
            sport: type,
            coordinates: {lng: 23.62, lat: 46.77},
        };

        if (!initialData) {
            const createdLocation = await AdminService.createSportLocation(newLocation);
            if (imageFile) {
                await AdminService.updateSportLocationImage(createdLocation._id, imageFile);
            }
            onCreateSuccess();
        } else {
            // update
            const updated = await AdminService.updateSportLocation(initialData._id, newLocation);
            if (imageFile) {
                await AdminService.updateSportLocationImage(initialData._id, imageFile);
            }
            onUpdate(updated);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Area" : "Create Area"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="areaName">Name</Label>
                        <Input id="areaName" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="areaSlug">Slug</Label>
                        <Input id="areaSlug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="areaAddress">Address</Label>
                        <Textarea
                            id="areaAddress"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="areaType">Type</Label>
                        <Select value={type} onValueChange={(val) => setType(val as SportLocation["sport"])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {PLAY_AREA_TYPES.map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Coordinates</Label>
                        {/* <MapSelector value={coordinates} onChange={setCoordinates} /> */}
                        {coordinates && (
                            <p className="text-sm text-muted-foreground">
                                Selected: {coordinates.lat}, {coordinates.lng}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label>Image</Label>
                        <Input type="file" accept="image/*" onChange={handleImageChange} />
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="mt-2 max-h-40 rounded border"
                            />
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit}>
                        {initialData ? "Update" : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
