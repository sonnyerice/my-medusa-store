// src/subscribers/order-completed.email.ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { INotificationModuleService } from "@medusajs/framework/types"

const money = (amount: number | null | undefined, ccy?: string) =>
  `${(((amount ?? 0) as number) / 100).toFixed(2)} ${(ccy ?? "eur").toUpperCase()}`
const esc = (s?: string) =>
  (s ?? "").replace(/[&<>"']/g, (ch) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]!))

function getChannelConfig(order: any) {
  const sc = order?.sales_channel || {}
  const md = sc?.metadata || {}
  return {
    brand: (md.brand_name as string) ?? process.env.BRAND_NAME ?? "Popinae",
    logoUrl: (md.brand_logo_url as string) ?? process.env.BRAND_LOGO_URL ?? "",
    storeUrl: (md.store_url as string) ?? process.env.STORE_URL ?? "https://loja.popinae.com",
    bcc: (md.bcc_orders as string) ?? process.env.NOTIF_BCC_ORDERS,
    replyTo: (md.reply_to as string) ?? process.env.NOTIF_REPLY_TO ?? process.env.NOTIFICATION_PROVIDER_FROM,
  }
}

export default async function onOrderCompletedEmail({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)
  const query = container.resolve("query")

  const { data: [order] } = await query.graph({
    entity: "order",
    // Pedimos todo lo que necesitamos; el tipado puede no incluir algunas props,
    // por eso haremos fallback con `as any` abajo.
    fields: [
      "id","email","currency_code","total","subtotal","shipping_total","tax_total",
      "items.title","items.quantity","items.unit_price","items.total","items.variant.sku",
      "shipping_address.first_name","shipping_address.last_name","shipping_address.address_1",
      "shipping_address.address_2","shipping_address.postal_code","shipping_address.city","shipping_address.country_code",
      "sales_channel.id","sales_channel.name","sales_channel.metadata",
      // si tu backend expone display_id/order_number, también los pedimos:
      "display_id","order_number"
    ],
    filters: { id: data.id }
  })

  // Fallback seguro para el número visible del pedido
  const orderNumber = (order as any).display_id ?? (order as any).order_number ?? order.id
  // Asegura que `to` es string
  const toEmail = (order as any).email ?? process.env.NOTIF_FALLBACK_TO ?? process.env.SMTP_USER!

  const cfg = getChannelConfig(order)
  const items = (order as any).items ?? []

  const rowsHtml = items.map((i: any) => {
    const unit = i.unit_price ?? (i.total && i.quantity ? Math.floor(i.total / i.quantity) : 0)
    const sku = i?.variant?.sku
    return `<tr>
      <td style="padding:8px 0">${esc(i.title)}${sku ? ` <span style="color:#6b7280">(${esc(sku)})</span>` : ""}</td>
      <td style="padding:8px 0" align="right">x${i.quantity}</td>
      <td style="padding:8px 0" align="right">${esc(money(unit, (order as any).currency_code))}</td>
    </tr>`
  }).join("")
  const textLines = items.map((i: any) => `• ${i.title} x${i.quantity}`).join("\n")

  const sa: any = (order as any).shipping_address ?? {}
  const addressHtml = `
    ${esc([sa.first_name, sa.last_name].filter(Boolean).join(" "))}<br/>
    ${esc(sa.address_1)}${sa.address_2 ? `, ${esc(sa.address_2)}` : ""}<br/>
    ${esc(sa.postal_code)} ${esc(sa.city)}<br/>
    ${(sa.country_code ?? "").toUpperCase()}
  `.trim()

  const subject = `${cfg.brand} - Order #${orderNumber} confirmed`
  const text =
`Thanks for your order!

Items:
${textLines}

Subtotal: ${money((order as any).subtotal ?? (order as any).total, (order as any).currency_code)}
Shipping: ${money((order as any).shipping_total ?? 0, (order as any).currency_code)}
Tax:      ${money((order as any).tax_total ?? 0, (order as any).currency_code)}
Total:    ${money((order as any).total, (order as any).currency_code)}

Shipping to:
${[sa.first_name, sa.last_name].filter(Boolean).join(" ")}
${sa.address_1}${sa.address_2 ? ", " + sa.address_2 : ""}
${sa.postal_code} ${sa.city}
${(sa.country_code ?? "").toUpperCase()}

Manage your order: ${cfg.storeUrl.replace(/\/$/,"")}/account/orders/${orderNumber}
`

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:Inter,Arial,sans-serif;color:#111827">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f9;padding:24px 0">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;padding:24px">
            <tr>
              <td style="text-align:center;padding-bottom:16px">
                ${cfg.logoUrl ? `<img src="${esc(cfg.logoUrl)}" alt="${esc(cfg.brand)}" style="height:36px;display:inline-block"/>` : `<strong style="font-size:18px">${esc(cfg.brand)}</strong>`}
              </td>
            </tr>
            <tr><td style="font-size:18px;font-weight:600;padding:8px 0">Order #${orderNumber} confirmed</td></tr>
            <tr><td style="color:#374151;padding:4px 0 16px">Thanks for your order! We’ll pack it faster than a double espresso.</td></tr>
            <tr>
              <td>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:12px 0">
                  ${rowsHtml || `<tr><td>No items</td></tr>`}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:12px">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr><td>Subtotal</td><td align="right"><strong>${esc(money((order as any).subtotal ?? (order as any).total, (order as any).currency_code))}</strong></td></tr>
                  <tr><td>Shipping</td><td align="right"><strong>${esc(money((order as any).shipping_total ?? 0, (order as any).currency_code))}</strong></td></tr>
                  <tr><td>Tax</td><td align="right"><strong>${esc(money((order as any).tax_total ?? 0, (order as any).currency_code))}</strong></td></tr>
                  ${(order as any).discount_total ? `<tr><td>Discount</td><td align="right"><strong>- ${esc(money((order as any).discount_total, (order as any).currency_code))}</strong></td></tr>` : ""}
                  <tr><td style="padding-top:8px">Total</td><td align="right" style="padding-top:8px"><strong>${esc(money((order as any).total, (order as any).currency_code))}</strong></td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px">
                <div style="font-weight:600;padding-bottom:4px">Shipping to</div>
                <div style="color:#374151">${addressHtml}</div>
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px">
                <a href="${esc(cfg.storeUrl.replace(/\/$/,""))}/account/orders/${orderNumber}" style="background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;display:inline-block">View your order</a>
              </td>
            </tr>
            <tr>
              <td style="color:#6b7280;padding-top:20px;font-size:12px">
                This email was sent from ${esc(cfg.brand)} • <a href="${esc(cfg.storeUrl)}" style="color:#6b7280">${esc(cfg.storeUrl)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  // Enviar (to:string garantizado)
  const payload: any = {
    to: toEmail,
    channel: "email",
    template: "order-completed",
    content: { subject, text, html },
  }
  // BCC / replyTo si existen
  if (cfg.bcc) payload.bcc = cfg.bcc
  if (cfg.replyTo) payload.replyTo = cfg.replyTo

  await notification.createNotifications(payload)
}

export const config: SubscriberConfig = { event: "order.completed" }
