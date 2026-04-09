const API = "http://localhost:3000";

/* 👁️ toggle Password */
function togglePassword(id) {
    const input = document.getElementById(id);
    if (input) {
        input.type = input.type === "password" ? "text" : "password";
    }
}

/* REGISTER */
async function register() {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;
    const error = document.getElementById("error");

    if (!username || !email || !password || !confirm) { 
        error.innerText = "Fill all fields ❌"; 
        return; 
    }
    if (password !== confirm) { 
        error.innerText = "Passwords do not match ❌"; 
        return; 
    }

    try {
        const res = await fetch(API + "/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ username, email, password })
        });
        if (res.status !== 200) { 
            error.innerText = "Email already exists ❌"; 
            return; 
        }
        localStorage.setItem("verifyEmail", email);
        window.location.href = "verify.html";
    } catch { 
        error.innerText = "Server error ❌"; 
    }
}

/* LOGIN */
async function login() {
    const loginVal = document.getElementById("login").value;
    const password = document.getElementById("password").value;
    const error = document.getElementById("error");

    if (!loginVal || !password) { 
        error.innerText = "Fill all fields ❌"; 
        return; 
    }

    try {
        const res = await fetch(API + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login: loginVal, password })
        });
        const data = await res.json();
        if (res.status !== 200) { 
            error.innerText = data.msg || "Wrong data ❌"; 
            return; 
        }

        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("cart", JSON.stringify(data.user.cart || []));

        // الخروج من فولدر auth للوصول لـ index.html
        window.location.href = "../index.html"; 
    } catch (err) { 
        error.innerText = "Server error ❌"; 
    }
}

/* ✅ FORGOT PASSWORD - تم تعديل المسار لـ reset.html */
async function forgot() {
    const email = document.getElementById("email").value;
    const error = document.getElementById("error");

    if (!email) {
        error.innerText = "Please enter your email ❌";
        return;
    }

    try {
        const res = await fetch(API + "/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        
        if (res.status === 200) {
            alert("Reset code sent! ✅");
            localStorage.setItem("resetEmail", email);
            // تم التغيير لـ reset.html ليتوافق مع اسم ملفك
            window.location.href = "reset.html"; 
        } else {
            error.innerText = "Email not found ❌";
        }
    } catch (err) {
        error.innerText = "Server error ❌";
    }
}

/* ✅ RESET PASSWORD - الدالة المسؤولة عن ملف reset.html */
async function resetPassword() {
    const email = localStorage.getItem("resetEmail"); 
    const code = document.getElementById("code").value;
    const newPassword = document.getElementById("newPassword").value;
    const error = document.getElementById("error");

    if (!code || !newPassword) {
        error.innerText = "Please fill all fields ❌";
        return;
    }

    try {
        const res = await fetch(API + "/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code, newPassword })
        });

        if (res.status === 200) {
            alert("Password updated! ✅");
            window.location.href = "login.html";
        } else {
            error.innerText = "Invalid code ❌";
        }
    } catch (err) {
        error.innerText = "Server error ❌";
    }
}