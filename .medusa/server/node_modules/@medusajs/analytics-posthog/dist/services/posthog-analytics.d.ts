import { PosthogAnalyticsServiceOptions, Logger, ProviderIdentifyAnalyticsEventDTO, ProviderTrackAnalyticsEventDTO } from "@medusajs/framework/types";
import { PostHog } from "posthog-node";
import { AbstractAnalyticsProviderService } from "@medusajs/framework/utils";
type InjectedDependencies = {
    logger: Logger;
};
export declare class PosthogAnalyticsService extends AbstractAnalyticsProviderService {
    static identifier: string;
    protected config_: PosthogAnalyticsServiceOptions;
    protected logger_: Logger;
    protected client_: PostHog;
    constructor({ logger }: InjectedDependencies, options: PosthogAnalyticsServiceOptions);
    track(data: ProviderTrackAnalyticsEventDTO): Promise<void>;
    identify(data: ProviderIdentifyAnalyticsEventDTO): Promise<void>;
    shutdown(): Promise<void>;
}
export {};
//# sourceMappingURL=posthog-analytics.d.ts.map