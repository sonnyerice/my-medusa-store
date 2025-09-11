"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = onProductCreatedEmail;
const utils_1 = require("@medusajs/framework/utils");
async function onProductCreatedEmail({ event: { data }, container, }) {
    const notification = container.resolve(utils_1.Modules.NOTIFICATION);
    const query = container.resolve("query");
    const { data: [product] } = await query.graph({
        entity: "product",
        fields: ["id", "title", "handle"],
        filters: { id: data.id },
    });
    // 👇 Ojo: usar "content" (no "data")
    await notification.createNotifications([
        {
            to: process.env.SMTP_USER, // cambia al destino que quieras
            channel: "email",
            template: "product-created", // requerido por Medusa; el plugin no lo usa internamente
            // puedes sobreescribir el remitente si quieres:
            // from: "no-reply@popinae.com",
            content: {
                subject: `New product: ${product.title}`,
                text: `Created: ${product.title}\nHandle: ${product.handle}`,
                html: `<p><strong>Created:</strong> ${product.title}<br/>Handle: ${product.handle}</p>`
            }
        }
    ]);
}
exports.config = {
    event: "product.created",
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdC1jcmVhdGVkLmVtYWlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3N1YnNjcmliZXJzL3Byb2R1Y3QtY3JlYXRlZC5lbWFpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFJQSx3Q0E0QkM7QUEvQkQscURBQW1EO0FBR3BDLEtBQUssVUFBVSxxQkFBcUIsQ0FBQyxFQUNsRCxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFDZixTQUFTLEdBQ3NCO0lBQy9CLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQTZCLGVBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQTtJQUN4RixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBRXhDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBQztRQUM1QyxNQUFNLEVBQUUsU0FBUztRQUNqQixNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQztRQUNqQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtLQUN6QixDQUFDLENBQUE7SUFFRixxQ0FBcUM7SUFDckMsTUFBTSxZQUFZLENBQUMsbUJBQW1CLENBQUM7UUFDckM7WUFDRSxFQUFFLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFVLEVBQUcsZ0NBQWdDO1lBQzdELE9BQU8sRUFBRSxPQUFPO1lBQ2hCLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSx5REFBeUQ7WUFDdEYsZ0RBQWdEO1lBQ2hELGdDQUFnQztZQUNoQyxPQUFPLEVBQUU7Z0JBQ1AsT0FBTyxFQUFFLGdCQUFnQixPQUFPLENBQUMsS0FBSyxFQUFFO2dCQUN4QyxJQUFJLEVBQUUsWUFBWSxPQUFPLENBQUMsS0FBSyxhQUFhLE9BQU8sQ0FBQyxNQUFNLEVBQUU7Z0JBQzVELElBQUksRUFBRSxnQ0FBZ0MsT0FBTyxDQUFDLEtBQUssZ0JBQWdCLE9BQU8sQ0FBQyxNQUFNLE1BQU07YUFDeEY7U0FDRjtLQUNGLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFWSxRQUFBLE1BQU0sR0FBcUI7SUFDdEMsS0FBSyxFQUFFLGlCQUFpQjtDQUN6QixDQUFBIn0=