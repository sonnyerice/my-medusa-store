"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
(0, utils_1.loadEnv)(process.env.NODE_ENV || 'development', process.cwd());
exports.default = (0, utils_1.defineConfig)({
    projectConfig: {
        databaseUrl: process.env.DATABASE_URL,
        redisUrl: process.env.REDIS_URL,
        workerMode: process.env.WORKER_MODE || "shared",
        http: {
            storeCors: process.env.STORE_CORS,
            adminCors: process.env.ADMIN_CORS,
            authCors: process.env.AUTH_CORS,
            jwtSecret: process.env.JWT_SECRET,
            cookieSecret: process.env.COOKIE_SECRET,
        },
    },
    modules: [
        {
            resolve: "@medusajs/medusa/payment",
            options: {
                providers: [
                    {
                        resolve: "@medusajs/medusa/payment-stripe",
                        id: "stripe",
                        options: {
                            apiKey: process.env.STRIPE_API_KEY,
                            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                            automatic_payment_methods: process.env.STRIPE_AUTOMATIC_PAYMENT_METHODS === "true",
                            capture: process.env.STRIPE_CAPTURE === "true",
                        },
                    },
                ],
            },
        },
        {
            resolve: "@medusajs/medusa/notification",
            options: {
                providers: [
                    {
                        resolve: "@perseidesjs/notification-nodemailer/providers/nodemailer",
                        id: "nodemailer",
                        options: {
                            channels: ["email"],
                            from: process.env.NOTIFICATION_PROVIDER_FROM,
                            host: process.env.SMTP_HOST,
                            port: Number(process.env.SMTP_PORT),
                            secure: process.env.SMTP_SECURE === "true",
                            requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
                            auth: {
                                user: process.env.SMTP_USER,
                                pass: process.env.SMTP_PASS
                            }
                        },
                    },
                ],
            },
        },
        {
            resolve: "@medusajs/medusa/cache-redis",
            options: {
                redisUrl: process.env.REDIS_URL,
            },
        },
        {
            resolve: "@medusajs/medusa/event-bus-redis",
            options: {
                redisUrl: process.env.REDIS_URL,
            },
        },
        {
            resolve: "@medusajs/medusa/workflow-engine-redis",
            options: {
                redis: {
                    url: process.env.REDIS_URL,
                },
            },
        },
        {
            resolve: "@medusajs/medusa/file",
            options: {
                providers: [
                    {
                        resolve: "@medusajs/medusa/file-s3",
                        id: "s3",
                        options: {
                            file_url: process.env.S3_FILE_URL,
                            access_key_id: process.env.S3_ACCESS_KEY_ID,
                            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                            region: process.env.S3_REGION,
                            bucket: process.env.S3_BUCKET,
                            endpoint: process.env.S3_ENDPOINT,
                            // other options...
                        },
                    },
                ],
            },
        },
    ],
    admin: {
        disable: process.env.ADMIN_DISABLED === "true" || false,
        backendUrl: process.env.MEDUSA_BACKEND_URL,
        vite: () => ({
            server: {
                allowedHosts: process.env.ADMIN_ALLOWED_HOSTS?.split(',') ?? [],
                host: true,
                port: parseInt(process.env.ADMIN_VITE_PORT || "7000", 10),
            },
        }),
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkdXNhLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21lZHVzYS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBaUU7QUFFakUsSUFBQSxlQUFPLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO0FBRTdELGtCQUFlLElBQUEsb0JBQVksRUFBQztJQUMxQixhQUFhLEVBQUU7UUFDYixXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZO1FBQ3JDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVM7UUFDL0IsVUFBVSxFQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBOEMsSUFBSSxRQUFRO1FBQ25GLElBQUksRUFBRTtZQUNKLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVc7WUFDbEMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVztZQUNsQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFVO1lBQ2hDLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVU7WUFDakMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYTtTQUN4QztLQUNGO0lBRUQsT0FBTyxFQUFFO1FBQ1A7WUFDRSxPQUFPLEVBQUUsMEJBQTBCO1lBQ25DLE9BQU8sRUFBRTtnQkFDUCxTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsT0FBTyxFQUFFLGlDQUFpQzt3QkFDMUMsRUFBRSxFQUFFLFFBQVE7d0JBQ1osT0FBTyxFQUFFOzRCQUNQLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWM7NEJBQ2xDLGFBQWEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQjs0QkFDaEQseUJBQXlCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0Ms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