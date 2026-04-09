const BASE_URL = "http://localhost:3000"; // رابط السيرفر بتاعك

// 1. دالة المزامنة (تعديل الرابط ليتوافق مع السيرفر)
async function syncWithServer(cart) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.email) {
        try {
            // غيرنا update-cart لـ add-to-cart عشان السيرفر يفهمها
            await fetch(`${BASE_URL}/add-to-cart`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, product: cart }) // السيرفر مستني كلمة product أو تعدلها لـ cart حسب السيرفر
            });
            console.log("Cart synced with database ✅");
        } catch (err) { 
            console.log("Sync error:", err); 
        }
    }
}

// 2. تحديث رقم السلة (بدون تغيير)
function updateBadge() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((total, item) => total + (Number(item.qty) || 0), 0);
    const badge = document.querySelector(".cart-count");
    if (badge) { badge.innerText = count; }
}

// 3. إضافة منتج
function addToCart(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const finalPrice = Number(price);
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ id: id, name: name, price: finalPrice, image: image, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    syncWithServer(cart);
    updateBadge(); 
    alert(`Added ${name} to cart! ✅`);
}

// 4. عرض المنتجات (هنا حل مشكلة ظهور الصور)
function loadCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const container = document.getElementById("cartItems");
    const totalEl = document.getElementById("total");
    
    if (!container) return;
    container.innerHTML = "";
    let total = 0;
    
    cart.forEach((item, index) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.qty) || 1;
        total += price * qty;
        
        // تعديل مسار الصورة عشان يقرأ من السيرفر صح
        let imageSrc = item.image;
        if (imageSrc && imageSrc.startsWith('/uploads')) {
            imageSrc = BASE_URL + imageSrc;
        }

        container.innerHTML += `
            <div class="cart-item">
                <img src="${imageSrc}" alt="${item.name}" style="width:80px; height:80px; object-fit:cover;">
                <div>
                    <h4>${item.name}</h4>
                    <p>${price} EGP x ${qty}</p>
                </div>
                <button onclick="removeItem(${index})">❌ Remove</button>
            </div>`;
    });
    
    if (totalEl) totalEl.innerText = total + " EGP";
}

// 5. حذف منتج
function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    
    syncWithServer(cart);
    loadCart();
    updateBadge(); 
}

document.addEventListener("DOMContentLoaded", () => {
    updateBadge();
    loadCart(); // تأكد إن السلة بتتحمل أول ما الصفحة تفتح
});