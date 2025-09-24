// src/subscribers/order-notify.email.ts
// Send lifecycle emails. Robustly resolve order from event id (order|fulfillment|delivery).
// All URLs/brand come from sales channel metadata or .env (no hardcoded domains).

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { INotificationModuleService } from "@medusajs/framework/types"

// ---------- helpers ----------
const n = (v: any): number => {
  if (v && typeof v === "object") {
    if (typeof (v as any).numeric_ === "number") return (v as any).numeric_
    if ((v as any).raw_?.value != null) {
      const p = parseFloat(String((v as any).raw_.value))
      if (!Number.isNaN(p)) return p
    }
    if ("value" in (v as any)) {
      const p = parseFloat(String((v as any).value))
      if (!Number.isNaN(p)) return p
    }
  }
  if (typeof v === "number") return v
  const p = parseFloat(String(v ?? 0))
  return Number.isNaN(p) ? 0 : p
}

const money = (amount: any, ccy?: string) => {
  const a = n(amount)
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (ccy ?? "eur").toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(a)
  } catch {
    return `${a.toFixed(2)} ${(ccy ?? "eur").toUpperCase()}`
  }
}

const esc = (s?: string) =>
  (s ?? "").replace(/[&<>"']/g, (ch) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]!))

const getQty = (i: any) =>
  n(i?.quantity ?? i?.detail?.quantity ?? i?.raw_quantity?.value ?? 1)

const cfgFromOrder = (order: any) => {
  const md = order?.sales_channel?.metadata || {}
  const baseUrl = (process.env.STORE_URL ?? "https://loja.popinae.com").replace(/\/$/, "")
  return {
    brand: md.brand_name ?? process.env.BRAND_NAME ?? "Popinae",
    logoUrl: md.brand_logo_url ?? process.env.BRAND_LOGO_URL ?? "",
    storeUrl: md.store_url ?? baseUrl,
    bcc: md.bcc_orders ?? process.env.NOTIF_BCC_ORDERS,
    replyTo: md.reply_to ?? process.env.NOTIF_REPLY_TO ?? process.env.NOTIFICATION_PROVIDER_FROM,
  }
}

const subjectFor = (brand: string, orderNumber: string, ev: string) => {
  const label =
    ev === "order.placed" ? "confirmed" :
    ev === "order.completed" ? "completed" :
    ev === "order.fulfillment_created" ? "ready to ship" :
    ev === "shipment.created" ? "shipped" :
    ev === "delivery.created" ? "delivered" :
    ev === "payment.captured" ? "payment captured" : ev
  return `${brand} - Order #${orderNumber} ${label}`
}

const templateFor = (ev: string) =>
  ev === "order.placed" ? "order-placed" :
  ev === "order.completed" ? "order-completed" :
  ev === "order.fulfillment_created" ? "order-fulfilled" :
  ev === "shipment.created" ? "order-shipped" :
  ev === "delivery.created" ? "order-delivered" :
  ev === "payment.captured" ? "payment-captured" : "order-update"

// ---------- resolve order from event id ----------
async function fetchOrderByAnyId(query: any, ev: string, rawId: string) {
  // 1) If it's an order id, fetch directly
  if (rawId?.startsWith?.("order_")) {
    const { data: [order] } = await query.graph({
      entity: "order",
      fields: ["id"],
      filters: { id: rawId },
    })
    if (order) return order.id
  }

  // 2) If it's a fulfillment id (shipment.created / delivery.created usual case)
  if (rawId?.startsWith?.("ful_")) {
    const { data: [ful] } = await query.graph({
      entity: "fulfillment",
      fields: ["id", "order_id", "order.id"],
      filters: { id: rawId },
    })
    const o = ful?.order_id ?? ful?.order?.id
    if (o) return o
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
    })
    const o = del?.fulfillment?.order_id ?? del?.fulfillment?.order?.id
    if (o) return o
  }

  // 4) Last resort: maybe it's the payment id for payment.captured (normally not needed)
  if (rawId?.startsWith?.("pay_")) {
    const { data: [pay] } = await query.graph({
      entity: "payment",
      fields: ["id", "payment_collection.order.id"],
      filters: { id: rawId },
    })
    const o = pay?.payment_collection?.order?.id
    if (o) return o
  }

  console.warn(`[email] could not resolve order id from ${ev} id=${rawId}`)
  return undefined
}

