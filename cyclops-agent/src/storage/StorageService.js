"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
class StorageService {
    constructor() {
        this.SNAPSHOTS_LOCATION = `/$locationId/snapshots/`;
        this.VIDEOS_LOCATION = '/$locationId/videos/';
    }
    uploadCameraSnapshot() {
        // save into snapshots_location folder. latest.jpg
    }
    uploadRecordingSegment() {
    }
}
exports.StorageService = StorageService;
