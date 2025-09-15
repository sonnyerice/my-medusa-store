"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
const revalidate_1 = require("../utils/revalidate");
async function handler(_) {
    await (0, revalidate_1.revalidateAllStorefronts)(["products"]);
}
exports.config = { event: "product.collection.updated" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdC1jb2xsZWN0aW9uLXVwZGF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc3Vic2NyaWJlcnMvcHJvZHVjdC1jb2xsZWN0aW9uLXVwZGF0ZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsMEJBRUM7QUFKRCxvREFBOEQ7QUFFL0MsS0FBSyxVQUFVLE9BQU8sQ0FBQyxDQUFpQjtJQUNyRCxNQUFNLElBQUEscUNBQXdCLEVBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO0FBQzlDLENBQUM7QUFDWSxRQUFBLE1BQU0sR0FBcUIsRUFBRSxLQUFLLEVBQUUsNEJBQTRCLEVBQUUsQ0FBQSJ9