"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
const revalidate_1 = require("./utils/revalidate");
async function handler(_) {
    await (0, revalidate_1.revalidateAllStorefronts)(["products"]);
}
exports.config = { event: "variant.updated" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFyaWFudC11cGRhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3N1YnNjcmliZXJzL3ZhcmlhbnQtdXBkYXRlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwwQkFFQztBQUpELG1EQUE2RDtBQUU5QyxLQUFLLFVBQVUsT0FBTyxDQUFDLENBQWlCO0lBQ3JELE1BQU0sSUFBQSxxQ0FBd0IsRUFBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7QUFDOUMsQ0FBQztBQUNZLFFBQUEsTUFBTSxHQUFxQixFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxDQUFBIn0=