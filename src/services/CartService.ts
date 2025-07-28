import { Inject, Injectable } from "@tsed/di";
import { Model } from "mongoose";
import { Cart } from "src/models/CartModel.js";
import { CartItem } from "src/models/CartItemModel.js";
// import {MongooseModel} from "@tsed/mongoose";

@Injectable()
export class CartService {
  @Inject(Cart) private readonly cart: Model<Cart>;
  @Inject(CartItem) private readonly cartItem: Model<CartItem>;
  async create(
    user_id: string,
    body: any
  ): Promise<{ cart: Cart; item: CartItem }> {
    const cart = await this.cart.findOneAndUpdate(
      {
        user_id,
      },
      // { $setOnInsert: {name: "Dohn Joe"} },
      {},
      { new: true, upsert: true }
    );
    const { product_id, ...rest } = body;
    const item = await this.cartItem.findOneAndUpdate(
      {
        product_id,
        cart_id: cart._id,
      },
      rest,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    // create({...body, cart_id: cart._id});
    return {
      cart,
      item,
    };
  }
  async findOne(query: any): Promise<Cart | undefined | null> {
    return await this.cart.findOne(query);
  }
  async findAll(): Promise<Cart[]> {
    return await this.cart.find().sort({ createdAt: -1 });
  }
  async update(query: string, body: any): Promise<Cart | null> {
    return await this.cart.findOneAndUpdate({ _id: query }, body, {
      new: true,
      runValidators: true,
    });
  }

  async deleteCart(query: string): Promise<boolean | null> {
    await this.cart.findByIdAndDelete({ _id: query });

    // Delete all related cart items
    await this.cartItem.deleteMany({ cart_id: query });

    return true;
  }

  async deleteItem(query: string): Promise<boolean | null> {
    const item = await this.cartItem.findByIdAndDelete({ _id: query });
    return item !== null;
  }
  async findItem(query: any): Promise<any[] | null> {
    const items = await this.cartItem
      .find(query)
      .populate("product_id", "name price slug images");

    return items.map((item) => {
      const product = item.product_id as any;
      return {
        id: item._id,
        product_id: product._id,
        name: product.name,
        image: product.images?.[0].url || null,
        price: product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        slug: product.slug,
      };
    });
  }
  findItemWithProduct(cartId: string) {
    return this.cartItem.find({ cart_id: cartId }).populate("product_id");
  }
  async quantity(id: string, delta: number) {
    const doc = await this.cartItem.findById(id);
    // console.log(doc)
    if (!doc) {
      throw new Error("Quantity cannot be negative");
    }
    if (doc.quantity + delta < 1) {
      throw new Error("Quantity cannot be negative");
    }
    return this.cartItem.findByIdAndUpdate(
      id,
      { $inc: { quantity: delta } },
      { new: true }
    );
  }
}
