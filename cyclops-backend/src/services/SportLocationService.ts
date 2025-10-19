import {ISportLocation, SportLocation} from "../models/entities/SportLocation";
import {CloudStorage} from "./CloudStorage";
import sharp from "sharp";
import {StoredFile} from "../models/StoredFile";

export class SportLocationService {

    public static async updatePlayAreaImage(playAreaId: string, file: Express.Multer.File): Promise<ISportLocation> {
        const property: ISportLocation | null = await SportLocation.findById(playAreaId);
        if (!property) {
            throw new Error('Property not found or not owned by user');
        }
        if (property.image) {
            await CloudStorage.deleteFile(property.image.id);
        }
        try {
            // Save the new image to GCS
            const uniqueFilename = `${property._id}_${Date.now()}_${file.originalname}`;

            const compressedBuffer = await sharp(file.buffer)
                .resize({ width: 600 })
                .webp({ quality: 80 })
                .toBuffer();

            const storedFile: StoredFile = await CloudStorage.saveFile(
                `locations/${uniqueFilename}`,
                compressedBuffer,
                file.mimetype
            );

            // Update property document
            property.image = storedFile;
            const x = property.validateSync();
            console.log(x);
            await property.save();
        } catch (err) {
            console.error('Image upload failed:', err);
            throw err;
        }

        return property;
    }



}