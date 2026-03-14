import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
    const keyRaw = process.env.SMTP_ENCRYPTION_KEY;
    if (!keyRaw) {
        throw new Error('Missing SMTP_ENCRYPTION_KEY');
    }

    const key = Buffer.from(keyRaw, 'utf8');
    if (key.length < 32) {
        throw new Error('SMTP_ENCRYPTION_KEY must be at least 32 characters');
    }

    return key.subarray(0, 32);
}

export function encryptSecret(plaintext: string): string {
    const key = getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGO, key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(enc: string): string {
    const key = getKey();
    const [ivB64, tagB64, dataB64] = enc.split(':');

    if (!ivB64 || !tagB64 || !dataB64) {
        throw new Error('Invalid encrypted secret format');
    }

    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');

    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
}