// ---------- subscriber ----------
export default async function onOrderEmail({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const ev = event.name
  if (![
    "order.placed",
    "order.completed",
    "order.fulfillment_created",
    "shipment.created",
    "delivery.created",
    "payment.captured",
  ].includes(ev)) {
    return
  }

  const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)
  const query = container.resolve("query")

  const rawId = (event as any).data?.id
  console.log(`[email] trigger: ${ev} → id=${rawId}`)
  if (!rawId) return

  // Resolve real order id first
  const targetOrderId =
    rawId?.startsWith("order_")
      ? rawId
      : await fetchOrderByAnyId(query, ev, rawId)

  if (!targetOrderId) {
    console.warn(`[email] skipping: cannot resolve order for ${ev} id=${rawId}`)
    return
  }

  // Fetch full order data we need (major units)
  const { data: [order] } = await query.graph({
    entity: "order",
    fields: [
      "id","display_id","email","currency_code","status","created_at",
      "total","subtotal","tax_total","discount_total",
      "item_total","item_subtotal","item_tax_total",
      "shipping_total","shipping_subtotal","shipping_tax_total",
      "summary.current_order_total",
      "items.id","items.title","items.quantity","items.unit_price",
      "items.total","items.subtotal","items.tax_total","items.variant.sku",
      "items.raw_quantity.value","items.detail.quantity",
      "shipping_address.first_name","shipping_address.last_name","shipping_address.address_1",
      "shipping_address.address_2","shipping_address.postal_code","shipping_address.city","shipping_address.country_code",
      "sales_channel.metadata",
    ],
    filters: { id: targetOrderId },
  })
  if (!order) {
    console.warn(`[email] order not found id=${targetOrderId}`)
    return
  }

  const cfg = cfgFromOrder(order)
  const ccy = order.currency_code
  const items = Array.isArray(order.items) ? order.items : []

  // Prefer backend totals; fallback if zero at order.placed
  let itemsIncl = n(order.item_total)
  let itemsExcl = n(order.item_subtotal)
  let itemTax   = n(order.item_tax_total)
  const shipIncl = n(order.shipping_total)
  const shipTax  = n(order.shipping_tax_total)
  let taxTotal   = n(order.tax_total)
  const discount = n(order.discount_total)
  let grandTotal = n(order.total ?? (order as any)?.summary?.current_order_total)

  if (!itemsIncl) itemsIncl = items.reduce((a: number, it: any) => a + n(it.unit_price) * getQty(it), 0)
  if (!itemsExcl) {
    const sumItemSub = items.reduce((a: number, it: any) => a + n(it.subtotal), 0)
    itemsExcl = sumItemSub || Math.max(0, itemsIncl - n(order.item_tax_total))
  }
  if (!itemTax) itemTax = items.reduce((a: number, it: any) => a + n(it.tax_total), 0)
  if (!taxTotal) taxTotal = Math.max(0, itemTax + shipTax)
  if (!grandTotal) grandTotal = Math.max(0, itemsIncl + shipIncl - discount)

  const rowsHtml = items.map((i: any) => {
    const qty = getQty(i)
    const sku = i?.variant?.sku
    return `<tr>
      <td style="padding:8px 0">${esc(i.title)}${sku ? ` <span style="color:#6b7280">(${esc(sku)})</span>` : ""}</td>
      <td style="padding:8px 0" align="right">x${qty}</td>
      <td style="padding:8px 0" align="right">${esc(money(n(i.unit_price), ccy))}</td>
    </tr>`
  }).join("")

  const sa: any = order.shipping_address ?? {}
  const orderNumber = String(((order as any)?.display_id ?? order.id))
  const toEmail = order.email ?? process.env.NOTIF_FALLBACK_TO ?? process.env.SMTP_USER!
  const subject = subjectFor(cfg.brand, orderNumber, ev)
  const template = templateFor(ev)
  const storeUrl = (cfg.storeUrl ?? "https://loja.popinae.com").replace(/\/$/, "")
  const orderLink = `${storeUrl}/order/${order.id}/confirmed`

  console.log("[email] computed", {
    event: ev,
    order_id: order.id,
    display_id: (order as any)?.display_id,
    items_len: items.length,
    quantities: items.map(getQty),
    item_total_incl: itemsIncl,
    shipping_total: shipIncl,
    tax_total: taxTotal,
    discount_total: discount,
    total: grandTotal,
  })

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
</html>`

  const text = [
    `Order #${orderNumber} — ${ev}`,
    `Items (incl): ${money(itemsIncl, ccy)}`,
    `Shipping:      ${money(shipIncl, ccy)}`,
    `Tax:           ${money(taxTotal, ccy)}`,
    ...(discount ? [`Discount:      - ${money(discount, ccy)}`] : []),
    `Total:         ${money(grandTotal, ccy)}`,
    "",
    "Items:",
    ...items.map((i: any) => `• ${i.title}${i?.variant?.sku ? ` (${i.variant.sku})` : ""} x${getQty(i)} @ ${money(n(i.unit_price), ccy)}`),
    "",
    `Manage: ${orderLink}`,
  ].join("\n")

  const bccList = String(cfg.bcc || "").split(",").map((s) => s.trim()).filter(Boolean)
  const payload: any = {
    to: toEmail,
    channel: "email",
    template,
    content: { subject, text, html },
    ...(bccList.length ? { bcc: bccList } : {}),
    data: {
      ...(cfg.replyTo ? { replyTo: cfg.replyTo } : {}),
      ...(cfg.logoUrl ? { attachments: [{ filename: "logo.png", path: cfg.logoUrl, cid: "brandlogo" }] } : {}),
    },
  }

  await notification.createNotifications(payload)
}

export const config: SubscriberConfig = {
  event: [
    "order.placed",
    "order.completed",
    "order.fulfillment_created",
    "shipment.created",
    "delivery.created",
    "payment.captured",
  ],
}
