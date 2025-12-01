export type ImageUploadConfig = {
  maxFileSize: number;
  allowedTypes: readonly string[];
  maxDimension: number;
  compressionQuality: number;
}

export type ImageUploadResult = {
  base64: string;
  file: File;
  originalSize: number;
  compressedSize: number;
}
