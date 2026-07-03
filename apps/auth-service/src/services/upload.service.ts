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
