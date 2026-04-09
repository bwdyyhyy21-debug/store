// ================= الإعدادات الأساسية =================
const API_URL = "http://localhost:3000";

// ================= 1. إضافة قسم جديد =================
async function createCategory() {
    const nameInput = document.getElementById("catNameInput");
    if (!nameInput) return; // تأكد من وجود العنصر
    
    const name = nameInput.value.trim();

    if (!name) {
        alert("اكتب اسم القسم الأول! ⚠️");
        return;
    }

    try {
        // [تعديل] غيرنا /add-category لـ /categories عشان يطابق السيرفر
        const res = await fetch(`${API_URL}/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name })
        });

        if (res.ok) {
            nameInput.value = ""; 
            fetchCategories(); 
            alert("Category Added Successfully ✅");
        } else {
            const errorData = await res.json();
            alert("Server Error: " + (errorData.message || res.status));
        }
    } catch (err) {
        console.error(err);
        alert("السيرفر مش شغال! ❌");
    }
}

// ================= 2. تحميل وعرض الأقسام =================
async function fetchCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        const cats = await res.json();
        const list = document.getElementById("categoriesList");
        
        if (!list) return;

        if (cats.length === 0) {
            list.innerHTML = "<p style='text-align:center; color:#888;'>No categories available.</p>";
            return;
        }

        list.innerHTML = cats.map(c => `
            <div class="admin-card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #fff; margin-bottom: 10px; border-radius: 8px; border: 1px solid #eee;">
                <span><i class="fas fa-folder" style="color:#4a5568; margin-right: 10px;"></i> ${c.name}</span>
                <button onclick="deleteCategory('${c._id}')" style="color:red; border:1px solid red; background:none; padding:5px 10px; border-radius:5px; cursor:pointer; transition: 0.3s;">Delete</button>
            </div>
        `).join('');
    } catch (err) {
        console.error("Error loading categories", err);
    }
}

// ================= 3. حذف قسم =================
async function deleteCategory(id) {
    if (!confirm("Are you sure you want to delete this category? 🗑️")) return;
    
    try {
        // [تعديل] غيرنا /delete-category لـ /categories/${id} عشان يطابق السيرفر
        const res = await fetch(`${API_URL}/categories/${id}`, { 
            method: "DELETE" 
        });

        if (res.ok) {
            fetchCategories();
            alert("Category Deleted ✅");
        } else {
            alert("فشل الحذف من السيرفر ❌");
        }
    } catch (err) {
        console.error(err);
        alert("Error deleting category");
    }
}

// ================= تهيئة البيانات =================
document.addEventListener("DOMContentLoaded", fetchCategories);

// ربط الدالة بالـ Window عشان الـ HTML يشوفها (حل مشكلة ReferenceError)
window.createCategory = createCategory;
window.deleteCategory = deleteCategory;