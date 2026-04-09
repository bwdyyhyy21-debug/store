// الإعدادات الأساسية
const API_URL = "http://localhost:3000";

// --- [ جديد ] قاموس الترجمة للموقع الأساسي ---
const translations = {
    en: {
        langBtn: "العربية",
        nav_collection: "Collection",
        nav_contact: "Contact",
        nav_admin: "Admin",
        hero_title: "Our Newest products",
        hero_desc: "Store products to sell the latest and best raw materials.",
        hero_btn: "Shop Now",
        login: "LOGIN",
        logout: "Logout",
        add_to_cart: "Add to Cart",
        login_alert: "Please login first to add items to your cart! ⚠️",
        added_alert: "Added to cart ✅"
    },
    ar: {
        langBtn: "English",
        nav_collection: "المجموعات",
        nav_contact: "اتصل بنا",
        nav_admin: "لوحة التحكم",
        hero_title: "أحدث منتجاتنا",
        hero_desc: "متجر لبيع أجود وأفضل المنتجات الأصلية.",
        hero_btn: "تسوق الآن",
        login: "تسجيل الدخول",
        logout: "خروج",
        add_to_cart: "أضف للسلة",
        login_alert: "برجاء تسجيل الدخول أولاً لإضافة المنتجات! ⚠️",
        added_alert: "تمت الإضافة للسلة ✅"
    }
};

let currentLang = localStorage.getItem("siteLang") || "en";

// --- [ جديد ] دالة تبديل اللغة ---
function toggleLanguage() {
    currentLang = currentLang === "en" ? "ar" : "en";
    localStorage.setItem("siteLang", currentLang);
    applyLanguage();
}

function applyLanguage() {
    const t = translations[currentLang];
    
    // ترجمة العناصر الثابتة التي تحمل data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (t[key]) el.innerText = t[key];
    });

    // تحديث نص زرار اللغة
    const langBtnText = document.getElementById("langBtnText");
    if (langBtnText) langBtnText.innerText = t.langBtn;

    // قلب اتجاه الموقع
    if (currentLang === "ar") {
        document.body.classList.add("rtl");
    } else {
        document.body.classList.remove("rtl");
    }

    // تحديث النصوص الديناميكية (مثل أزرار الكارت الظاهرة حالياً)
    document.querySelectorAll(".card button").forEach(btn => {
        btn.innerText = t.add_to_cart;
    });
}

// --- 1. وظائف إدارة الكاتيجوريز ---
async function loadCategories() {
  const listContainer = document.getElementById("categoriesList");
  if (!listContainer) return;

  try {
    const res = await fetch(`${API_URL}/categories`);
    const categories = await res.json();
    
    listContainer.innerHTML = categories.map(cat => `
      <div class="category-item" style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
        <span>${cat.name}</span>
        <button onclick="deleteCategory('${cat._id}')" style="color: red; border: none; background: none; cursor: pointer;">Delete</button>
      </div>
    `).join("");
  } catch (err) {
    console.error("Error loading categories:", err);
  }
}

async function addCategory() {
  const input = document.getElementById("categoryInput");
  if (!input || !input.value) return alert("Please enter a category name");

  try {
    const res = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: input.value })
    });

    if (res.ok) {
      alert("Category Added ✅");
      input.value = "";
      loadCategories(); 
    } else {
      const err = await res.json();
      alert(err.message || "Error adding category");
    }
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Server Error ❌");
  }
}

