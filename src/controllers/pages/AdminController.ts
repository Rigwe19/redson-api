import { Controller, Inject } from "@tsed/di";
import { Authenticate } from "@tsed/passport";
import { Req } from "@tsed/platform-http";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { Delete, Get, Post, Returns, Security, Summary } from "@tsed/schema";
import { AdminOnly } from "src/decorators/AdminOnly.js";
import { RoleGuard } from "src/middlewares/RoleGuardMiddleware.js";
import { User } from "src/models/UserModel.js";
import { AdminService } from "src/services/AdminService.js";
import { OrderService } from "src/services/OrderService.js";
import { ProductService } from "src/services/ProductService.js";
import { UsersService } from "src/services/UsersService.js";

@Controller("/admin")
@Authenticate("jwt", { session: false })
@Security("jwt")
// @AdminOnly(RoleGuard)
export class AdminController {
  @Inject()
  private readonly adminService: AdminService;
  @Inject()
  private readonly usersService: UsersService;
  @Inject()
  private readonly productService: ProductService;
  @Inject()
  private readonly orderService: OrderService;

  @Get("/dashboard")
  @Returns(200, Object)
  async getDashboard() {
    const [metrics, salesTrend, weeklySales, topProducts, salesByCat, customerGrowth, orderVolume] =
      await Promise.all([
        this.adminService.getDashboardMetrics(),
        this.adminService.getMonthlySalesTrend(),
        this.adminService.getWeeklySalesTrend(),
        this.adminService.getTopSellingProducts(),
        this.adminService.getSalesByCategory(),
        this.adminService.getCustomerGrowth(),
        this.adminService.getOrderVolumeMonthly(),
      ]);

    return {
      ...metrics,
      salesTrend,
      weeklySales,
      topProducts,
      salesByCat,
      customerGrowth,
      orderVolume,
    };
  }
  @Get("/products")
  @Returns(200, Object)
  async getProducts() {
    const inventory = await this.adminService.getInventoryOverview()
    const categories = await this.productService.findAllCategory()
    const map = categories.map(cat => ({
      value: cat._id,
      label: cat.name
    }))
    return {
      products: inventory,
      categories: map
    };
  }
  @Get("/product")
  @Get("/product/:id")
  @Returns(200, Object)
  async getProduct(@PathParams("id") id: string) {
    let values = {
        colors: [],
        sizes: [],
        price: 0,
        inventory: 0,
        reorderLevel: 0
    }
    
    if(id){
      values = await this.productService.findOne(id);
    }
    const categories = await this.productService.findAllCategory()
    const map = categories.map(cat => ({
      value: cat._id,
      label: cat.name
    }))
    return {
      values,
      categories: map
    };
  }

  @Get("/orders")
  @Returns(200, Object)
  async getOrders() {
    const orders = await this.orderService.findAll();
    return { success: true, message: "Success", orders };
  }

  @Post("/process-order")
  @Returns(200, Object)
  async processOrder(@BodyParams("id") id: string, @BodyParams('status') status: string) {
    await this.orderService.update(id, {status});
    const order = await this.orderService.getOrderDetails(id);
    return { success: true, message: "Success", order };
  }

  @Get("/order/:id")
  @Returns(200, Object)
  async getOrder(@PathParams("id") id: string) {
    const order = await this.orderService.getOrderDetails(id);
    return { success: true, message: "Success", order };
  }

  @Get("/payments")
  @Returns(200, Object)
  async getPayments() {
    const payments = await this.adminService.findAllPayments();
    return { success: true, message: "Success", payments };
  }

  @Get("/payment/:id")
  @Returns(200, Object)
  async getPayment(@PathParams("id") id: string) {
    const payment = await this.orderService.getPaymentDetails(id);
    return { success: true, message: "Success", payment };
  }
  
  

  @Get("/totals")
  @Returns(200, Object)
  async getTotals() {
    const totals = await this.adminService.getTotals();
    return { success: true, message: "Success", totals };
  }

  @Get("/most-ordered")
  @(Returns(200, Object))
  async getMostOrdered() {
    const data = await this.adminService.getMostOrderedProducts();
    return { success: true, message: "Top products fetched", mostOrderedProducts: data };
  }

  @Get("/charts")
  @(Returns(200, Object))
  async getCharts() {
    const results = await this.adminService.getChartSales();
    return { success: true, message: "Chart data", results };
  }

  @Get("/users")
  @Summary("Get all users")
  @(Returns(200, Array).Of(User))
  async getUsers() {
    const users = await this.usersService.findAll();
    return {
      users,
      count: users.length,
    };
  }

  @Get("/users/:id")
  @Summary("Get single user")
  @(Returns(200, User))
  async getUser(@PathParams("id") id: string) {
    const user = await this.usersService.findById(id);
    return { user };
  }

  @Delete("/users/:id")
  @Summary("Delete a user")
  @(Returns(200, String).Description("User deleted successfully"))
  async deleteUser(@PathParams("id") id: string) {
    await this.usersService.deleteById(id, '');
    return {
      success: true,
      message: "User deleted successfully",
    };
  }

}
