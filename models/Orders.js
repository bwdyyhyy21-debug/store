const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    // معلومات العميل (Email & Phone)
    customerInfo: {
        email: { type: String, required: true },
        phone: { type: String, required: true }
    },
    // معلومات الشحن (Name & Address)
    shippingInfo: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        country: { type: String, required: true },
        address: { type: String, required: true }
    },
    // المنتجات اللي في السلة
    items: [
        {
            name: String,
            price: Number,
            qty: Number
        }
    ],
    // الإجمالي وطريقة الدفع
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: "cash" },
    
    // حالة الطلب (Pending -> Shipped)
    status: { 
        type: String, 
        default: "Pending" 
    },
    
    // موعد التوصيل اللي الأدمن بيحدده
    deliveryTime: { 
        type: String, 
        default: "Not set yet" 
    },
    
    // تاريخ إنشاء الطلب
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model("Order", orderSchema);