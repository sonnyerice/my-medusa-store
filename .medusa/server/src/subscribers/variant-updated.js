"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
const revalidate_1 = require("../utils/revalidate");
async function handler(_) {
    console.log("[sub] product-variant.updated → revalidate products");
    await (0, revalidate_1.revalidateAllStorefronts)(["products"]);
}
exports.config = {
    event: "product-variant.updated",
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFyaWFudC11cGRhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3N1YnNjcmliZXJzL3ZhcmlhbnQtdXBkYXRlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwwQkFHQztBQUxELG9EQUE4RDtBQUUvQyxLQUFLLFVBQVUsT0FBTyxDQUFDLENBQWlCO0lBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMscURBQXFELENBQUMsQ0FBQTtJQUNsRSxNQUFNLElBQUEscUNBQXdCLEVBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO0FBQzlDLENBQUM7QUFFWSxRQUFBLE1BQU0sR0FBcUI7SUFDdEMsS0FBSyxFQUFFLHlCQUF5QjtDQUNqQyxDQUFBIn0=