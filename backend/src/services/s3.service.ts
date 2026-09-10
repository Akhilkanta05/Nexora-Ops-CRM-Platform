import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock_access_key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock_secret_key',
  },
});

export class S3Service {
  /**
   * Generates a pre-signed S3 upload URL for product images.
   * Bonus feature per Case Study PDF: "Upload product image to AWS S3"
   */
  static async getPresignedUploadUrl(filename: string, contentType: string) {
    const bucket = process.env.AWS_S3_BUCKET || 'nexora-product-catalog';
    const key = `products/${Date.now()}_${filename.replace(/\s+/g, '_')}`;

    // If real AWS credentials are not configured, return a standard demonstration URL
    if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'mock_access_key') {
      return {
        uploadUrl: `https://${bucket}.s3.amazonaws.com/${key}`,
        fileUrl: `https://${bucket}.s3.amazonaws.com/${key}`,
        key,
        isMock: true,
        message: 'AWS S3 credentials not provided; mock storage URL generated.',
      };
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return {
      uploadUrl,
      fileUrl,
      key,
      isMock: false,
    };
  }
}
