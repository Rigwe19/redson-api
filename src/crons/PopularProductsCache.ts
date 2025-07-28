import { Inject, Injectable } from "@tsed/di";
import { PlatformCache } from "@tsed/platform-cache";
import { ProductService } from "../services/ProductService.js";

@Injectable()
export class PopularProductsCacheJob {
    @Inject()
    private cache: PlatformCache;
    @Inject()
    private readonly productService: ProductService;

//   @Cron("0 */6 * * *") // Every 6 hours
  async cachePopularProducts() {
    const products = await this.productService.getPopularProducts(undefined, 8);
    await this.cache.set("popular:products", products, { ttl: 60 * 60 * 6 }); // 6h TTL
  }
}
