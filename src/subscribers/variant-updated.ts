import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { revalidateAllStorefronts } from "../utils/revalidate"

export default async function handler(_: SubscriberArgs) {
  console.log("[sub] product-variant.updated → revalidate products")
  await revalidateAllStorefronts(["products"])
}

export const config: SubscriberConfig = {
  event: "product-variant.updated",
}