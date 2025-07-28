import { Inject, Injectable } from "@tsed/di";
import { Ref, type MongooseModel } from "@tsed/mongoose";
import { Favourite } from "src/models/FavouriteModel.js";
import { Product } from "src/models/ProductModel.js";
import { Rating } from "src/models/RatingModel.js";
import { View } from "src/models/ViewModel.js";

@Injectable()
export class DashboardService {
  @Inject(View) private readonly view: MongooseModel<View>;
  @Inject(Product) private readonly product: MongooseModel<Product>;
  @Inject(Rating) private readonly rating: MongooseModel<Rating>;
  @Inject(Favourite) private readonly favourite: MongooseModel<Favourite>;
  async getViews(user_id: string): Promise<Ref<Product>[]> {
    const productIds = await this.view.distinct("product_id", { user_id });
    const products = await this.product.find({ _id: { $in: productIds } }).lean();
    const ratings = await this.rating.aggregate([
      // {$match: {product_id: new Types.ObjectId(productId)}}
      {
        $group: {
          _id: "$product_id",
          avg: { $avg: "$value" },
          count: { $sum: 1 },
        },
      },
    ]);
    const ratingMap = new Map<string, { avg: number; count: number }>();
    ratings.forEach((r) =>
      ratingMap.set(r._id.toString(), { avg: r.ag, count: r.count })
    );

    const favourites = await this.favourite
      .find({ user_id })
      .select("product_id");
    const favouriteIds = new Set(
      favourites.map((f) => f.product_id.toString())
    );

    return products.map((product) => ({
      ...product,
      rating: ratingMap.get(product._id.toString())?.avg || 0,
      ratingCount: ratingMap.get(product._id.toString())?.count || 0,
      isFavourite: favouriteIds.has(product._id.toString()),
    }));
  }
}
