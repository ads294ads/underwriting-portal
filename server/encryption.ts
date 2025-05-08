import crypto from 'crypto';

// Encryption key should be stored in environment variables in production
// For dev purposes, we'll generate a key if not available in environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16; // For AES, this is always 16 bytes

/**
 * Enhanced encryption service for sensitive data
 * Uses AES-256-GCM with authentication tag for higher security
 */
export class EncryptionService {
  // Singleton instance
  private static instance: EncryptionService;

  private constructor() {}

  /**
   * Get the singleton instance of the encryption service
   */
  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Encrypt text using AES-256-GCM with authentication
   * @param text The text to encrypt
   * @returns Encrypted data with IV and auth tag
   */
  public encrypt(text: string): string {
    try {
      // Generate random initialization vector
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Create cipher with AES-256-GCM for authenticated encryption
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
      
      // Encrypt the data
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag().toString('hex');
      
      // Format: iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt text that was encrypted with AES-256-GCM
   * @param encryptedData The encrypted data (format: iv:authTag:encryptedData)
   * @returns The decrypted text
   */
  public decrypt(encryptedData: string): string {
    try {
      // Split the components
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = parts[2];
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
      
      // Set auth tag for verification
      decipher.setAuthTag(authTag);
      
      // Decrypt
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return 'Error: Unable to decrypt data';
    }
  }

  /**
   * Encrypt a file buffer
   * @param buffer The file buffer to encrypt
   * @returns Encrypted buffer data
   */
  public encryptBuffer(buffer: Buffer): Buffer {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
      
      const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      // Format: [16 bytes IV][16 bytes authTag][rest is encrypted data]
      return Buffer.concat([iv, authTag, encrypted]);
    } catch (error) {
      console.error('Buffer encryption error:', error);
      throw new Error('Failed to encrypt file data');
    }
  }

  /**
   * Decrypt an encrypted file buffer
   * @param encryptedBuffer The encrypted buffer
   * @returns Decrypted file buffer
   */
  public decryptBuffer(encryptedBuffer: Buffer): Buffer {
    try {
      // Extract IV, auth tag, and encrypted data
      const iv = encryptedBuffer.subarray(0, IV_LENGTH);
      const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH * 2);
      const encryptedData = encryptedBuffer.subarray(IV_LENGTH * 2);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    } catch (error) {
      console.error('Buffer decryption error:', error);
      throw new Error('Failed to decrypt file data');
    }
  }
  
  /**
   * Hash sensitive data for storage or comparison (one-way)
   * @param data Data to hash
   * @returns SHA-256 hash of the data
   */
  public hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
  
  /**
   * Create a secure ID for a document
   * @param fileName Original file name
   * @param timestamp Upload timestamp
   * @returns Secure document ID
   */
  public createSecureDocumentId(fileName: string, timestamp: number): string {
    const dataToHash = `${fileName}:${timestamp}:${crypto.randomBytes(8).toString('hex')}`;
    return this.hash(dataToHash).substring(0, 16);
  }
}