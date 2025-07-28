import { Injectable } from "@tsed/di";
import { v2 } from "cloudinary"
import { envs } from "src/config/envs/index.js";

@Injectable()
export class CloudinaryService {
    constructor() {
      v2.config({
        cloud_name: envs.CLOUDINARY_CLOUD_NAME,
        api_key: envs.CLOUDINARY_API_KEY,
        api_secret: envs.CLOUDINARY_API_SECRET,
      });
    }

  uploadToCloudinary(path: string, folder: string) {
    return v2.uploader
      .upload(path, {
        folder,
        // width: 200,
        // height: 200,
        crop: "fill",
      })
      .then((data: { url: any; public_id: any; }) => {
        return { url: data.url, public_id: data.public_id };
      })
      .catch((error: any) => {
        console.log(error);
        throw new Error("Image not saved, try again")
      });
  };

  async removeFromCloudinary(public_id: any) {
    await v2.uploader.destroy(public_id, function (error: any, result: any) {
      console.log(result, error);
    });
  };
}
