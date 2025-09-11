import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { INotificationModuleService } from "@medusajs/framework/types"

export default async function onProductCreatedEmail({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)
  const query = container.resolve("query")

  const { data: [product] } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
    filters: { id: data.id },
  })

  // 👇 Ojo: usar "content" (no "data")
  await notification.createNotifications([
    {
      to: process.env.SMTP_USER!,  // cambia al destino que quieras
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
  ])
}

export const config: SubscriberConfig = {
  event: "product.created",
}
