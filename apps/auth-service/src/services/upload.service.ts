import streamifier from 'streamifier';
import { cloudinary } from '../providers/CloudinaryProvider';

export const uploadToCloudinary = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'avatars' },
      (error, result) => {
        if (error) return reject(error);
        if (result) resolve(result.secure_url);
      },
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Remove do Cloudinary uma imagem enviada por uploadToCloudinary, a partir da
// URL salva no perfil (…/upload/v123/avatars/abc.jpg -> "avatars/abc").
export async function deleteFromCloudinary(url: string): Promise<void> {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  if (!match) return;
  await cloudinary.uploader.destroy(match[1]);
}
