// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  discount: { type: Number, default: 0 }, // نسبة الخصم
  description: String, // وصف المنتج
  image: String,
  category: String,
  views: { type: Number, default: 0 }, // عدد المشاهدات
  salesCount: { type: Number, default: 0 } // عدد المبيعات (اختياري)
});

module.exports = mongoose.model("Product", productSchema);