// ================= الإعدادات الأساسية =================
const API_URL = "http://localhost:3000";

// تعريف الترجمة محلياً
const translations = {
    confirmDel: "Are you sure you want to delete this product? | هل أنت متأكد من حذف المنتج؟",
    successDel: "Product Deleted ✅ | تم حذف المنتج",
    serverError: "Server Connection Error ❌ | خطأ في الاتصال بالسيرفر"
};

// ================= 1. نشر المنتج =================
async function publishProduct(event) {
    if(event) event.preventDefault();

    const nameInput = document.getElementById("name");
    const priceInput = document.getElementById("price");
    const descInput = document.getElementById("desc");
    const categorySelect = document.getElementById("categorySelect");
    const fileInput = document.getElementById("imageFile");

    if (!nameInput || !priceInput || !fileInput) return alert("Missing Elements! ❌");

    const file = fileInput.files[0];
    if (!nameInput.value || !priceInput.value || !file) {
        return alert("Please fill Name, Price, and Image! ⚠️");
    }

    try {
        // 1. رفع الصورة أولاً
        const fd = new FormData();
        fd.append("image", file);
        const imgRes = await fetch(`${API_URL}/upload`, { method: "POST", body: fd });
        const imgData = await imgRes.json();

        // 2. حفظ المنتج بالبيانات ورابط الصورة
        const response = await fetch(`${API_URL}/add-product`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ 
                name: nameInput.value, 
                price: Number(priceInput.value), 
                description: descInput.value, 
                category: categorySelect.value, 
                image: imgData.imageUrl 
            })
        });

        if (response.ok) {
            alert("Product Published Successfully! 🚀");
            location.reload();
        }
    } catch (err) { 
        console.error(err);
        alert("Server Error ❌"); 
    }
}

// ================= 2. عرض المنتجات =================
async function loadAdminData() {
    try {
        const res = await fetch(`${API_URL}/products`);
        const products = await res.json();
        
        const totalCount = document.getElementById("totalCount");
        if(totalCount) totalCount.innerText = products.length;

        const container = document.getElementById("adminProducts");
        if(!container) return;

        container.innerHTML = products.map(p => `
            <div class="admin-card" style="display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #eee; background: white; margin-bottom: 5px; border-radius: 8px;">
                <img src="${API_URL}${p.image}" onerror="this.src='https://via.placeholder.com/60'" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">
                
                <div style="flex: 1; margin-left: 15px;">
                    <h4 style="margin: 0;">${p.name}</h4>
                    <span style="font-weight: bold;">${p.price} EGP</span>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button onclick="deleteProduct('${p._id}')" style="background: white; color: #e53e3e; border: 1px solid #e53e3e; padding: 8px 15px; border-radius: 5px; cursor: pointer;">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (err) { console.error(err); }
}

// ================= 3. حذف المنتج =================
async function deleteProduct(id) {
    if(!confirm(translations.confirmDel)) return;
    
    try {
        const res = await fetch(`${API_URL}/delete-product/${id}`, { method: "DELETE" });
        if (res.ok) { 
            alert(translations.successDel); 
            loadAdminData(); 
        } else {
            alert("Delete failed ❌");
        }
    } catch (err) { alert(translations.serverError); }
}

// ================= تهيئة البيانات عند التحميل =================
document.addEventListener("DOMContentLoaded", () => {
    // تحميل الأقسام في القائمة المنسدلة
    fetch(`${API_URL}/categories`)
        .then(res => res.json())
        .then(cats => {
            const select = document.getElementById("categorySelect");
            if(select) {
                select.innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            }
        });

    loadAdminData();
});

// ربط الدوال بالـ Window
window.addProduct = publishProduct;
window.deleteProduct = deleteProduct;