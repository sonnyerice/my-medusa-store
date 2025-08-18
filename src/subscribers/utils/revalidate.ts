import type { SubscriberArgs } from "@medusajs/framework"

const STOREFRONTS = (process.env.STORE_CORS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, "")) // quita barras finales
  .filter(Boolean)

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || ""

// Llama /api/revalidate en cada storefront con ?tags=products
export async function revalidateAllStorefronts(tags: string[]) {
  if (!STOREFRONTS.length) {
    console.warn("[revalidate] STORE_CORS vacío: no hay storefronts a notificar")
    return
  }

  const qs = new URLSearchParams({ tags: tags.join(",") }).toString()

  await Promise.all(
    STOREFRONTS.map(async (base) => {
      const url = `${base}/api/revalidate?${qs}`
      try {
        await fetch(url, {
          method: "GET",
          headers: REVALIDATE_SECRET
            ? { "x-revalidate-secret": REVALIDATE_SECRET }
            : {},
        })
      } catch (e) {
        console.error("[revalidate] error calling", url, e)
      }
    })
  )
}
