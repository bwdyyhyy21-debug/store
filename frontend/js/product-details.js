const API_URL = "http://localhost:3000";
let currentProduct = null;

// دالة جلب بيانات المنتج وعرضها
async function getProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    // لو مفيش ID في العنوان، نرجعه للرئيسية
    if (!id) {
        alert("Product ID not found!");
        window.location.href = "index.html";
        return;
    }

    try {
        // نطلب البيانات من السيرفر باستخدام المسار اللي صلحناه في server.js
        const res = await fetch(`${API_URL}/product/${id}`);
        
        // لو السيرفر رجع 404 أو أي خطأ
        if (!res.ok) throw new Error("Product not found in database");

        currentProduct = await res.json();

        // توزيع البيانات على عناصر الصفحة للتأكد إن "Error loading product" تختفي
        const nameEl = document.getElementById('productName');
        const priceEl = document.getElementById('productPrice');
        const descEl = document.getElementById('productDesc');
        const catEl = document.getElementById('productCategory');

        if (nameEl) nameEl.innerText = currentProduct.name;
        if (priceEl) priceEl.innerText = currentProduct.price + " EGP";
        if (descEl) descEl.innerText = currentProduct.description || "No description available.";
        if (catEl) catEl.innerText = currentProduct.category || "General Collection";
        
        // تصحيح مسار الصورة
        const imgEl = document.getElementById('mainImage');
        if (imgEl) {
            // لو الصورة مسارها نسبي، بنضيف عنوان السيرفر قبلها
            imgEl.src = currentProduct.image.startsWith('http') ? currentProduct.image : `${API_URL}${currentProduct.image}`;
            imgEl.onerror = () => imgEl.src = 'https://via.placeholder.com/600'; // صورة احتياطية لو المسار باظ
        }

        // تفعيل زرار الإضافة للكارت
        const addBtn = document.getElementById('addBtn');
        if (addBtn) {
            addBtn.onclick = () => {
                addToCart(currentProduct._id, currentProduct.name, currentProduct.price, currentProduct.image);
            };
        }

        // تحميل التعليقات الخاصة بهذا المنتج
        loadFeedbacks(id);

    } catch (err) {
        console.error("Fetch Error:", err);
        const nameEl = document.getElementById('productName');
        if (nameEl) nameEl.innerText = "Error loading product details.";
    }
}

// دالة إضافة المنتج للسلة (localStorage)
function addToCart(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const itemIndex = cart.findIndex(item => item.id === id);
    
    if (itemIndex > -1) {
        cart[itemIndex].qty += 1;
    } else {
        cart.push({ id, name, price, image, qty: 1 });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    
    // تحديث الرقم اللي على الكارت لو موجود في الصفحة
    const badge = document.querySelector(".cart-count");
    if (badge) {
        const totalQty = cart.reduce((total, item) => total + item.qty, 0);
        badge.innerText = totalQty;
    }
    
    alert(`Added ${name} to cart ✅`);
}

// دالة إضافة تعليق جديد
async function postFeedback() {
    const input = document.getElementById('fbInput');
    if (!input) return;
    
    const comment = input.value.trim();
    
    // التحقق من تسجيل الدخول من الـ localStorage
    const userObj = JSON.parse(localStorage.getItem("user"));
    
    if (!userObj) {
        alert("Please login first to post a feedback!");
        return;
    }

    const username = userObj.username;

    if (!comment) return alert("Please write something!");

    try {
        const res = await fetch(`${API_URL}/add-feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                productId: currentProduct._id, 
                user: username, 
                comment: comment 
            })
        });

        if (res.ok) {
            input.value = "";
            loadFeedbacks(currentProduct._id); // تحديث قائمة التعليقات فوراً
        } else {
            alert("Failed to post feedback");
        }
    } catch (err) { 
        console.error("Feedback Error:", err);
        alert("Server is down!");
    }
}

// دالة تحميل التعليقات وعرضها
async function loadFeedbacks(productId) {
    try {
        const res = await fetch(`${API_URL}/feedbacks/${productId}`);
        if (!res.ok) return;

        const feedbacks = await res.json();
        const list = document.getElementById('feedbackList');
        if (!list) return;

        if (feedbacks.length === 0) {
            list.innerHTML = `<p style="color: #718096;">No reviews yet. Be the first!</p>`;
            return;
        }

        list.innerHTML = feedbacks.map(f => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0; margin-bottom: 10px;">
                <strong style="color: #2d3748; display: block; font-size: 0.9rem;">
                    <i class="fas fa-user-circle"></i> ${f.user}
                </strong>
                <p style="margin: 5px 0; color: #4a5568; font-size: 0.95rem;">${f.comment}</p>
                <small style="color: #a0aec0; font-size: 0.75rem;">${new Date(f.date).toLocaleDateString()}</small>
            </div>
        `).join('');
    } catch (err) {
        console.error("Load Feedbacks Error:", err);
    }
}

// تشغيل الدالة الأساسية عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", getProduct);