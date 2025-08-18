type WaitSubscribersExecutionOptions = {
    /** Timeout in milliseconds for waiting for the event. Defaults to 15000ms. */
    timeout?: number;
    /** Number of times the event should be triggered before resolving. Defaults to 1. */
    triggerCount?: number;
};
/**
 * Allows you to wait for all subscribers to execute for a given event.
 * It ensures that concurrent waits for the same event are queued and executed sequentially.
 *
 * @param eventName - The name of the event to wait for.
 * @param eventBus - The event bus instance.
 * @param options - Options including timeout and triggerCount.
 */
export declare const waitSubscribersExecution: (eventName: string | symbol, eventBus: any, options?: WaitSubscribersExecutionOptions) => Promise<any>;
export {};
//# sourceMappingURL=events.d.ts.map