// services/RatingService.ts
import { Inject, Injectable } from "@tsed/di";
import { type MongooseModel } from "@tsed/mongoose";
import { Types } from "mongoose";
import { Rating } from "src/models/RatingModel.js";

@Injectable()
export class RatingService {
  @Inject(Rating) private readonly ratingModel: MongooseModel<Rating>

  async rate(user_id: string, product_id: string, value: number, comment?: string) {
    const existing = await this.ratingModel.findOne({ user_id, product_id });

    if (existing) {
      existing.value = value;
      if (comment) existing.comment = comment;
      return existing.save();
    }

    return this.ratingModel.create({ user_id, product_id, value, comment });
  }

  async getRatingsForProduct(product_id: string) {
    return this.ratingModel.find({ product_id }).populate("user_id", "name");
  }

  async getAverageRating(product_id: string) {
    const result = await this.ratingModel.aggregate([
      { $match: { product_id: new Types.ObjectId(product_id) } },
      {
        $group: {
          _id: "$product_id",
          avg: { $avg: "$value" },
          count: { $sum: 1 },
        },
      },
    ]);

    return result[0] || { avg: 0, count: 0 };
  }
}
