let cart = {};

fetch('products.json')
    .then(res => res.json())
    .then(data => {
        setupCategoryNav(data);
        renderProducts(data);
    })
    .catch(err => console.error("Error loading products:", err));

function setupCategoryNav(data) {
    const nav = document.getElementById('category-nav');
    const categories = [...new Set(data.map(item => item.Category))];
    nav.innerHTML = categories.map(cat => `
        <a href="#cat-${cat.replace(/\s+/g, '')}" class="cat-pill">${cat}</a>
    `).join('');
}

function renderProducts(data) {
    const listDiv = document.getElementById('product-list');
    const categories = [...new Set(data.map(item => item.Category))];

    let html = '';
    categories.forEach(cat => {
        html += `<h3 class="category-title" id="cat-${cat.replace(/\s+/g, '')}">${cat}</h3>`;
        const items = data.filter(i => i.Category === cat);
        items.forEach(item => {
            const displayMrp = Math.round(parseFloat(String(item.MRP).replace(/[₹,]/g, '')));
            const displayRate = Math.round(parseFloat(String(item.Rate).replace(/[₹,]/g, '')));
            const cleanName = item.Product.replace(/'/g, "\\'");

            html += `
                <div class="product-row">
                    <div class="p-info">
                        <span class="p-name">${item.Product}</span>
                        <span class="p-sku">SKU: ${item.SKU}</span>
                        <div class="p-prices">
                            <span class="mrp-val">₹${displayMrp}</span>
                            <span class="disc-tag">75% OFF</span>
                            <span class="rate-val">₹${displayRate}</span>
                        </div>
                    </div>
                    <div class="p-action">
                        <div class="item-subtotal" id="subtotal-${item.SKU}">₹0</div>
                        <div class="qty-control">
                            <button type="button" class="qty-btn down" onclick="changeQty('${item.SKU}', -1, '${cleanName}', ${displayRate})" title="Decrease">▼</button>
                            <input type="number" id="qty-${item.SKU}" class="qty-input" min="0" value="0" 
                                oninput="updateCart('${item.SKU}', this.value, '${cleanName}', ${displayRate})">
                            <button type="button" class="qty-btn up" onclick="changeQty('${item.SKU}', 1, '${cleanName}', ${displayRate})" title="Increase">▲</button>
                        </div>
                    </div>
                </div>`;
        });
    });
    listDiv.innerHTML = html;
}

function changeQty(sku, change, name, rate) {
    const input = document.getElementById(`qty-${sku}`);
    let currentQty = parseInt(input.value) || 0;
    currentQty = Math.max(0, currentQty + change);
    input.value = currentQty;
    updateCart(sku, currentQty, name, rate);
}

function updateCart(sku, qty, name, rate) {
    qty = parseInt(qty) || 0;
    const itemTotal = qty * rate;
    document.getElementById(`subtotal-${sku}`).innerText = `₹${itemTotal}`;
    if (qty > 0) cart[sku] = { name, rate, qty, total: itemTotal };
    else delete cart[sku];

    const totals = Object.values(cart).reduce((acc, curr) => {
        acc.total += curr.total;
        acc.count += curr.qty;
        return acc;
    }, { total: 0, count: 0 });

    document.getElementById('itemCount').innerText = totals.count;
    document.getElementById('netTotal').innerText = totals.total.toLocaleString('en-IN');
}

function showModal() {
    if (Object.keys(cart).length === 0) {
        alert("Please select at least one item before ordering.");
        return;
    }
    document.getElementById('checkoutModal').style.display = "block";
}

function closeModal() {
    document.getElementById('checkoutModal').style.display = "none";
}

function shareStoreOnWhatsApp() {
    const siteUrl = "https://greencrackers.github.io/greencrackers2026/";

    const promoText =
        `*GREEN CRACKERS - சிவகாசி*
Whole Sale & Retail Crackers, Fancy Fireworks, Sparklers & Matches

 நேரடி தொழிற்சாலை விலையில் Flat 75% தள்ளுபடி!
 *இப்போதே ஆர்டர் செய்ய:* ${siteUrl}

 *முகவரி:* 1/661/B4/D, தென்றல் நகர், விளாம்பட்டி ரோடு, சிவகாசி.
 *தொடர்புக்கு / G-Pay:* +91 99948 75171
 *Email:* mutthu.murthy@gmail.com

 அனைத்து இடங்களுக்கும் பாதுகாப்பான பார்சல் லாரி சர்வீஸ் மூலம் அனுப்பி வைக்கப்படும்.
இப்போதே உங்கள் ஆர்டரை பதிவு செய்து சலுகையை பெறுங்கள்!`;

    const shareUrl = "https://wa.me/?text=" + encodeURIComponent(promoText);
    window.open(shareUrl, "_blank");
}

function generateOrderId() {
    const now = new Date();
    const datePart = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0');

    const timePart = now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');

    return "GC-" + datePart + "-" + timePart;
}

function submitOrder(type) {
    const nameEl = document.getElementById('custName');
    const phoneEl = document.getElementById('custPhone');
    const emailEl = document.getElementById('custEmail');
    const addressEl = document.getElementById('custAddress');

    if (!nameEl.checkValidity() || !phoneEl.checkValidity() || !emailEl.checkValidity() || !addressEl.checkValidity()) {
        alert("❌ Please fill in the details correctly:\n- Name (min 3 chars)\n- WhatsApp Phone (10 digits)\n- Valid Email\n- Detailed Address (min 10 chars)");

        if (!nameEl.checkValidity()) nameEl.focus();
        else if (!phoneEl.checkValidity()) phoneEl.focus();
        else if (!emailEl.checkValidity()) emailEl.focus();
        else if (!addressEl.checkValidity()) addressEl.focus();

        return;
    }

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const email = emailEl.value.trim();
    const address = addressEl.value.trim();

    if (Object.keys(cart).length === 0) {
        alert("Your cart is empty. Please add items before placing an order.");
        return;
    }

    const orderId = generateOrderId();
    const orderDate = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    let totalQty = 0;
    let grandTotal = 0;
    let waItemsList = "";
    let emailItemsList = "";

    let itemIndex = 1;
    for (let sku in cart) {
        const item = cart[sku];
        totalQty += item.qty;
        grandTotal += item.total;

        waItemsList += `${itemIndex}. *${item.name}*\n`;
        waItemsList += `   └ SKU: ${sku} | ₹${item.rate} x ${item.qty} = *₹${item.total.toLocaleString('en-IN')}*\n`;

        emailItemsList += `${itemIndex}. ${item.name} (SKU: ${sku})\n`;
        emailItemsList += `   Qty: ${item.qty} x ₹${item.rate} = ₹${item.total.toLocaleString('en-IN')}\n\n`;

        itemIndex++;
    }

    const ownerWhatsApp = "919994875171";
    const recipientEmail = "mutthu.murthy@gmail.com";

    // WhatsApp Message
    const waMessage =
        `*NEW ORDER - GREEN CRACKERS (SIVAKASI)*
--------------------------------------
*ORDER DETAILS:*
• *Order ID:* ${orderId}
• *Date & Time:* ${orderDate}

*CUSTOMER DETAILS:*
• *Name:* ${name}
• *WhatsApp:* ${phone}
• *Email:* ${email}
• *Delivery Address:* 
${address}

*ITEMS ORDERED:*
${waItemsList}
--------------------------------------
*ORDER SUMMARY:*
• *Total Items:* ${totalQty}
• *GRAND TOTAL:* *₹${grandTotal.toLocaleString('en-IN')}*
--------------------------------------
*PAYMENT ACCOUNT:*
• *G-Pay / PhonePe:* 99948 75171
• *Bank:* Tamilnadu Mercantile Bank
• *A/c Name:* MUTHUKRISHNAMOORTHY A
• *A/c No:* 435100050301021
• *IFSC Code:* TMBL0000435
--------------------------------------
Kindly confirm this order. Payment screenshot will be shared shortly.`;

    // Email Message
    const mailSubject = `New Order: ${orderId} - ${name} (₹${grandTotal.toLocaleString('en-IN')})`;
    const mailBody =
        `==================================================
        GREEN CRACKERS - ORDER CONFIRMATION
==================================================

ORDER REFERENCE:
----------------
Order ID  : ${orderId}
Date/Time : ${orderDate}

CUSTOMER DETAILS:
-----------------
Customer Name    : ${name.toUpperCase()}
Contact WhatsApp : ${phone}
Email Address    : ${email}
Delivery Address : 
${address.toUpperCase()}

ITEMS ORDERED:
--------------
${emailItemsList}
--------------------------------------------------
SUMMARY:
--------------------------------------------------
Total Items Count : ${totalQty}
GRAND TOTAL       : Rs. ${grandTotal.toLocaleString('en-IN')}

==================================================
PAYMENT DETAILS (DIRECT TRANSFER):
==================================================
• G-Pay / PhonePe : 99948 75171
• Bank Name       : Tamilnadu Mercantile Bank
• A/c Name        : MUTHUKRISHNAMOORTHY A
• A/c Number      : 435100050301021
• IFSC Code       : TMBL0000435
• Email           : mutthu.murthy@gmail.com
==================================================
Address: 1/661/B4/D, Thendral Nagar, Vilampatti Road, SIVAKASI.`;

    if (type === 'whatsapp') {
        const waUrl = `https://wa.me/${ownerWhatsApp}?text=` + encodeURIComponent(waMessage);
        window.open(waUrl, "_blank");
    }
    else if (type === 'email') {
        const encodedSubject = encodeURIComponent(mailSubject);
        const encodedBody = encodeURIComponent(mailBody);
        const mailtoLink = `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`;

        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
            window.location.href = mailtoLink;
        } else {
            const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmail}&su=${encodedSubject}&body=${encodedBody}`;
            window.open(gmailWebUrl, '_blank');
        }
    }
}
