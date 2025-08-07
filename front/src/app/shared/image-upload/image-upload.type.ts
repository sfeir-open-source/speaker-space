export type ImageUploadConfig = {
  title: string;
  description: string;
  acceptedFormats: string[];
  maxFileSize: number;
  recommendedSize?: string;
  maxSizeText?: string;
  optimizationLink?: string;
  width?: string;
  height?: string;
  shape?: 'square' | 'rectangle' | 'circle';
}

export type ImageUploadResult = {
  file: File;
  base64: string;
  url: string;
}
