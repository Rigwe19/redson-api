import { Controller, Inject } from "@tsed/di";
import { Authenticate } from "@tsed/passport";
import { MultipartFile, Req } from "@tsed/platform-http";
import { type PlatformMulterFile } from "@tsed/platform-multer";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { Delete, Get, Post, Put, Security } from "@tsed/schema";
import fs from "fs";
import { Product } from "src/models/ProductModel.js";
import { CloudinaryService } from "src/services/CloudinaryService.js";
import { ProductService } from "src/services/ProductService.js";
import slugify from "slugify";
import { User } from "src/models/UserModel.js";
import { CartService } from "src/services/CartService.js";
import { CategoryDto, CategoryResponseDto } from "src/DTO/CategoryDto.js";
import { ObjectID } from "@tsed/mongoose";
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
    @BodyParams("colors") colors: string[],
    @BodyParams("variants") variants: string[],
  ) {
    const product = body as Product;
    product.sizes = JSON.parse(
      typeof sizes !== "string" ? sizes : JSON.parse(sizes)
    );
    product.colors = JSON.parse(
      typeof colors !== "string" ? colors : JSON.parse(colors)
    );
    product.variants = JSON.parse(
      typeof variants !== "string" ? variants : JSON.parse(variants)
    );
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
    // const urls = [
    //   {
    //     url: "http://res.cloudinary.com/doo3lgzyb/image/upload/v1752166777/vita/rvaiqrxcpkmbwqvget2q.png",
    //     public_id: "vita/rvaiqrxcpkmbwqvget2q",
    //   },
    //   {
    //     url: "http://res.cloudinary.com/doo3lgzyb/image/upload/v1752166773/vita/znavna1jhh0igfiibtxg.png",
    //     public_id: "vita/znavna1jhh0igfiibtxg",
    //   },
    //   {
    //     url: "http://res.cloudinary.com/doo3lgzyb/image/upload/v1752166780/vita/uor1dfspdguviabazxpm.png",
    //     public_id: "vita/uor1dfspdguviabazxpm",
    //   },
    // ];

    product.images = urls;
    product.slug = slugify.default(product.name, { lower: true, strict: true });

    const save = await this.productService.create(product);
    // const product = await Product.create(product);
    return {
      success: true,
      product: save,
    };
  }

  @Post("/create/category")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async createCategory(
    @BodyParams() body: CategoryDto
  ): Promise<CategoryResponseDto> {
    const slug = slugify.default(body.name, {
      lower: true,
      strict: true,
    });
    await this.productService.createCategory({ ...body, slug });
    const categories = await this.productService.findAllCategory();
    return {
      success: true,
      categories,
    };
  }

  @Get("/")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async allProducts() {
    const products = await this.productService.findAll({});
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
    @BodyParams() input: any
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

  @Get("/:id")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async getSingleProduct(@PathParams("id") id: string) {
    const product = await this.productService.findOne(id);
    console.log(id)
    if (!product) {
      return { success: false, message: `No product with id:${id}` };
    }

    return {
      success: true,
      product,
    };
  }

  @Get("/categories/:id")
  @Authenticate("jwt", { session: false })
  @Security("jwt")
  async getProductByCategory(@PathParams("id") id: string) {
    const category = await this.productService.findOneCategory(slugify.default(id, {lower: true, strict: true}));
    
    if (!category) {
      return { success: false, message: `No product with category:${id}` };
    }

    const products = await this.productService.findProductByCategory(category._id);
    
    if (!products || products.length === 0) {
      return { success: false, message: `No product with category:${category._id}` };
    }

    return {
      success: true,
      products,
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
