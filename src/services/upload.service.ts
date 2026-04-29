// services/upload.service.ts
import cloudinary from "../config/cloudinary.js";

export const uploadFirma = async (base64: string) => {
  const res = await cloudinary.uploader.upload(base64, {
    folder: "firmas_actas",
    resource_type: "image",
  });

  return {
    url: res.secure_url,
    public_id: res.public_id,
  };
};