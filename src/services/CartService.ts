import {Inject, Injectable} from "@tsed/di";
import { Model } from "mongoose";
import { Cart } from "src/models/CartModel.js";
import { CartItem } from "src/models/CartItemModel.js";
// import {MongooseModel} from "@tsed/mongoose";

@Injectable()
export class CartService {
@Inject(Cart) private readonly cart: Model<Cart>;
@Inject(CartItem) private readonly cartItem: Model<CartItem>;
  async create(user_id: string, body: any): Promise<{cart: Cart, item: CartItem}> {
    const cart = await this.cart.findOneAndUpdate({
        user_id
    },
    // { $setOnInsert: {name: "Dohn Joe"} },
    {},
    {new: true, upsert: true})
    const item = await this.cartItem.create(body);
    return {
        cart,
        item
    }
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

  async deleteCart(query:string): Promise<boolean | null> {
    await this.cart.findByIdAndDelete({ _id: query });

    // Delete all related cart items
    await this.cartItem.deleteMany({ cart_id: query });

    return true
  }

  async deleteItem(query:string): Promise<boolean | null> {
    const item = await this.cartItem.findByIdAndDelete({ _id: query });
    return item !== null;
  }
}
