import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

function getStorefrontUrls(): string[] {
  return (process.env.STORE_CORS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

async function pingAll(tags: string) {
  const urls = getStorefrontUrls()
  const secret = process.env.REVALIDATE_SECRET
  if (!urls.length || !secret) return

  await Promise.all(
    urls.map(async (base) => {
      const url = `${base}/api/revalidate?tags=${encodeURIComponent(tags)}`
      try {
        await fetch(url, { headers: { "x-revalidate-secret": secret } })
      } catch (err) {
        // Keep going even if one storefront is down
        console.error("[revalidate] failed:", base, (err as Error).message)
      }
    })
  )
}

export default async function revalidateSubscriber({ event: { name } }: SubscriberArgs) {
  // Minimal event → tags mapping
  switch (name) {
    case "product.created":
    case "product.updated":
    case "product.deleted":
    case "price-list.updated":
    case "product-variant.created":
    case "product-variant.updated":
    case "product-variant.deleted":
    case "product-option.created":
    case "product-option.updated":
    case "product-option.deleted":
    case "product-tag.created":
    case "product-tag.updated":
    case "product-tag.deleted":
    case "product-type.created":
    case "product-type.updated":
    case "product-type.deleted":
    case "inventory-item.created":
    case "inventory-item.updated":
    case "inventory-item.deleted":

      await pingAll("products")
      break

    case "collection.created":
    case "collection.updated":
    case "collection.deleted":
    case "product-collection.created":
    case "product-collection.updated":
    case "product-collection.deleted":  
      await pingAll("collections")
      break

    case "category.created":
    case "category.updated":
    case "category.deleted":
    case "product-category.created":
    case "product-category.updated":
    case "product-category.deleted":
      await pingAll("categories")
      break

    default:
      // ignore other events
      break
  }
}

export const config: SubscriberConfig = {
  event: "*",
}