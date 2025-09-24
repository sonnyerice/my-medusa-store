// English comments only
import "dotenv/config"
import nodemailer from "nodemailer"

console.log("[smtp] host:", process.env.SMTP_HOST, "port:", process.env.SMTP_PORT)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                      // e.g. mail.popinae.ch
  port: Number(process.env.SMTP_PORT || 587),       // 587 for STARTTLS
  secure: process.env.SMTP_SECURE === "true",       // true only for 465
  requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  logger: true,                                     // verbose output
  debug: true,
})

await transporter.verify().then(() => console.log("[smtp] verify OK"))

const from = process.env.NOTIFICATION_PROVIDER_FROM || process.env.SMTP_USER
const to = process.env.NOTIF_FALLBACK_TO || process.env.SMTP_USER

const info = await transporter.sendMail({
  from,
  to,
  subject: "SMTP OK — Popinae",
  text: "If you see this, SMTP works.",
})
console.log("[smtp] sent:", info.messageId)
