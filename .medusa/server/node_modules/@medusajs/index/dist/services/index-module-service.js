"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _IndexModuleService_isWorkerMode;
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const _types_1 = require("../types");
const _utils_1 = require("../utils");
const base_graphql_schema_1 = require("../utils/base-graphql-schema");
class IndexModuleService extends utils_1.ModulesSdkUtils.MedusaService({}) {
    get indexMetadataService_() {
        return this.container_.indexMetadataService;
    }
    get indexSyncService_() {
        return this.container_.indexSyncService;
    }
    get dataSynchronizer_() {
        return this.container_.dataSynchronizer;
    }
    get logger_() {
        try {
            return this.container_.logger;
        }
        catch (e) {
            return console;
        }
    }
    constructor(container, moduleDeclaration) {
        super(...arguments);
        this.moduleDeclaration = moduleDeclaration;
        _IndexModuleService_isWorkerMode.set(this, false);
        this.__hooks = {
            onApplicationStart() {
                return this.onApplicationStart_();
            },
        };
        this.container_ = container;
        this.moduleOptions_ = (moduleDeclaration.options ??
            moduleDeclaration);
        __classPrivateFieldSet(this, _IndexModuleService_isWorkerMode, moduleDeclaration.worker_mode !== "server", "f");
        const { [utils_1.Modules.EVENT_BUS]: eventBusModuleService, storageProviderCtr, storageProviderCtrOptions, } = container;
        this.eventBusModuleService_ = eventBusModuleService;
        this.storageProviderCtr_ = storageProviderCtr;
        this.storageProviderCtrOptions_ = storageProviderCtrOptions;
        if (!this.eventBusModuleService_) {
            throw new Error("EventBusModuleService is required for the IndexModule to work");
        }
    }
    async onApplicationStart_() {
        try {
            const executableSchema = this.buildSchemaObjectRepresentation_();
            this.storageProvider_ = new this.storageProviderCtr_(this.container_, Object.assign(this.storageProviderCtrOptions_ ?? {}, {
                schemaObjectRepresentation: this.schemaObjectRepresentation_,
                entityMap: this.schemaEntitiesMap_,
            }), this.moduleOptions_);
            this.registerListeners();
            if (this.storageProvider_.onApplicationStart) {
                await this.storageProvider_.onApplicationStart();
            }
            await (0, _utils_1.gqlSchemaToTypes)(executableSchema);
            /**
             * Only run the data synchronization in worker mode
             */
            if (__classPrivateFieldGet(this, _IndexModuleService_isWorkerMode, "f")) {
                this.dataSynchronizer_.onApplicationStart({
                    schemaObjectRepresentation: this.schemaObjectRepresentation_,
                    storageProvider: this.storageProvider_,
                });
                const configurationChecker = new _utils_1.Configuration({
                    logger: this.logger_,
                    schemaObjectRepresentation: this.schemaObjectRepresentation_,
                    indexMetadataService: this.indexMetadataService_,
                    indexSyncService: this.indexSyncService_,
                    dataSynchronizer: this.dataSynchronizer_,
                });
                const entitiesMetadataChanged = await configurationChecker.checkChanges();
                if (entitiesMetadataChanged.length) {
                    await this.dataSynchronizer_.syncEntities(entitiesMetadataChanged);
                }
            }
        }
        catch (e) {
            this.logger_.error(e);
        }
    }
    async query(config) {
        return await this.storageProvider_.query(config);
    }
    registerListeners() {
        const schemaObjectRepresentation = (this.schemaObjectRepresentation_ ??
            {});
        for (const [entityName, schemaEntityObjectRepresentation] of Object.entries(schemaObjectRepresentation)) {
            if (_types_1.schemaObjectRepresentationPropertiesToOmit.includes(entityName)) {
                continue;
            }
            ;
            schemaEntityObjectRepresentation.listeners.forEach((listener) => {
                this.eventBusModuleService_.subscribe(listener, this.storageProvider_.consumeEvent(schemaEntityObjectRepresentation));
            });
        }
    }
    buildSchemaObjectRepresentation_() {
        if (this.schemaObjectRepresentation_) {
            return;
        }
        const { objectRepresentation, entitiesMap, executableSchema } = (0, _utils_1.buildSchemaObjectRepresentation)(base_graphql_schema_1.baseGraphqlSchema + (this.moduleOptions_.schema ?? _utils_1.defaultSchema));
        this.schemaObjectRepresentation_ = objectRepresentation;
        this.schemaEntitiesMap_ = entitiesMap;
        return executableSchema;
    }
}
_IndexModuleService_isWorkerMode = new WeakMap();
exports.default = IndexModuleService;
//# sourceMappingURL=index-module-service.js.map