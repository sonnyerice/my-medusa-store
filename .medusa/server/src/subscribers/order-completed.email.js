"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = onOrderCompletedEmail;
const utils_1 = require("@medusajs/framework/utils");
const money = (amount, ccy) => `${((amount ?? 0) / 100).toFixed(2)} ${(ccy ?? "eur").toUpperCase()}`;
const esc = (s) => (s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
function getChannelConfig(order) {
    const sc = order?.sales_channel || {};
    const md = sc?.metadata || {};
    return {
        brand: md.brand_name ?? process.env.BRAND_NAME ?? "Popinae",
        logoUrl: md.brand_logo_url ?? process.env.BRAND_LOGO_URL ?? "",
        storeUrl: md.store_url ?? process.env.STORE_URL ?? "https://loja.popinae.com",
        bcc: md.bcc_orders ?? process.env.NOTIF_BCC_ORDERS,
        replyTo: md.reply_to ?? process.env.NOTIF_REPLY_TO ?? process.env.NOTIFICATION_PROVIDER_FROM,
    };
}
async function onOrderCompletedEmail({ event: { data }, container, }) {
    const notification = container.resolve(utils_1.Modules.NOTIFICATION);
    const query = container.resolve("query");
    const { data: [order] } = await query.graph({
        entity: "order",
        // Pedimos todo lo que necesitamos; el tipado puede no incluir algunas props,
        // por eso haremos fallback con `as any` abajo.
        fields: [
            "id", "email", "currency_code", "total", "subtotal", "shipping_total", "tax_total",
            "items.title", "items.quantity", "items.unit_price", "items.total", "items.variant.sku",
            "shipping_address.first_name", "shipping_address.last_name", "shipping_address.address_1",
            "shipping_address.address_2", "shipping_address.postal_code", "shipping_address.city", "shipping_address.country_code",
            "sales_channel.id", "sales_channel.name", "sales_channel.metadata",
            // si tu backend expone display_id/order_number, también los pedimos:
            "display_id", "order_number"
        ],
        filters: { id: data.id }
    });
    // Fallback seguro para el número visible del pedido
    const orderNumber = order.display_id ?? order.order_number ?? order.id;
    // Asegura que `to` es string
    const toEmail = order.email ?? process.env.NOTIF_FALLBACK_TO ?? process.env.SMTP_USER;
    const cfg = getChannelConfig(order);
    const items = order.items ?? [];
    const rowsHtml = items.map((i) => {
        const unit = i.unit_price ?? (i.total && i.quantity ? Math.floor(i.total / i.quantity) : 0);
        const sku = i?.variant?.sku;
        return `<tr>
      <td style="padding:8px 0">${esc(i.title)}${sku ? ` <span style="color:#6b7280">(${esc(sku)})</span>` : ""}</td>
      <td style="padding:8px 0" align="right">x${i.quantity}</td>
      <td style="padding:8px 0" align="right">${esc(money(unit, order.currency_code))}</td>
    </tr>`;
    }).join("");
    const textLines = items.map((i) => `• ${i.title} x${i.quantity}`).join("\n");
    const sa = order.shipping_address ?? {};
    const addressHtml = `
    ${esc([sa.first_name, sa.last_name].filter(Boolean).join(" "))}<br/>
    ${esc(sa.address_1)}${sa.address_2 ? `, ${esc(sa.address_2)}` : ""}<br/>
    ${esc(sa.postal_code)} ${esc(sa.city)}<br/>
    ${(sa.country_code ?? "").toUpperCase()}
  `.trim();
    const subject = `${cfg.brand} - Order #${orderNumber} confirmed`;
    const text = `Thanks for your order!

Items:
${textLines}

Subtotal: ${money(order.subtotal ?? order.total, order.currency_code)}
Shipping: ${money(order.shipping_total ?? 0, order.currency_code)}
Tax:      ${money(order.tax_total ?? 0, order.currency_code)}
Total:    ${money(order.total, order.currency_code)}

Shipping to:
${[sa.first_name, sa.last_name].filter(Boolean).join(" ")}
${sa.address_1}${sa.address_2 ? ", " + sa.address_2 : ""}
${sa.postal_code} ${sa.city}
${(sa.country_code ?? "").toUpperCase()}

Manage your order: ${cfg.storeUrl.replace(/\/$/, "")}/account/orders/${orderNumber}
`;
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
                  <tr><td>Subtotal</td><td align="right"><strong>${esc(money(order.subtotal ?? order.total, order.currency_code))}</strong></td></tr>
                  <tr><td>Shipping</td><td align="right"><strong>${esc(money(order.shipping_total ?? 0, order.currency_code))}</strong></td></tr>
                  <tr><td>Tax</td><td align="right"><strong>${esc(money(order.tax_total ?? 0, order.currency_code))}</strong></td></tr>
                  ${order.discount_total ? `<tr><td>Discount</td><td align="right"><strong>- ${esc(money(order.discount_total, order.currency_code))}</strong></td></tr>` : ""}
                  <tr><td style="padding-top:8px">Total</td><td align="right" style="padding-top:8px"><strong>${esc(money(order.total, order.currency_code))}</strong></td></tr>
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
                <a href="${esc(cfg.storeUrl.replace(/\/$/, ""))}/account/orders/${orderNumber}" style="background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;display:inline-block">View your order</a>
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
</html>`;
    // Enviar (to:string garantizado)
    const payload = {
        to: toEmail,
        channel: "email",
        template: "order-completed",
        content: { subject, text, html },
    };
    // BCC / replyTo si existen
    if (cfg.bcc)
        payload.bcc = cfg.bcc;
    if (cfg.replyTo)
        payload.replyTo = cfg.replyTo;
    await notification.createNotifications(payload);
}
exports.config = { event: "order.completed" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JkZXItY29tcGxldGVkLmVtYWlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3N1YnNjcmliZXJzL29yZGVyLWNvbXBsZXRlZC5lbWFpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFzQkEsd0NBMElDO0FBOUpELHFEQUFtRDtBQUduRCxNQUFNLEtBQUssR0FBRyxDQUFDLE1BQWlDLEVBQUUsR0FBWSxFQUFFLEVBQUUsQ0FDaEUsR0FBRyxDQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBWSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFBO0FBQ25GLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBVSxFQUFFLEVBQUUsQ0FDekIsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBQyxPQUFPLEVBQUMsR0FBRyxFQUFDLE1BQU0sRUFBQyxHQUFHLEVBQUMsTUFBTSxFQUFDLEdBQUcsRUFBQyxRQUFRLEVBQUMsR0FBRyxFQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDLENBQUMsQ0FBQTtBQUU5RyxTQUFTLGdCQUFnQixDQUFDLEtBQVU7SUFDbEMsTUFBTSxFQUFFLEdBQUcsS0FBSyxFQUFFLGFBQWEsSUFBSSxFQUFFLENBQUE7SUFDckMsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLFFBQVEsSUFBSSxFQUFFLENBQUE7SUFDN0IsT0FBTztRQUNMLEtBQUssRUFBRyxFQUFFLENBQUMsVUFBcUIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxTQUFTO1FBQ3ZFLE9BQU8sRUFBRyxFQUFFLENBQUMsY0FBeUIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFD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