// --- 2. دالة تحميل وعرض المنتجات ---
async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    const products = await res.json();

    const container = document.getElementById("products");
    if (!container) return;
    container.innerHTML = "";

    const grouped = {};
    products.forEach(p => {
      const cat = p.category || "General Collection";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });

    const t = translations[currentLang]; // لجلب نص زر السلة الحالي

    for (let category in grouped) {
      const safeId = category.replace(/\s+/g, "-");
      
      container.innerHTML += `
        <section class="category-section">
          <h2 class="category-header">${category}</h2>
          <div class="category-products" id="cat-${safeId}"></div>
        </section>
      `;

      const row = document.getElementById(`cat-${safeId}`);
      grouped[category].forEach(p => {
        const hasDiscount = p.discount && p.discount > 0;
        const finalPrice = hasDiscount ? (p.price - (p.price * p.discount / 100)) : p.price;
        const fullImgPath = p.image.startsWith('http') ? p.image : `${API_URL}${p.image}`;

        row.innerHTML += `
          <div class="card">
            <div onclick="window.location.href='product-details.html?id=${p._id}'" style="cursor: pointer;">
              <img src="${fullImgPath}" onerror="this.src='https://via.placeholder.com/400'">
              <div class="card-content">
                  <h3>${p.name}</h3>
                  <div class="price-container">
                    ${hasDiscount 
                      ? `<span class="old">${p.price} EGP</span>
                         <span class="new">${finalPrice.toFixed(0)} EGP</span>`
                      : `<span style="font-weight: bold;">${p.price} EGP</span>`
                    }
                  </div>
              </div>
            </div>
            <button onclick="addToCart('${p._id}', '${p.name}', ${finalPrice.toFixed(0)}, '${p.image}')">
              ${t.add_to_cart}
            </button>
          </div>
        `;
      });
    }
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// --- 3. دالة إضافة المنتجات للكارت ---
function addToCart(id, name, price, image) {
  const user = JSON.parse(localStorage.getItem("user"));
  const t = translations[currentLang];

  if (!user) {
    alert(t.login_alert);
    window.location.href = "auth/login.html"; 
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const itemIndex = cart.findIndex(item => item.id === id);
  
  if (itemIndex > -1) {
    cart[itemIndex].qty += 1;
  } else {
    cart.push({ id, name, price, image, qty: 1 });
  }
  
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
  alert(`${t.added_alert}: ${name}`);
}

// --- 4. دالة التعامل مع الهيدر ---
function handleNavbar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const area = document.getElementById("userArea");
  const navMenu = document.querySelector(".nav-menu"); 
  const t = translations[currentLang];
  
  if (!area) return;

  if (!user) {
    area.innerHTML = `
      <a href="auth/login.html" class="auth-link">
        <i class="far fa-user"></i> ${t.login}
      </a>`;
    return;
  }

  if (user.role === "admin" && navMenu) {
      if (!document.getElementById("adminNavLink")) {
          const adminBtn = document.createElement("a");
          adminBtn.id = "adminNavLink";
          adminBtn.href = "admin.html";
          adminBtn.innerText = t.nav_admin;
          adminBtn.style.color = "#ff9800"; 
          navMenu.appendChild(adminBtn);
      }
  }

  area.innerHTML = `
    <div class="user-menu" style="position: relative;">
      <span class="username" onclick="toggleMenu()" style="cursor: pointer; font-weight: 600;">
        <i class="far fa-user" style="margin-right: 5px;"></i> ${user.username}
      </span>
      <div id="dropdown" class="dropdown" style="display:none; position: absolute; right: 0; background: white; border: 1px solid #eee; padding: 10px; min-width: 120px; z-index: 1000; margin-top: 10px;">
        <div onclick="logout()" style="cursor:pointer; color: #e74c3c; font-size: 14px;">${t.logout}</div>
      </div>
    </div>
  `;
}

// --- 5. تحديث رقم الكارت ---
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const badge = document.querySelector(".cart-count");
  if (badge) {
    badge.innerText = cart.reduce((total, item) => total + item.qty, 0);
  }
}

// --- 6. وظائف إضافية ---
function toggleMenu() {
  const d = document.getElementById("dropdown");
  if(d) d.style.display = d.style.display === "block" ? "none" : "block";
}

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("cart");
  location.reload();
}

// تشغيل الدوال عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  applyLanguage(); // تطبيق اللغة أولاً
  handleNavbar();
  loadProducts();
  loadCategories(); 
  updateCartBadge();
});

// جعل الدالة متاحة عالمياً للزرار في HTML
window.toggleLanguage = toggleLanguage;