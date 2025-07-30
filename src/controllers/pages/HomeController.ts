import { Controller, Inject } from "@tsed/di";
import { Authenticate } from "@tsed/passport";
import { Req } from "@tsed/platform-http";
import { BodyParams, PathParams, QueryParams } from "@tsed/platform-params";
import { Delete, Get, Post, Security } from "@tsed/schema";
import slugify from "slugify";
import { OptionalAuth } from "src/decorators/OptionalAuth.js";
import { Product } from "src/models/ProductModel.js";
import { User } from "src/models/UserModel.js";
import { AddressService } from "src/services/AddressService.js";
import { CartService } from "src/services/CartService.js";
import { ProductService } from "src/services/ProductService.js";

@Controller("/home")
export class HomeController {
  @Inject()
  private readonly productService: ProductService;
  @Inject()
  private readonly cartService: CartService;
  @Inject()
  private readonly addressService: AddressService;
  @Get("/")
  async get() {
    const products = await this.productService.findAll(
      {},
      {
        limit: 8,
      }
    );

    const popular = await this.productService.findAll(
      {},
      {
        limit: 4,
        sort: { views: -1 },
      }
    );
    return {
      success: true,
      products,
      popular,
    };
  }

  @Post("/add/cart")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async addCart(
    @Req("user") user: User,
    @BodyParams("product_id") product_id: string,
    @BodyParams("quantity") quantity: number = 1,
    @BodyParams("color") color: string = "",
    @BodyParams("size") size: string = ""
  ) {
    const product = await this.productService.findOne(product_id);

    if (!product) {
      return { success: false, message: `No product with id : ${product_id}` };
    }

    this.cartService.create(user._id, {
      product_id,
      quantity,
      color,
      size,
    });

    return {
      success: true,
      message: "Product added to cart",
    };
  }

  @Post("/cart/quantity")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async addCartQuantity(
    @Req("user") user: User,
    @BodyParams("id") id: string,
    @BodyParams("delta") delta: number
  ) {
    const item = await this.cartService.quantity(id, delta);

    if (!item) {
      return { success: false, message: `No item found in cart` };
    }
    const carts = await this.cartService.findItem({ cart_id: item.cart_id });
    if (!carts || carts.length === 0) {
      return { success: false, message: "No items in cart", carts: [] };
    }

    return {
      success: true,
      carts,
    };
  }

  @Get("/carts")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async getCart(@Req("user") user: User) {
    const cart = await this.cartService.findOne({ user_id: user._id });
    if (!cart) {
      return { success: false, message: "No items in cart", carts: [] };
    }
    const cartItems = await this.cartService.findItem({ cart_id: cart._id });
    if (!cartItems || cartItems.length === 0) {
      return { success: false, message: "No items in cart", carts: [] };
    }

    return {
      success: true,
      carts: cartItems,
    };
  }
  @Get("/checkout")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async checkout(@Req("user") user: User) {
    const cart = await this.cartService.findOne({ user_id: user._id });
    if (!cart) {
      return { success: false, message: "No items in cart" };
    }
    const cartItems = await this.cartService.findItem({ cart_id: cart._id });
    if (!cartItems || cartItems.length === 0) {
      return { success: false, message: "No items in cart" };
    }
    const addresses = await this.addressService.findAll(user._id);

    return {
      success: true,
      carts: cartItems,
      addresses,
    };
  }

  @Post("/favourite")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async addFavourite(
    @BodyParams("product_id") product_id: string,
    @Req("user") user: User
  ) {
    const isFav = await this.productService.isFavourite(user._id, product_id);

    if (isFav) {
      await this.productService.removeFromFavourites(user._id, product_id);
    } else {
      await this.productService.addFavourite(user._id, product_id);
    }

    return {
      success: !isFav,
    };
  }

  @Get("/product/:id")
  @OptionalAuth()
  async getProductBySlug(
    @PathParams("id") id: string,
    @Req("user") user: User,
    @Req() req: Req
  ) {
    // const user = req.user as User | undefined;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const product = await this.productService.findBySlug(id);
    if (!product) {
      const popular = await this.productService.getPopularProducts(user._id, 8);
      return {
        success: false,
        popular,
        message: `No product found slug:${id}`,
      };
    }
    const popular = await this.productService.getPopularProducts(user._id, 8);

    // console.log(user?._id)
    await this.productService.addView({
      product_id: product._id,
      user_id: user?._id,
      ip_address: Array.isArray(ip) ? ip[0] : ip,
    });

    return {
      success: true,
      product,
      popular,
    };
  }

  @Get("/categories/:id")
  async getCategoryProducts(@PathParams("id") id: string, @QueryParams() query: any) {
    const category = await this.productService.findOneCategory(
      slugify.default(id, { lower: true, strict: true })
    );

    if (!category) {
      return { success: false, message: `No product with category:${id}` };
    }

    // const products = await this.productService.findProductByCategory(
    //   category._id
    // );
    // console.log(query)
    let search = {}
    if(id !== 'all'){
      search = {
        category: category._id
      }
    }
    const filter = await this.productService.getFilteredProducts({...query, ...search})

    // if (!products || products.length === 0) {
    //   return {
    //     success: false,
    //     message: `No product with category:${category._id}`,
    //   };
    // }

    const prices = await this.productService.getMinMaxPrice()
    const sizes = await this.productService.getAllAvailableSizes()
    const colors = await this.productService.getAllAvailableColors()

    return {
      success: true,
      // products,
      filter: {prices, sizes, colors},
      products: filter
    };
  }

  @Get("/search")
  async getSearchProducts(@QueryParams() query: any) {
    const filter = await this.productService.getFilteredProducts(query)

    // if (!products || products.length === 0) {
    //   return {
    //     success: false,
    //     message: `No product with category:${category._id}`,
    //   };
    // }

    const prices = await this.productService.getMinMaxPrice()
    const sizes = await this.productService.getAllAvailableSizes()
    const colors = await this.productService.getAllAvailableColors()

    return {
      success: true,
      filter: {prices, sizes, colors},
      products: filter
    };
  }

  @Delete("/cart/:id")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async deleteProduct(@PathParams("id") id: string) {
    const cart = await this.cartService.deleteItem(id);

    if (!cart) {
      return { success: false, message: `No product with id : ${id}` };
    }

    return {
      success: true,
      message: "Product Deleted",
    };
  }
}
