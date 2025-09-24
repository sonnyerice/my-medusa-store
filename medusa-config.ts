import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: (process.env.WORKER_MODE as "shared" | "worker" | "server") || "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
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
})
