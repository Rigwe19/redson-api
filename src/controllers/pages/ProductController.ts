import { Controller, Inject } from "@tsed/di";
import { Authenticate } from "@tsed/passport";
import { MultipartFile, PlatformMulterFile, Req } from "@tsed/platform-http";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { Delete, Get, Post, Put, Security } from "@tsed/schema";
import fs from "fs";
import { Product } from "src/models/ProductModel.js";
import { CloudinaryService } from "src/services/CloudinaryService.js";
import { ProductService } from "src/services/ProductService.js";
import slugify from "slugify";
import { User } from "src/models/UserModel.js";
import { CartService } from "src/services/CartService.js";
// import { slugify } from "voca";
// import { snake } from 'case';

@Controller("/product")
export class ProductController {
  @Inject()
  private readonly productService: ProductService;
  @Inject()
  private readonly cartService: CartService;
  @Inject()
  private readonly cloudinary: CloudinaryService;
  @Post("/create")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async createProduct(
    @MultipartFile("files") files: PlatformMulterFile[],
    @BodyParams() body: any,
    @BodyParams("sizes") sizes: string[],
    @BodyParams("colors") colors: string[]
  ) {
    const product = body as Product;
    product.sizes = JSON.parse(typeof sizes !== 'string' ? sizes : JSON.parse(sizes));
    product.colors = JSON.parse(typeof colors !== 'string' ? colors : JSON.parse(colors));
    const urls = [];
    for (const file of files) {
      const { path } = file;
      const newPath = await this.cloudinary.uploadToCloudinary(path, "vita");
      if (!newPath) {
        return {
          success: false,
        };
      }
      urls.push({
        url: newPath.url,
        public_id: newPath.public_id,
      });
      fs.unlinkSync(path);
    }

    product.images = urls;
    product.slug = slugify.default(product.name, { lower: true, strict: true })
    console.log(product.slug, typeof product.sizes, typeof product.colors);
    const save = await this.productService.create(product);
    // const product = await Product.create(product);
    return {
      success: true,
      product: save,
    };
  }

  @Get("/")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async allProducts() {
    const products = await this.productService.findAll();
    return {
      success: true,
      products,
    };
  }

  @Put("/")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async updateProduct(
    @MultipartFile("files") files: PlatformMulterFile[],
    @BodyParams() input: Product
  ) {
    const urls = [];
    for (const file of files) {
      const { path } = file;
      const newPath = await this.cloudinary.uploadToCloudinary(path, "vita");
      if (!newPath) {
        return {
          success: false,
        };
      }
      urls.push({
        url: newPath.url,
        public_id: newPath.public_id,
      });
      fs.unlinkSync(path);
    }

    input.images = urls;
    const product = this.productService.update(input._id, input);
    return {
      success: true,
      product,
    };
  }

  @Post("/add/cart")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async addCart(
    @BodyParams("product_id") product_id: string,
    @Req("user") user: User,
    @BodyParams("quantity") quantity: number = 1,
    @BodyParams("color") color: string = "",
    @BodyParams("size") size: string = "",
) {
    const product = await this.productService.findOne({ _id: product_id });

    if (!product) {
      return { success: false, message: `No product with id : ${product_id}` };
    }

    this.cartService.create(user._id,{
      product_id,
      quantity,
      color,
      size
    });

    return {
      success: true,
      message: "Product added to cart",
    };
    
  }

  @Get("/:id")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async getSingleProduct(@PathParams("id") id: string) {
    const product = await this.productService.findOne({ id });

    if (!product) {
      return { success: false, message: `No product with id : ${id}` };
    }

    return {
      success: true,
      product,
    };
  }

  @Delete("/:id")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async deleteProduct(@PathParams("id") id: string) {
    const product = await this.productService.delete(id);

    if (!product) {
      return { success: false, message: `No product with id : ${id}` };
    }

    return {
      success: true,
      message: "Product Deleted",
    };
  }
}
