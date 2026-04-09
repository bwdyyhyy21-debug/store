const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer"); 

// استيراد موديل الأقسام
const Category = require("./models/Category"); 
const app = express();

app.use(cors());
app.use(express.json()); 

// إعداد مجلد الصور - مهم جداً لظهور الصور في الكارت والموقع
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) { fs.mkdirSync(uploadsPath); }
app.use("/uploads", express.static(uploadsPath));

/* ================= Multer CONFIG ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsPath),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

/* ================= DATABASE MODELS ================= */

// موديل المستخدمين
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  code: { type: String, default: "" },
  role: { type: String, default: "user" }, // 'user' or 'admin'
  cart: { type: Array, default: [] } 
});
const User = mongoose.model("User", userSchema);

// موديل المنتجات
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  discount: { type: Number, default: 0 },
  description: String,
  image: String,
  category: String,
  views: { type: Number, default: 0 } 
});
const Product = mongoose.model("Product", productSchema);

// موديل الطلبات
const orderSchema = new mongoose.Schema({
  customerInfo: Object,
  shippingInfo: Object,
  items: Array,
  total: Number,
  paymentMethod: { type: String, default: "Cash on Delivery" },
  status: { type: String, default: "Pending" },
  deliveryTime: { type: String, default: "Not set yet" },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// موديل التعليقات
const feedbackSchema = new mongoose.Schema({
  productId: String,
  user: String,
  comment: String,
  date: { type: Date, default: Date.now }
});
const Feedback = mongoose.model("Feedback", feedbackSchema);

/* ================= DB CONNECTION ================= */
const MONGO_URI = "mongodb://127.0.0.1:27017/store"; 

mongoose.connect(MONGO_URI)
.then(() => console.log("🔥 DB Connected Successfully and Cleanly"))
.catch(err => console.error("❌ DB Error:", err.message));

/* ================= EMAIL CONFIG ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pureguardstore@gmail.com",
    pass: "ccljgqvubkuydvlk"
  }
});

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ================= ROUTES ================= */

// رفع الصور
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// المنتجات
app.post("/add-product", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(200).json({ message: "Product Saved ✅" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/products", async (req, res) => {
  try { 
    const products = await Product.find();
    res.status(200).json(products); 
  }
  catch (err) { res.status(500).json({ message: "Error fetching products" }); }
});

app.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) { res.status(500).json({ message: "Error fetching product" }); }
});

/* ================= AUTH ROUTES ================= */

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "Email already exists" });

    const code = generateCode();
    const user = new User({ username, email, password, code });
    await user.save();

    await transporter.sendMail({
      from: '"Pure Guard Store" <pureguardstore@gmail.com>',
      to: email,
      subject: "Verify your account",
      text: `Your verification code is: ${code}`
    });
    res.json({ message: "Verification code sent 📩" });
  } catch (err) { res.status(500).json({ message: "Registration Error" }); }
});

app.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.findOne({ $or: [{ email: login }, { username: login }] });

    if (!user || user.password !== password) return res.status(401).json({ message: "Wrong Credentials ❌" });
    if (!user.isVerified) return res.status(403).json({ message: "Please verify your email first" });

    res.json({
      user: { username: user.username, email: user.email, role: user.role, cart: user.cart }
    });
  } catch (err) { res.status(500).json({ message: "Login Error" }); }
});

/* ================= CART ROUTES (تعديل لظهور الصور) ================= */

app.post("/add-to-cart", async (req, res) => {
  const { email, product } = req.body; 
  try {
    // التأكد من أن المنتج يحتوي على الصورة
    const user = await User.findOneAndUpdate(
      { email },
      { $push: { cart: product } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Product added to cart ✅", cart: user.cart });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/get-cart/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(200).json([]); // نرجع مصفوفة فاضية بدل Error عشان الـ Frontend ميعملش Crash
    res.json(user.cart || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/clear-cart", async (req, res) => {
  const { email } = req.body;
  try {
    await User.findOneAndUpdate({ email }, { cart: [] });
    res.json({ message: "Cart cleared" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ================= CATEGORIES ROUTES ================= */

app.get("/categories", async (req, res) => {
    try { 
      const categories = await Category.find();
      res.status(200).json(categories); 
    } 
    catch (err) { res.status(500).json({ msg: "Error fetching categories" }); }
});

app.post("/add-category", async (req, res) => {
    try {
        const newCat = new Category(req.body);
        await newCat.save();
        res.status(201).json({ message: "Category Added Successfully ✅" });
    } catch (err) { res.status(500).json({ message: "Error adding category" }); }
});

/* ================= ADMIN MANAGEMENT ROUTES ================= */

app.get("/admin/list-admins", async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" });
    res.status(200).json(admins || []);
  } catch (err) { res.status(500).json({ message: "Error fetching admins" }); }
});

app.post("/admin/make-admin", async (req, res) => {
  try {
    const { email } = req.body;
    const updatedUser = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Admin promoted successfully ✅" });
  } catch (err) { res.status(500).json({ message: "Error promoting admin" }); }
});

/* ================= ORDER & ANALYTICS ROUTES ================= */

app.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders || []);
  } catch (err) { res.status(500).json({ message: "Error fetching orders" }); }
});

app.post("/place-order", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(200).json({ message: "Order Placed Successfully! 📦" });
  } catch (err) { res.status(500).json({ message: "Order Failed" }); }
});

/* ================= SERVER START ================= */
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));