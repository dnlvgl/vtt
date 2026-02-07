export interface Asset {
  id: string;
  roomId: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
}
