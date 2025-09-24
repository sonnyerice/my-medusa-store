// src/subscribers/order-placed-email.ts
// KISS: plain text email on "order.placed" using Nodemailer (SMTP STARTTLS).

import type { MedusaEventHandlerParams } from "@medusajs/medusa";
import nodemailer from "nodemailer";

export default async function orderPlacedEmailSubscriber({
  eventName,
  data,
  container,
}: MedusaEventHandlerParams) {
  if (eventName !== "order.placed") return;

  try {
    // In Medusa v2, "data" suele traer el pedido.
    // Pero por seguridad, si no viene el email/display_id, intenta recuperar el pedido.
    let order: any = data;

    if (!order?.email || !order?.display_id) {
      try {
        const orderModuleService = container.resolve("orderModuleService");
        if (orderModuleService && data?.id) {
          order = await orderModuleService.retrieveOrder(data.id);
        }
      } catch {
        // Si falla la recuperación, seguimos con lo que haya en data.
      }
    }

    const email = order?.email ?? data?.email;
    const displayId = order?.display_id ?? data?.display_id ?? order?.id ?? data?.id;

    if (!email) {
      console.warn("[order-placed-email] No email found on order, skipping.");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false, // STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const from =
      process.env.EMAIL_FROM ||
      "no-reply@popinae.com";

    const brand = process.env.BRAND_NAME || "Popinae";

    const subject = `Pedido recibido #${displayId}`;
    const text =
      `¡Gracias por tu compra en ${brand}!\n\n` +
      `Hemos recibido tu pedido #${displayId}.\n` +
      `Te avisaremos en cuanto lo estemos preparando.\n\n` +
      `— Equipo ${brand}`;

    await transporter.sendMail({
      from,
      to: email,
      // bcc/replyTo los añadimos luego cuando incrementemos complejidad
      subject,
      text,
    });

    console.log(`[order-placed-email] Sent order confirmation to ${email} for #${displayId}`);
  } catch (err) {
    console.error("[order-placed-email] Error sending email:", err);
  }
}
