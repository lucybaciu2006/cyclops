import fs from 'fs';
import path from 'path';
import { Storage } from '@google-cloud/storage';

export function createStorage(): Storage {
  const envKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envKey && fs.existsSync(envKey)) {
    return new Storage({ keyFilename: envKey });
  }
  const local = path.resolve(process.cwd(), 'google-credentials.json');
  if (fs.existsSync(local)) {
    return new Storage({ keyFilename: local });
  }
  // Fall back to ADC if available (e.g., on GCE/Cloud Run) or env var without file check
  return new Storage();
}

