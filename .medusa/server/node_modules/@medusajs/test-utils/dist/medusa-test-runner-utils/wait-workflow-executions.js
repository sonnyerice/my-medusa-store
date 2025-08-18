"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitWorkflowExecutions = waitWorkflowExecutions;
const utils_1 = require("@medusajs/framework/utils");
/**
 * Waits for all workflow executions to finish. When relying on workflows but not necessarily
 * waiting for them to finish, this can be used to ensure that a test is not considered done while background executions are still running and can interfere with the other tests.
 * @param container - The container instance.
 * @returns A promise that resolves when all workflow executions have finished.
 */
async function waitWorkflowExecutions(container) {
    const wfe = container.resolve(utils_1.Modules.WORKFLOW_ENGINE, {
        allowUnregistered: true,
    });
    if (!wfe) {
        return;
    }
    const timeout = setTimeout(() => {
        throw new Error("Timeout waiting for workflow executions to finish");
    }, 60000).unref();
    let waitWorkflowsToFinish = true;
    while (waitWorkflowsToFinish) {
        const executions = await wfe.listWorkflowExecutions({
            state: { $nin: ["not_started", "done", "reverted", "failed"] },
        });
        if (executions.length === 0) {
            waitWorkflowsToFinish = false;
            clearTimeout(timeout);
            break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}
//# sourceMappingURL=wait-workflow-executions.js.map