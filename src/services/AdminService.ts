import { Inject, Injectable } from "@tsed/di";
import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfYear,
  getDay,
  getWeek,
  getMonth,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { Model } from "mongoose";
import { OrderItem } from "src/models/OrderItemModel.js";
import { Order } from "src/models/OrderModel.js";
import { Product } from "src/models/ProductModel.js";
import { Transaction } from "src/models/TransactionModel.js";
import { User } from "src/models/UserModel.js";

@Injectable()
export class AdminService {
  @Inject(Order) private readonly order: Model<Order>;
  @Inject(OrderItem) private readonly orderItem: Model<OrderItem>;
  @Inject(User) private readonly user: Model<User>;
  @Inject(Product) private readonly product: Model<Product>;
  @Inject(Transaction) private readonly payment: Model<Transaction>;
  async getTotals() {
    const now = new Date();
    const start = startOfWeek(now);
    const end = endOfWeek(now);

    const [totalSalesAmount] = await this.order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalOrders = await this.order.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    const [totalProductsSold] = await this.order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$products" },
      { $group: { _id: null, total: { $sum: "$products.quantity" } } },
    ]);

    const totalNewCustomers = await this.user.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    return {
      totalSalesAmount: totalSalesAmount?.total || 0,
      totalOrders,
      totalProductsSold: totalProductsSold?.total || 0,
      totalNewCustomers,
    };
  }

  async getMostOrderedProducts() {
    const orders = await this.order.find({});
    const products: Record<string, any> = {};

    orders.forEach((order: any) => {
      order?.product?.forEach((product: any) => {
        if (products[product.name]) {
          products[product.name].quantity += product.quantity;
        } else {
          products[product.name] = {
            quantity: product.quantity,
            image: product.image,
            price: product.price,
          };
        }
      });
    });

    const sorted = Object.entries(products).sort(
      (a, b) => b[1].quantity - a[1].quantity
    );
    return sorted.slice(0, 5).map(([name, data]) => ({ name, ...data }));
  }

  async getChartSales() {
    const timeframes = ["daily", "weekly", "monthly"];
    const results: Record<string, any> = {};
    const now = new Date();

    for (const timeframe of timeframes) {
      let groupByFn: (date: Date) => string;
      let start: Date;
      let xAxis: string[];

      switch (timeframe) {
        case "daily":
          start = startOfWeek(now);
          xAxis = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          groupByFn = (date) => getDay(date).toString();
          break;
        case "weekly":
          start = subWeeks(now, 4);
          xAxis = Array.from({ length: 5 }, (_, i) => `Week ${i + 1}`);
          groupByFn = (date) => getWeek(date).toString();
          break;
        case "monthly":
          start = startOfYear(now);
          xAxis = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          groupByFn = (date) => getMonth(date).toString();
          break;
        default:
          continue;
      }

      const sales = await this.order.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const series = xAxis.map(() => 0);

      sales.forEach((item: any) => {
        const groupIndex = (() => {
          const date = new Date(item._id);
          const key = groupByFn(date);
          return xAxis.findIndex(
            (label, index) => index.toString() === key || label.includes(key)
          );
        })();

        if (groupIndex >= 0) {
          series[groupIndex] += item.total;
        }
      });

      results[timeframe] = {
        xAxis,
        series,
      };
    }

    return results;
  }

  async getDashboardMetrics() {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));

    // Total Sales
    const [currentSales, lastMonthSales] = await Promise.all([
      this.order.aggregate([
        { $match: { createdAt: { $gte: startOfCurrentMonth } } },
        { $group: { _id: null, total: { $sum: "$subtotal" } } },
      ]),
      this.order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$subtotal" } } },
      ]),
    ]);
    const totalSales = currentSales[0]?.total || 0;
    const salesGrowth = this.percentageChange(
      lastMonthSales[0]?.total || 0,
      totalSales
    );

    // Total Orders
    const [ordersThisMonth, ordersLastMonth] = await Promise.all([
      this.order.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
      this.order.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth },
      }),
    ]);
    const ordersGrowth = this.percentageChange(
      ordersLastMonth,
      ordersThisMonth
    );

    // Total Customers
    const [customersThisMonth, customersLastMonth] = await Promise.all([
      this.user.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
      this.user.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth },
      }),
    ]);
    const customersGrowth = this.percentageChange(
      customersLastMonth,
      customersThisMonth
    );

    // Average Order Value
    const avgOrderValue = totalSales / (ordersThisMonth || 1);
    const lastMonthAvgOrderValue =
      (lastMonthSales[0]?.total || 0) / (ordersLastMonth || 1);
    const avgOrderValueGrowth = this.percentageChange(
      lastMonthAvgOrderValue,
      avgOrderValue
    );

    return {
      totalSales: { value: totalSales, ...salesGrowth },
      totalOrders: { value: ordersThisMonth, ...ordersGrowth },
      customers: { value: customersThisMonth, ...customersGrowth },
      avgOrderValue: { value: avgOrderValue, ...avgOrderValueGrowth },
    };
  }

  async getMonthlySalesTrend(months = 6) {
    const from = startOfMonth(subMonths(new Date(), months - 1));
    const results = await this.order.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return results;
  }

  async getWeeklySalesTrend() {
    const today = new Date();
    const start = startOfDay(subMonths(today, 0));
    const results = await this.order.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          total: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return results;
  }

  async getTopSellingProducts(limit = 5) {
    const products = await this.orderItem.aggregate([
      {
        $group: {
          _id: "$product_id",
          totalQty: { $sum: "$quantity" },
          totalRevenue: { $sum: { $multiply: ["$quantity", "$unit_price"] } },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          product: "$product",
          totalQty: 1,
          totalRevenue: 1,
        },
      },
    ]);

    return products;
  }

  async getSalesByCategory() {
    return this.orderItem.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category_id",
          total: { $sum: { $multiply: ["$quantity", "$unit_price"] } },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          _id: 0,
          category: "$category.name",
          total: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);
  }

  async getOrderVolumeMonthly(months = 6) {
    const from = startOfMonth(subMonths(new Date(), months - 1));
    return this.order.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getCustomerGrowth(months = 6) {
    const from = startOfMonth(subMonths(new Date(), months - 1));
    return this.user.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getInventoryOverview() {
    const products = await this.product.find().lean();

    const inventory = products.map((product) => {
      let status = "good";
      if (product.inventory < (product.reorderLevel ?? 5)) {
        status = "low";
      } else if (product.inventory < (product.reorderLevel ?? 5) * 0.75) {
        status = "critical";
      }

      return {
        name: product.name,
        currentStock: `${product.inventory} pcs`,
        reorderLevel: `${product.reorderLevel ?? 5} pcs`,
        status,
        price: product.price,
      };
    });

    const totalItems = inventory.length;
    const lowStock = inventory.filter(
      (item) => item.status === "Low" || item.status === "Critical"
    ).length;
    const stockValue = inventory.reduce((sum, item) => {
      const quantity = parseFloat(item.currentStock);
      return sum + quantity * item.price;
    }, 0);

    return {
      totalItems,
      lowStock,
      stockValue,
      currentInventory: inventory,
    };
  }


    async findAllPayments(query?: string): Promise<any[]> {
      if (!query) {
        const payments = await this.payment
          .find()
          .sort({ createdAt: -1 })
          .populate("user_id", "firstName lastName")
          .lean();
  
        return payments.map((payment) => {
          const user = payment.user_id as User;
          return {
            id: payment._id,
            status: payment.status,
            total: payment.amount,
            customer: `${user?.firstName || ""} ${user?.lastName || ""}`,
            order_id: payment.order_id,
            payment_id: payment._id
          };
        });
      }
      // console.log(this.model)
      return await this.payment.find({ user: query }).sort({ createdAt: -1 });
    }
  

  private percentageChange(
    oldValue: number,
    newValue: number
  ): { change: number; sign: string; formattedValue: string } {
    // if (oldValue === 0) return 100;
    // const value = ((newValue - oldValue) / oldValue) * 100;
    // return value > 0 ? "+"+ value : value
    const value =
      oldValue === 0
        ? newValue > 0
          ? 100
          : -100
        : ((newValue - oldValue) / oldValue) * 100;
    return {
      change: Math.abs(value),
      sign: value >= 0 ? "positive" : "negative",
      formattedValue: (value >= 0 ? "+" : "") + value,
    };
  }
}
