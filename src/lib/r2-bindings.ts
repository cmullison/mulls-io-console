// R2 Bucket Bindings for Cloudflare Workers
export interface CloudflareEnv {
  // R2 bucket bindings (from wrangler.jsonc)
  documents: R2Bucket;
  images: R2Bucket;
  videos: R2Bucket;
  chum: R2Bucket;
  'sd-chat': R2Bucket;
  
  // Environment variables
  R2_DEFAULT_BUCKET?: string;
}

// Map bucket names to their bindings
const BUCKET_BINDINGS: Record<string, keyof CloudflareEnv> = {
  'documents': 'documents',
  'images': 'images', 
  'videos': 'videos',
  'chum': 'chum',
  'sd-chat': 'sd-chat',
  // Add fallback mapping for the default bucket
  'default': 'documents',
};

export function getBucketBinding(env: CloudflareEnv, bucketName: string): R2Bucket | null {
  const bindingName = BUCKET_BINDINGS[bucketName];
  if (!bindingName) {
    console.error(`No binding found for bucket: ${bucketName}`);
    return null;
  }
  
  const bucket = env[bindingName] as R2Bucket;
  if (!bucket) {
    console.error(`Bucket binding '${bindingName}' not found in environment`);
    return null;
  }
  
  return bucket;
}

export function getAvailableBuckets(): string[] {
  return Object.keys(BUCKET_BINDINGS);
}