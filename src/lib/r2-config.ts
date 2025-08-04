// R2 Storage Configuration
export const r2Config = {
  // Default bucket name - get from Cloudflare Worker environment
  get defaultBucketName() {
    // For Cloudflare Workers, this will be set via wrangler.toml vars
    return process.env.R2_DEFAULT_BUCKET || 'documents';
  },

  // Maximum file size for single upload (100MB)
  // Files larger than this will use multipart upload
  singleUploadMaxSize: 100 * 1024 * 1024,

  // Multipart upload chunk size (10MB)
  multipartChunkSize: 10 * 1024 * 1024,

  // Supported preview file types
  previewableImageTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],

  previewableTextTypes: [
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'text/markdown',
    'application/json',
    'application/xml',
    'text/xml',
    'application/yaml',
    'text/yaml'
  ],

  previewableAudioTypes: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp3'
  ],

  previewableVideoTypes: [
    'video/mp4',
    'video/webm',
    'video/ogg'
  ]
};

export const isPreviewableImage = (contentType: string) =>
  r2Config.previewableImageTypes.includes(contentType);

export const isPreviewableText = (contentType: string, filename?: string) =>
  r2Config.previewableTextTypes.includes(contentType) ||
  (filename && (
    filename.endsWith('.md') ||
    filename.endsWith('.txt') ||
    filename.endsWith('.json') ||
    filename.endsWith('.xml') ||
    filename.endsWith('.yml') ||
    filename.endsWith('.yaml')
  ));

export const isPreviewableAudio = (contentType: string) =>
  r2Config.previewableAudioTypes.includes(contentType);

export const isPreviewableVideo = (contentType: string) =>
  r2Config.previewableVideoTypes.includes(contentType);