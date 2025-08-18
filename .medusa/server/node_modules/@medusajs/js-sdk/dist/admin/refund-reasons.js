"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundReason = void 0;
class RefundReason {
    /**
     * @ignore
     */
    constructor(client) {
        this.client = client;
    }
    /**
     * This method retrieves a list of refund reasons. It sends a request to the
     * [List Refund Reasons](https://docs.medusajs.com/api/admin#refund-reasons_getrefundreasons)
     * API route.
     *
     * @param query - Filters and pagination configurations.
     * @param headers - Headers to pass in the request.
     * @returns The paginated list of refund reasons.
     *
     * @example
     * To retrieve the list of refund reasons:
     *
     * ```ts
     * sdk.admin.refundReason.list()
     * .then(({ refund_reasons, count, limit, offset }) => {
     *   console.log(refund_reasons)
     * })
     * ```
     *
     * To configure the pagination, pass the `limit` and `offset` query parameters.
     *
     * For example, to retrieve only 10 items and skip 10 items:
     *
     * ```ts
     * sdk.admin.refundReason.list({
     *   limit: 10,
     *   offset: 10
     * })
     * .then(({ refund_reasons, count, limit, offset }) => {
     *   console.log(refund_reasons)
     * })
     * ```
     *
     * Using the `fields` query parameter, you can specify the fields and relations to retrieve
     * in each refund reason:
     *
     * ```ts
     * sdk.admin.refundReason.list({
     *   fields: "id,name"
     * })
     * .then(({ refund_reasons, count, limit, offset }) => {
     *   console.log(refund_reasons)
     * })
     * ```
     *
     * Learn more about the `fields` property in the [API reference](https://docs.medusajs.com/api/admin#select-fields-and-relations).
     *
     */
    async list(query, headers) {
        return await this.client.fetch(`/admin/refund-reasons`, {
            query,
            headers,
        });
    }
}
exports.RefundReason = RefundReason;
//# sourceMappingURL=refund-reasons.js.map