import cloudinary from "../config/cloudinary.js";

export const uploadSignature = async (firmaBase64: string) => {
  return await cloudinary.uploader.upload(firmaBase64, {
    folder: "firmas_actas",
    resource_type: "image",
  });
};