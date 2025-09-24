"use strict";
// src/subscribers/order-placed-email.ts
// KISS: plain text email on "order.placed" using Nodemailer (SMTP STARTTLS).
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = orderPlacedEmailSubscriber;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function orderPlacedEmailSubscriber({ eventName, data, container, }) {
    if (eventName !== "order.placed")
        return;
    try {
        // In Medusa v2, "data" suele traer el pedido.
        // Pero por seguridad, si no viene el email/display_id, intenta recuperar el pedido.
        let order = data;
        if (!order?.email || !order?.display_id) {
            try {
                const orderModuleService = container.resolve("orderModuleService");
                if (orderModuleService && data?.id) {
                    order = await orderModuleService.retrieveOrder(data.id);
                }
            }
            catch {
                // Si falla la recuperación, seguimos con lo que haya en data.
            }
        }
        const email = order?.email ?? data?.email;
        const displayId = order?.display_id ?? data?.display_id ?? order?.id ?? data?.id;
        if (!email) {
            console.warn("[order-placed-email] No email found on order, skipping.");
            return;
        }
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: false, // STARTTLS
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        const from = process.env.EMAIL_FROM ||
            "no-reply@popinae.com";
        const brand = process.env.BRAND_NAME || "Popinae";
        const subject = `Pedido recibido #${displayId}`;
        const text = `¡Gracias por tu compra en ${brand}!\n\n` +
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
    }
    catch (err) {
        console.error("[order-placed-email] Error sending email:", err);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JkZXItcGxhY2VkLWVtYWlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3N1YnNjcmliZXJzL29yZGVyLXBsYWNlZC1lbWFpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsd0NBQXdDO0FBQ3hDLDZFQUE2RTs7Ozs7QUFLN0UsNkNBa0VDO0FBcEVELDREQUFvQztBQUVyQixLQUFLLFVBQVUsMEJBQTBCLENBQUMsRUFDdkQsU0FBUyxFQUNULElBQUksRUFDSixTQUFTLEdBQ2dCO0lBQ3pCLElBQUksU0FBUyxLQUFLLGNBQWM7UUFBRSxPQUFPO0lBRXpDLElBQUksQ0FBQztRQUNILDhDQUE4QztRQUM5QyxvRkFBb0Y7UUFDcEYsSUFBSSxLQUFLLEdBQVEsSUFBSSxDQUFDO1FBRXRCLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQztnQkFDSCxNQUFNLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDbkUsSUFBSSxrQkFBa0IsSUFBSSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7b0JBQ25DLEtBQUssR0FBRyxNQUFNLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzFELENBQUM7WUFDSCxDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNQLDhEQUE4RDtZQUNoRSxDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLEtBQUssRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLEtBQUssQ0FBQztRQUMxQyxNQUFNLFNBQVMsR0FBRyxLQUFLLEVBQUUsVUFBVSxJQUFJLElBQUksRUFBRSxVQUFVLElBQUksS0FBSyxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxDQUFDO1FBRWpGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxJQUFJLENBQUMseURBQXlELENBQUMsQ0FBQztZQUN4RSxPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sV0FBVyxHQUFHLG9CQUFVLENBQUMsZUFBZSxDQUFDO1lBQzdDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVM7WUFDM0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSxHQUFHLENBQUM7WUFDMUMsTUFBTSxFQUFFLEtBQUssRUFBRSxXQUFXO1lBQzFCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTO2dCQUMzQixJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTO2FBQzVCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxJQUFJLEdBQ1IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVO1lBQ3RCLHNCQUFzQixDQUFDO1FBRXpCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFNBQVMsQ0FBQztRQUVsRCxNQUFNLE9BQU8sR0FBRyxvQkFBb0IsU0FBUyxFQUFFLENBQUM7UUFDaEQsTUFBTSxJQUFJLEdBQ1IsNkJBQTZCLEtBQUssT0FBTztZQUN6Qyw2QkFBNkIsU0FBUyxLQUFLO1lBQzNDLG9EQUFvRDtZQUNwRCxZQUFZLEtBQUssRUFBRSxDQUFDO1FBRXRCLE1BQU0sV0FBVyxDQUFDLFFBQVEsQ0FBQztZQUN6QixJQUFJO1lBQ0osRUFBRSxFQUFFLEtBQUs7WUFDVCxrRUFBa0U7WUFDbEUsT0FBTztZQUNQLElBQUk7U0FDTCxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLG1EQUFtRCxLQUFLLFNBQVMsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUM1RixDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbEUsQ0FBQztBQUNILENBQUMifQ==