import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { revalidateAllStorefronts } from "./utils/revalidate"

export default async function handler(_: SubscriberArgs) {
  await revalidateAllStorefronts(["products"])
}
export const config: SubscriberConfig = { event: "product.deleted" }
