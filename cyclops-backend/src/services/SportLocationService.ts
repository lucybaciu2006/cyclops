import {ISportLocation, SportLocation} from "../models/location/SportLocation";
import {CloudStorage} from "./CloudStorage";
import sharp from "sharp";
import {StoredFile} from "../models/StoredFile";

export class SportLocationService {


    public static async updatePlayAreaImage(playAreaId: string, file: Express.Multer.File): Promise<ISportLocation> {
        const location: ISportLocation | null = await SportLocation.findById(playAreaId);
        if (!location) {
            throw new Error('Location not found');
        }
        const oldImage = location.image;
        try {
            // Save the new image to GCS
            const uniqueFilename = `${Date.now()}_${file.originalname}`;

            const compressedBuffer = await sharp(file.buffer)
                .resize({ width: 600 })
                .webp({ quality: 80 })
                .toBuffer();

            const storedFile: StoredFile = await CloudStorage.saveFile(
                `locations/${location.id!}/${uniqueFilename}`,
                compressedBuffer,
                file.mimetype
            );

            // Update property document
            location.image = storedFile;
            const x = location.validateSync();
            console.log(x);
            await location.save();

            // cleanup
            if (oldImage) {
                await CloudStorage.deleteFile(oldImage.id);
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            throw err;
        }

        return location;
    }



}