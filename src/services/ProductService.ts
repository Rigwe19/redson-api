import { Inject, Injectable } from "@tsed/di";
import { type MongooseModel } from "@tsed/mongoose";
import { DocumentType } from "@typegoose/typegoose";
import { Types } from "mongoose";
import { Category } from "src/models/CategoryModel.js";
import { Favourite } from "src/models/FavouriteModel.js";
import { Product } from "src/models/ProductModel.js";
import { Rating } from "src/models/RatingModel.js";
import { View } from "src/models/ViewModel.js";

@Injectable()
export class ProductService {
  @Inject(Product) private readonly model: MongooseModel<Product>;
  @Inject(Category) private readonly category: MongooseModel<Category>;
  @Inject(View) private readonly view: MongooseModel<View>;
  @Inject(Rating) private readonly rating: MongooseModel<Rating>;
  @Inject(Favourite) private readonly favourite: MongooseModel<Favourite>;
  async create(body: any): Promise<Product> {
    return this.model.create(body);
  }
  async findOne(query: any): Promise<any | undefined | null> {
    const product = await this.model.findOne({ _id: query }).lean();

    const ratings = await this.rating.aggregate([
      { $match: { product_id: new Types.ObjectId(query) } },
      {
        $group: {
          _id: "$product_id",
          avg: { $avg: "$value" },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingStats = ratings[0] || { avg: 0, count: 0 };
    // console.log(product, ratingStats, ratings)
    return {
      ...product,
      rating: ratingStats.avg,
      count: ratingStats.count,
    };
  }
  async findBySlug(query: any): Promise<any | undefined | null> {
    const product = await this.model.findOne({ slug: query }).lean();

    const ratings = await this.rating.aggregate([
      { $match: { product_id: new Types.ObjectId(product?._id) } },
      {
        $group: {
          _id: "$product_id",
          avg: { $avg: "$value" },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingStats = ratings[0] || { avg: 0, count: 0 };
    // console.log(product, ratingStats, ratings)
    return {
      ...product,
      rating: ratingStats.avg,
      count: ratingStats.count,
    };
  }
  async findAll(query: {}, options: any = undefined): Promise<Product[]> {
    const products = await this.model
      .find(query, null, options)
      .sort({ createdAt: -1 })
      .lean();
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

    return products.map((product) => ({
      ...product,
      rating: ratingMap.get(product._id.toString())?.avg || 0,
      ratingCount: ratingMap.get(product._id.toString())?.count || 0,
    }));
  }
  async update(query: string, body: any): Promise<Product | null> {
    return await this.model.findOneAndUpdate({ _id: query }, body, {
      new: true,
      runValidators: true,
    });
  }

  async delete(query: string): Promise<boolean | null> {
    return await this.model.findByIdAndDelete({ _id: query });
  }

  async createCategory(body: any): Promise<Category | null> {
    return this.category.create(body);
  }
  async findAllCategory(options: any = {}): Promise<Category[]> {
    return await this.category.find(options).sort({ createdAt: -1 });
  }
  async findOneCategory(query: any): Promise<Category | undefined | null> {
    return await this.category.findOne({ slug: query });
  }
  async findProductByCategory(category_id: string): Promise<Product[]> {
    const products = await this.model
      .find({ category_id })
      .sort({ createdAt: -1 })
      .lean();
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

    return products.map((product) => ({
      ...product,
      rating: ratingMap.get(product._id.toString())?.avg || 0,
      ratingCount: ratingMap.get(product._id.toString())?.count || 0,
    }));
  }

  async getPopularProducts(userId?: string, limit = 10) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Step 1: Get popular product IDs from views
    const popularProductViews = await this.view.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: "$product_id",
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: limit },
    ]);

    const productIds = popularProductViews.map(
      (p) => new Types.ObjectId(p._id)
    );

    // Step 2: Query matching products
    const products = await this.model.find({ _id: { $in: productIds } }).lean(); // .lean() returns plain objects

    // Step 3: Sort products to match view order
    const sortedProducts = productIds
      .map((id) => products.find((p) => p._id.toString() === id.toString()))
      .filter((p) => !!p);

    // Step 4: Aggregate all ratings
    const ratings = await this.rating.aggregate([
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
      ratingMap.set(r._id.toString(), { avg: r.avg, count: r.count })
    );

    const favourites = await this.favourite
      .find({ user_id: userId })
      .select("product_id");
    const favouriteIds = new Set(
      favourites.map((f) => f.product_id.toString())
    );

    // Step 5: Combine products with ratings
    return sortedProducts.map((product) => ({
      ...product,
      rating: ratingMap.get(product._id.toString())?.avg || 0,
      ratingCount: ratingMap.get(product._id.toString())?.count || 0,
      isFavourite: favouriteIds.has(product._id.toString()),
    }));
  }

  async addView(body: any) {
    return await this.view.create(body);
  }

  async addFavourite(userId: string, productId: string) {
    return await this.favourite.findOneAndUpdate(
      {
        user_id: userId,
        product_id: productId,
      },
      {},
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  async removeFromFavourites(userId: string, productId: string) {
    return await this.favourite.deleteOne({
      user_id: userId,
      product_id: productId,
    });
  }

  async removeFromFavouritesById(id: string) {
    return await this.favourite.deleteOne({ _id: id });
  }

  async isFavourite(userId: string, productId: string): Promise<boolean> {
    const fav = await this.favourite.findOne({
      user_id: userId,
      product_id: productId,
    });
    return !!fav;
  }

  async getUserFavourites(userId: string) {
    const items = await this.favourite
      .find({ user_id: userId })
      .populate("product_id", "name price slug images");

    return items.map((item) => {
      const product = item.product_id as any;
      return {
        id: item._id,
        product_id: product._id,
        name: product.name,
        image: product.images?.[0].url || null,
        price: product.price,
        slug: product.slug,
        // quantity: item.quantity,
        // size: item.size,
        // color: item.color,
      };
    });
  }

  async getMinMaxPrice() {
    const result = await this.model.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $project: {
          _id: 0,
          minPrice: 1,
          maxPrice: 1,
        },
      },
    ]);

    return result[0] || { minPrice: 0, maxPrice: 0 };
  }
  async getAllAvailableColors() {
    const result = await this.model.aggregate([
      { $unwind: "$colors" },
      {
        $group: {
          _id: "$colors",
        },
      },
      {
        $project: {
          _id: 0,
          color: "$_id",
        },
      },
      {
        $sort: { color: 1 },
      },
    ]);

    return result.map((item) => item.color);
  }
  async getAllAvailableSizes() {
    const result = await this.model.aggregate([
      { $unwind: "$sizes" },
      {
        $group: {
          _id: "$sizes",
        },
      },
      {
        $project: {
          _id: 0,
          size: "$_id",
        },
      },
      {
        $sort: { size: 1 }, // Optional: sorts alphabetically
      },
    ]);

    return result.map((item) => item.size);
  }

  async getFilteredProducts(query: any) {
    const filter: any = {};

    if (query.category) {
      filter.category_id = query.category;
    }

    if (query.q) {
      filter.name = { $regex: `.*${query.q}.*`, $options: "i" };
    }

    // Color filter (multi-select)
    if (query.color) {
      const colors =
        typeof query.color === "string" ? query.color.split(",") : query.color;
      // const colors = Array.isArray(query.color) ? query.color : query.color.;
      filter["variants.color"] = { $in: colors };
    }

    // Size filter (multi-select)
    if (query.size) {
      const sizes =
        typeof query.size === "string" ? query.size.split(",") : query.size;
      // const sizes = Array.isArray(query.size) ? query.size : [query.size];
      filter["variants.size"] = { $in: sizes };
    }

    // Price filter (range)
    if (query.maxPrice || query.minPrice) {
      const min = query.minPrice;
      const max = query.maxPrice;
      // const [min, max] = query.price.split("-").map(Number);
      filter.price = {
        $gte: isNaN(min) ? 0 : min,
        $lte: isNaN(max) ? Infinity : max,
      };
    }

    // You can extend this with tags like "care" or "accessory type"
    // if (query.tag) {
    //   const tags = Array.isArray(query.tag) ? query.tag : [query.tag];
    //   filter.tags = { $in: tags };
    // }

    // Example pagination and sorting (optional)
    const limit = parseInt(query.limit) || 20;
    const page = parseInt(query.page) || 1;
    console.log(filter);
    const products = await this.model
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

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

    return products.map((product) => ({
      ...product,
      rating: ratingMap.get(product._id.toString())?.avg || 0,
      ratingCount: ratingMap.get(product._id.toString())?.count || 0,
    }));
  }

  async getFavouriteProductIds(userId: string): Promise<string[]> {
    const favs = await this.favourite
      .find({ user_id: userId })
      .select("product_id");
    return favs.map((f) => f.product_id.toString());
  }
}
