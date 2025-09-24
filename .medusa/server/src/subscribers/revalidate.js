"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = revalidateSubscriber;
function getStorefrontUrls() {
    return (process.env.STORE_CORS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}
async function pingAll(tags) {
    const urls = getStorefrontUrls();
    const secret = process.env.REVALIDATE_SECRET;
    if (!urls.length || !secret)
        return;
    await Promise.all(urls.map(async (base) => {
        const url = `${base}/api/revalidate?tags=${encodeURIComponent(tags)}`;
        try {
            await fetch(url, { headers: { "x-revalidate-secret": secret } });
        }
        catch (err) {
            // Keep going even if one storefront is down
            console.error("[revalidate] failed:", base, err.message);
        }
    }));
}
async function revalidateSubscriber({ event: { name } }) {
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
            await pingAll("products");
            break;
        case "collection.created":
        case "collection.updated":
        case "collection.deleted":
        case "product-collection.created":
        case "product-collection.updated":
        case "product-collection.deleted":
            await pingAll("collections");
            break;
        case "category.created":
        case "category.updated":
        case "category.deleted":
        case "product-category.created":
        case "product-category.updated":
        case "product-category.deleted":
            await pingAll("categories");
            break;
        default:
            // ignore other events
            break;
    }
}
exports.config = {
    event: "*",
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV2YWxpZGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zdWJzY3JpYmVycy9yZXZhbGlkYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQTJCQSx1Q0FnREM7QUF6RUQsU0FBUyxpQkFBaUI7SUFDeEIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQztTQUNsQyxLQUFLLENBQUMsR0FBRyxDQUFDO1NBQ1YsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDcEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQ3BCLENBQUM7QUFFRCxLQUFLLFVBQVUsT0FBTyxDQUFDLElBQVk7SUFDakMsTUFBTSxJQUFJLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQTtJQUNoQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFBO0lBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTTtRQUFFLE9BQU07SUFFbkMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1FBQ3RCLE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSx3QkFBd0Isa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQTtRQUNyRSxJQUFJLENBQUM7WUFDSCxNQUFNLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxxQkFBcUIsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDbEUsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYiw0Q0FBNEM7WUFDNUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLEVBQUcsR0FBYSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3JFLENBQUM7SUFDSCxDQUFDLENBQUMsQ0FDSCxDQUFBO0FBQ0gsQ0FBQztBQUVjLEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxFQUFrQjtJQUNwRiwrQkFBK0I7SUFDL0IsUUFBUSxJQUFJLEVBQUUsQ0FBQztRQUNiLEtBQUssaUJBQWlCLENBQUM7UUFDdkIsS0FBSyxpQkFBaUIsQ0FBQztRQUN2QixLQUFLLGlCQUFpQixDQUFDO1FBQ3ZCLEtBQUssb0JBQW9CLENBQUM7UUFDMUIsS0FBSyx5QkFBeUIsQ0FBQztRQUMvQixLQUFLLHlCQUF5QixDQUFDO1FBQy9CLEtBQUsseUJBQXlCLENBQUM7UUFDL0IsS0FBSyx3QkFBd0IsQ0FBQztRQUM5QixLQUFLLHdCQUF3QixDQUFDO1FBQzlCLEtBQUssd0JBQXdCLENBQUM7UUFDOUIsS0FBSyxxQkFBcUIsQ0FBQztRQUMzQixLQUFLLHFCQUFxQixDQUFDO1FBQzNCLEtBQUsscUJBQXFCLENBQUM7UUFDM0IsS0FBSyxzQkFBc0IsQ0FBQztRQUM1QixLQUFLLHNCQUFzQixDQUFDO1FBQzVCLEtBQUssc0JBQXNCLENBQUM7UUFDNUIsS0FBSyx3QkFBd0IsQ0FBQztRQUM5QixLQUFLLHdCQUF3QixDQUFDO1FBQzlCLEtBQUssd0JBQXdCO1lBRTNCLE1BQU0sT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQ3pCLE1BQUs7UUFFUCxLQUFLLG9CQUFvQixDQUFDO1FBQzFCLEtBQUssb0JBQW9CLENBQUM7UUFDMUIsS0FBSyxvQkFBb0IsQ0FBQztRQUMxQixLQUFLLDRCQUE0QixDQUFDO1FBQ2xDLEtBQUssNEJBQTRCLENBQUM7UUFDbEMsS0FBSyw0QkFBNEI7WUFDL0IsTUFBTSxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7WUFDNUIsTUFBSztRQUVQLEtBQUssa0JBQWtCLENBQUM7UUFDeEIsS0FBSyxrQkFBa0IsQ0FBQztRQUN4QixLQUFLLGtCQUFrQixDQUFDO1FBQ3hCLEtBQUssMEJBQTBCLENBQUM7UUFDaEMsS0FBSywwQkFBMEIsQ0FBQztRQUNoQyxLQUFLLDBCQUEwQjtZQUM3QixNQUFNLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQTtZQUMzQixNQUFLO1FBRVA7WUFDRSxzQkFBc0I7WUFDdEIsTUFBSztJQUNULENBQUM7QUFDSCxDQUFDO0FBRVksUUFBQSxNQUFNLEdBQXFCO0lBQ3RDLEtBQUssRUFBRSxHQUFHO0NBQ1gsQ0FBQSJ9