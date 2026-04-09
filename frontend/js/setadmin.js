/* ======================== setadmin.js ======================== */

// 1. تشغيل جلب البيانات بمجرد تحميل الصفحة
document.addEventListener("DOMContentLoaded", fetchAdmins);

// 2. دالة إضافة أدمن جديد
async function handlePromote() {
    const email = document.getElementById("userEmail").value;
    const msgDiv = document.getElementById("msg");
    
    if (!email) {
        showMsg("Please enter an email! ❌", "#e74c3c");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/admin/make-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email })
        });

        const data = await res.text();

        if (res.status === 200) {
            showMsg(data, "#2ecc71");
            document.getElementById("userEmail").value = ""; 
            fetchAdmins(); // تحديث الجدول فوراً بعد الإضافة
        } else {
            showMsg(data, "#e74c3c");
        }
    } catch (err) {
        showMsg("Server error ❌", "#e74c3c");
    }
}

// 3. دالة عرض الرسائل الملونة
function showMsg(text, color) {
    const msgDiv = document.getElementById("msg");
    msgDiv.innerText = text;
    msgDiv.style.display = "block";
    msgDiv.style.backgroundColor = color + "22";
    msgDiv.style.color = color;
    msgDiv.style.border = `1px solid ${color}`;
}

// 4. جلب وعرض لستة الأدمينز (معدلة للموبايل)
async function fetchAdmins() {
    try {
        const res = await fetch("http://localhost:3000/admin/list-admins");
        const admins = await res.json();
        
        const tableBody = document.getElementById("adminTableBody");
        tableBody.innerHTML = ""; 

        admins.forEach(admin => {
            // الحماية: التحقق لو الإيميل هو الإيميل الرئيسي
            const isMainAdmin = admin.email === "pureguardstore@gmail.com";
            
            tableBody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td data-label="Username" style="padding: 12px;">${admin.username}</td>
                    <td data-label="Email" style="padding: 12px;">${admin.email}</td>
                    <td data-label="Action" style="padding: 12px; text-align: center;">
                        ${isMainAdmin ? 
                            '<span style="color: #999; font-style: italic; font-size: 14px;">Primary Admin 🛡️</span>' : 
                            `<button onclick="removeAdmin('${admin.email}')" 
                                     style="background: #ff4d4d; color: white; border: none; padding: 7px 15px; border-radius: 5px; cursor: pointer; transition: 0.3s; font-weight: bold;">
                                Remove
                            </button>`
                        }
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error fetching admins:", err);
    }
}

// 5. دالة حذف صلاحية الأدمن
async function removeAdmin(email) {
    if (!confirm(`Are you sure you want to remove admin rights from ${email}?`)) return;

    try {
        const res = await fetch("http://localhost:3000/admin/remove-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        if (res.status === 200) {
            alert("Admin removed successfully ✅");
            fetchAdmins(); // تحديث الجدول بعد الحذف
        } else if (res.status === 403) {
            const errorMsg = await res.text();
            alert(errorMsg);
        } else {
            alert("Something went wrong ❌");
        }
    } catch (err) {
        alert("Error connecting to server");
    }
}