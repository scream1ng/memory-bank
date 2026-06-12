import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  endpoint: process.env.BUCKET_ENDPOINT!,
  region: process.env.BUCKET_REGION ?? 'auto',
  credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY_ID!,
    secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.BUCKET_NAME!

export async function getPresignedPutUrl(path: string, contentType: string) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: path, ContentType: contentType }),
    { expiresIn: 300 },
  )
}

export async function getPresignedGetUrl(path: string) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: path }),
    { expiresIn: 3600 },
  )
}
