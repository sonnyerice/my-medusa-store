"use strict";
// src/subscribers/order-notify.email.ts
// Send lifecycle emails. Robustly resolve order from event id (order|fulfillment|delivery).
// All URLs/brand come from sales channel metadata or .env (no hardcoded domains).
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = onOrderEmail;
const utils_1 = require("@medusajs/framework/utils");
// ---------- helpers ----------
const n = (v) => {
    if (v && typeof v === "object") {
        if (typeof v.numeric_ === "number")
            return v.numeric_;
        if (v.raw_?.value != null) {
            const p = parseFloat(String(v.raw_.value));
            if (!Number.isNaN(p))
                return p;
        }
        if ("value" in v) {
            const p = parseFloat(String(v.value));
            if (!Number.isNaN(p))
                return p;
        }
    }
    if (typeof v === "number")
        return v;
    const p = parseFloat(String(v ?? 0));
    return Number.isNaN(p) ? 0 : p;
};
const money = (amount, ccy) => {
    const a = n(amount);
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: (ccy ?? "eur").toUpperCase(),
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(a);
    }
    catch {
        return `${a.toFixed(2)} ${(ccy ?? "eur").toUpperCase()}`;
    }
};
const esc = (s) => (s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const getQty = (i) => n(i?.quantity ?? i?.detail?.quantity ?? i?.raw_quantity?.value ?? 1);
const cfgFromOrder = (order) => {
    const md = order?.sales_channel?.metadata || {};
    const baseUrl = (process.env.STORE_URL ?? "https://loja.popinae.com").replace(/\/$/, "");
    return {
        brand: md.brand_name ?? process.env.BRAND_NAME ?? "Popinae",
        logoUrl: md.brand_logo_url ?? process.env.BRAND_LOGO_URL ?? "",
        storeUrl: md.store_url ?? baseUrl,
        bcc: md.bcc_orders ?? process.env.NOTIF_BCC_ORDERS,
        replyTo: md.reply_to ?? process.env.NOTIF_REPLY_TO ?? process.env.NOTIFICATION_PROVIDER_FROM,
    };
};
const subjectFor = (brand, orderNumber, ev) => {
    const label = ev === "order.placed" ? "confirmed" :
        ev === "order.completed" ? "completed" :
            ev === "order.fulfillment_created" ? "ready to ship" :
                ev === "shipment.created" ? "shipped" :
                    ev === "delivery.created" ? "delivered" :
                        ev === "payment.captured" ? "payment captured" : ev;
    return `${brand} - Order #${orderNumber} ${label}`;
};
const templateFor = (ev) => ev === "order.placed" ? "order-placed" :
    ev === "order.completed" ? "order-completed" :
        ev === "order.fulfillment_created" ? "order-fulfilled" :
            ev === "shipment.created" ? "order-shipped" :
                ev === "delivery.created" ? "order-delivered" :
                    ev === "payment.captured" ? "payment-captured" : "order-update";
// ---------- resolve order from event id ----------
async function fetchOrderByAnyId(query, ev, rawId) {
    // 1) If it's an order id, fetch directly
    if (rawId?.startsWith?.("order_")) {
        const { data: [order] } = await query.graph({
            entity: "order",
            fields: ["id"],
            filters: { id: rawId },
        });
        if (order)
            return order.id;
    }
    // 2) If it's a fulfillment id (shipment.created / delivery.created usual case)
    if (rawId?.startsWith?.("ful_")) {
        const { data: [ful] } = await query.graph({
            entity: "fulfillment",
            fields: ["id", "order_id", "order.id"],
            filters: { id: rawId },
        });
        const o = ful?.order_id ?? ful?.order?.id;
        if (o)
            return o;
    }
    // 3) Some setups send delivery id — try to join back to fulfillment → order
    if (rawId?.startsWith?.("del_") || rawId?.startsWith?.("deli_")) {
        const { data: [del] } = await query.graph({
            entity: "delivery",
            fields: [
                "id",
                "fulfillment_id",
                "fulfillment.id",
                "fulfillment.order_id",
                "fulfillment.order.id"
            ],
            filters: { id: rawId },
        });
        const o = del?.fulfillment?.order_id ?? del?.fulfillment?.order?.id;
        if (o)
            return o;
    }
    // 4) Last resort: maybe it's the payment id for payment.captured (normally not needed)
    if (rawId?.startsWith?.("pay_")) {
        const { data: [pay] } = await query.graph({
            entity: "payment",
            fields: ["id", "payment_collection.order.id"],
            filters: { id: rawId },
        });
        const o = pay?.payment_collection?.order?.id;
        if (o)
            return o;
    }
    console.warn(`[email] could not resolve order id from ${ev} id=${rawId}`);
    return undefined;
}
// ---------- subscriber ----------
async function onOrderEmail({ event, container, }) {
    const ev = event.name;
    if (![
        "order.placed",
        "order.completed",
        "order.fulfillment_created",
        "shipment.created",
        "delivery.created",
        "payment.captured",
    ].includes(ev)) {
        return;
    }
    const notification = container.resolve(utils_1.Modules.NOTIFICATION);
    const query = container.resolve("query");
    const rawId = event.data?.id;
    console.log(`[email] trigger: ${ev} → id=${rawId}`);
    if (!rawId)
        return;
    // Resolve real order id first
    const targetOrderId = rawId?.startsWith("order_")
        ? rawId
        : await fetchOrderByAnyId(query, ev, rawId);
    if (!targetOrderId) {
        console.warn(`[email] skipping: cannot resolve order for ${ev} id=${rawId}`);
        return;
    }
    // Fetch full order data we need (major units)
    const { data: [order] } = await query.graph({
        entity: "order",
        fields: [
            "id", "display_id", "email", "currency_code", "status", "created_at",
            "total", "subtotal", "tax_total", "discount_total",
            "item_total", "item_subtotal", "item_tax_total",
            "shipping_total", "shipping_subtotal", "shipping_tax_total",
            "summary.current_order_total",
            "items.id", "items.title", "items.quantity", "items.unit_price",
            "items.total", "items.subtotal", "items.tax_total", "items.variant.sku",
            "items.raw_quantity.value", "items.detail.quantity",
            "shipping_address.first_name", "shipping_address.last_name", "shipping_address.address_1",
            "shipping_address.address_2", "shipping_address.postal_code", "shipping_address.city", "shipping_address.country_code",
            "sales_channel.metadata",
        ],
        filters: { id: targetOrderId },
    });
    if (!order) {
        console.warn(`[email] order not found id=${targetOrderId}`);
        return;
    }
    const cfg = cfgFromOrder(order);
    const ccy = order.currency_code;
    const items = Array.isArray(order.items) ? order.items : [];
    // Prefer backend totals; fallback if zero at order.placed
    let itemsIncl = n(order.item_total);
    let itemsExcl = n(order.item_subtotal);
    let itemTax = n(order.item_tax_total);
    const shipIncl = n(order.shipping_total);
    const shipTax = n(order.shipping_tax_total);
    let taxTotal = n(order.tax_total);
    const discount = n(order.discount_total);
    let grandTotal = n(order.total ?? order?.summary?.current_order_total);
    if (!itemsIncl)
        itemsIncl = items.reduce((a, it) => a + n(it.unit_price) * getQty(it), 0);
    if (!itemsExcl) {
        const sumItemSub = items.reduce((a, it) => a + n(it.subtotal), 0);
        itemsExcl = sumItemSub || Math.max(0, itemsIncl - n(order.item_tax_total));
    }
    if (!itemTax)
        itemTax = items.reduce((a, it) => a + n(it.tax_total), 0);
    if (!taxTotal)
        taxTotal = Math.max(0, itemTax + shipTax);
    if (!grandTotal)
        grandTotal = Math.max(0, itemsIncl + shipIncl - discount);
    const rowsHtml = items.map((i) => {
        const qty = getQty(i);
        const sku = i?.variant?.sku;
        return `<tr>
      <td style="padding:8px 0">${esc(i.title)}${sku ? ` <span style="color:#6b7280">(${esc(sku)})</span>` : ""}</td>
      <td style="padding:8px 0" align="right">x${qty}</td>
      <td style="padding:8px 0" align="right">${esc(money(n(i.unit_price), ccy))}</td>
    </tr>`;
    }).join("");
    const sa = order.shipping_address ?? {};
    const orderNumber = String((order?.display_id ?? order.id));
    const toEmail = order.email ?? process.env.NOTIF_FALLBACK_TO ?? process.env.SMTP_USER;
    const subject = subjectFor(cfg.brand, orderNumber, ev);
    const template = templateFor(ev);
    const storeUrl = (cfg.storeUrl ?? "https://loja.popinae.com").replace(/\/$/, "");
    const orderLink = `${storeUrl}/order/${order.id}/confirmed`;
    console.log("[email] computed", {
        event: ev,
        order_id: order.id,
        display_id: order?.display_id,
        items_len: items.length,
        quantities: items.map(getQty),
        item_total_incl: itemsIncl,
        shipping_total: shipIncl,
        tax_total: taxTotal,
        discount_total: discount,
        total: grandTotal,
    });
    const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0f1115;font-family:Inter,Arial,sans-serif;color:#e5e7eb">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0">
      <tr><td align="center">
        <table role="presentation" width="720" cellspacing="0" cellpadding="0" style="background:#1c1f24;border-radius:12px;padding:24px">
          <tr><td style="text-align:center;padding-bottom:16px">
            ${cfg.logoUrl ? `<img src="${esc(cfg.logoUrl)}" alt="${esc(cfg.brand)}" style="height:36px;display:inline-block"/>` : `<strong style="font-size:18px">${esc(cfg.brand)}</strong>`}
          </td></tr>

          <tr><td style="font-size:18px;font-weight:700;padding:8px 0;color:#ffffff">Order #${esc(orderNumber)}</td></tr>
          <tr><td style="color:#cbd5e1;padding:4px 0 16px">Thanks for your order! We’ll pack it faster than a double espresso.</td></tr>

          <tr><td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #374151;border-bottom:1px solid #374151;padding:12px 0">
              ${rowsHtml || `<tr><td>No items</td></tr>`}
            </table>
          </td></tr>

          <tr><td style="padding-top:12px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr><td>Items (incl. tax)</td><td align="right"><strong>${esc(money(itemsIncl, ccy))}</strong></td></tr>
              <tr><td>Shipping</td><td align="right"><strong>${esc(money(shipIncl, ccy))}</strong></td></tr>
              <tr><td>Tax</td><td align="right"><strong>${esc(money(taxTotal, ccy))}</strong></td></tr>
              ${discount ? `<tr><td>Discount</td><td align="right"><strong>- ${esc(money(discount, ccy))}</strong></td></tr>` : ""}
              <tr><td style="padding-top:8px">Total</td><td align="right" style="padding-top:8px"><strong>${esc(money(grandTotal, ccy))}</strong></td></tr>
            </table>
          </td></tr>

          <tr><td style="padding-top:16px">
            <div style="font-weight:600;padding-bottom:4px;color:#ffffff">Shipping to</div>
            <div style="color:#cbd5e1">
              ${esc([sa.first_name, sa.last_name].filter(Boolean).join(" "))}<br/>
              ${esc(sa.address_1)}${sa.address_2 ? `, ${esc(sa.address_2)}` : ""}<br/>
              ${esc(sa.postal_code)} ${esc(sa.city)}<br/>
              ${(sa.country_code ?? "").toUpperCase()}
            </div>
          </td></tr>

          <tr><td style="padding-top:16px">
            <a href="${esc(orderLink)}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;display:inline-block">View your order</a>
          </td></tr>

          <tr><td style="color:#94a3b8;padding-top:20px;font-size:12px">
            This email was sent from ${esc(cfg.brand)} • <a href="${esc(storeUrl)}" style="color:#94a3b8">${esc(storeUrl)}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
    const text = [
        `Order #${orderNumber} — ${ev}`,
        `Items (incl): ${money(itemsIncl, ccy)}`,
        `Shipping:      ${money(shipIncl, ccy)}`,
        `Tax:           ${money(taxTotal, ccy)}`,
        ...(discount ? [`Discount:      - ${money(discount, ccy)}`] : []),
        `Total:         ${money(grandTotal, ccy)}`,
        "",
        "Items:",
        ...items.map((i) => `• ${i.title}${i?.variant?.sku ? ` (${i.variant.sku})` : ""} x${getQty(i)} @ ${money(n(i.unit_price), ccy)}`),
        "",
        `Manage: ${orderLink}`,
    ].join("\n");
    const bccList = String(cfg.bcc || "").split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
        to: toEmail,
        channel: "email",
        template,
        content: { subject, text, html },
        ...(bccList.length ? { bcc: bccList } : {}),
        data: {
            ...(cfg.replyTo ? { replyTo: cfg.replyTo } : {}),
            ...(cfg.logoUrl ? { attachments: [{ filename: "logo.png", path: cfg.logoUrl, cid: "brandlogo" }] } : {}),
        },
    };
    await notification.createNotifications(payload);
}
exports.config = {
    event: [
        "order.placed",
        "order.completed",
        "order.fulfillment_created",
        "shipment.created",
        "delivery.created",
        "payment.captured",
    ],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JkZXItY29tcGxldGVkLmVtYWlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3N1YnNjcmliZXJzL29yZGVyLWNvbXBsZXRlZC5lbWFpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsd0NBQXdDO0FBQ3hDLDRGQUE0RjtBQUM1RixrRkFBa0Y7OztBQW1JbEYsK0JBK0xDO0FBL1RELHFEQUFtRDtBQUduRCxnQ0FBZ0M7QUFDaEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFNLEVBQVUsRUFBRTtJQUMzQixJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUMvQixJQUFJLE9BQVEsQ0FBUyxDQUFDLFFBQVEsS0FBSyxRQUFRO1lBQUUsT0FBUSxDQUFTLENBQUMsUUFBUSxDQUFBO1FBQ3ZFLElBQUssQ0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLENBQUM7WUFDbkMsTUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBRSxDQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7WUFDbkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ2hDLENBQUM7UUFDRCxJQUFJLE9BQU8sSUFBSyxDQUFTLEVBQUUsQ0FBQztZQUMxQixNQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFFLENBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO1lBQzlDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFBRSxPQUFPLENBQUMsQ0FBQTtRQUNoQyxDQUFDO0lBQ0gsQ0FBQztJQUNELElBQUksT0FBTyxDQUFDLEtBQUssUUFBUTtRQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQ25DLE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FB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S0FBSyxDQUFDLEtBQUssSUFBSyxLQUFhLEVBQUUsT0FBTyxFQUFFLG1CQUFtQixDQUFDLENBQUE7SUFFL0UsSUFBSSxDQUFDLFNBQVM7UUFBRSxTQUFTLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUN0RyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDZixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDOUUsU0FBUyxHQUFHLFVBQVUsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxTQUFTLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFBO0lBQzVFLENBQUM7SUFDRCxJQUFJLENBQUMsT0FBTztRQUFFLE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDcEYsSUFBSSxDQUFDLFFBQVE7UUFBRSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFBO0lBQ3hELElBQUksQ0FBQyxVQUFVO1FBQUUsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFNBQVMsR0FBRyxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUE7SUFFMUUsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxD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