import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// ── Types matching the Order interface ────────────────────────────────────────
interface OrderItem {
  quantity: number;
  product: { name: string; emoji: string; basePrice: number };
  size: string;
  flavor: string;
  addOns: { label: string; price: number }[];
  specialNote?: string;
}

interface OrderEmailPayload {
  orderId: string;
  customerName: string;
  phone: string;
  municipality: string;
  barangayStreet: string;
  messenger: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: OrderItem[];
  specialInstructions?: string;
  createdAt: string;
}

// ── Email Template ───────────────────────────────────────────────────────────
function buildOrderEmailHTML(order: OrderEmailPayload): string {
  const dateStr = new Date(order.createdAt).toLocaleString("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });

  const itemRows = order.items
    .map((item) => {
      const addOns =
        item.addOns.length > 0
          ? `<br/><span style="color:#888;font-size:12px;">Add-ons: ${item.addOns.map((a) => a.label).join(", ")}</span>`
          : "";
      const note = item.specialNote
        ? `<br/><span style="color:#888;font-size:12px;">Note: "${item.specialNote}"</span>`
        : "";
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #fce4ec;">
            ${item.product.emoji} <strong>${item.product.name}</strong>
            <br/><span style="color:#888;font-size:12px;">Size: ${item.size} · Flavor: ${item.flavor}</span>
            ${addOns}${note}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #fce4ec;text-align:center;">${item.quantity}</td>
        </tr>`;
    })
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width"/>
  </head>
  <body style="margin:0;padding:0;background:#fdf5f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf5f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#f8b4c8,#d4a5c9);padding:28px 24px;text-align:center;">
                <h1 style="margin:0;font-size:22px;color:#fff;font-family:Georgia,serif;">🧁 New Order Received!</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">Dough & Drizzle — Fresh from the kitchen</p>
              </td>
            </tr>

            <!-- Order Badge -->
            <tr>
              <td style="padding:20px 24px 0;text-align:center;">
                <span style="display:inline-block;background:#fce4ec;color:#c2185b;padding:6px 18px;border-radius:20px;font-weight:700;font-size:15px;">
                  Order #${order.orderId}
                </span>
                <p style="margin:8px 0 0;color:#888;font-size:12px;">${dateStr}</p>
              </td>
            </tr>

            <!-- Customer Details -->
            <tr>
              <td style="padding:20px 24px;">
                <h2 style="margin:0 0 12px;font-size:14px;color:#c2185b;text-transform:uppercase;letter-spacing:0.5px;">📋 Customer Details</h2>
                <table width="100%" style="font-size:13px;color:#333;">
                  <tr>
                    <td style="padding:4px 0;color:#888;width:130px;">Name:</td>
                    <td style="padding:4px 0;font-weight:600;">${order.customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#888;">Phone:</td>
                    <td style="padding:4px 0;font-weight:600;">${order.phone}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#888;">Messenger:</td>
                    <td style="padding:4px 0;font-weight:600;color:#0066cc;">💬 ${order.messenger}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#888;">Municipality:</td>
                    <td style="padding:4px 0;font-weight:600;">📍 ${order.municipality}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#888;">Address:</td>
                    <td style="padding:4px 0;font-weight:600;">${order.barangayStreet}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#888;">Payment:</td>
                    <td style="padding:4px 0;font-weight:600;">${order.paymentMethod}</td>
                  </tr>
                  ${order.specialInstructions ? `
                  <tr>
                    <td style="padding:4px 0;color:#888;">Instructions:</td>
                    <td style="padding:4px 0;font-style:italic;">"${order.specialInstructions}"</td>
                  </tr>` : ""}
                </table>
              </td>
            </tr>

            <!-- Order Items -->
            <tr>
              <td style="padding:0 24px 20px;">
                <h2 style="margin:0 0 12px;font-size:14px;color:#c2185b;text-transform:uppercase;letter-spacing:0.5px;">🛒 Order Items</h2>
                <table width="100%" style="font-size:13px;border-collapse:collapse;">
                  <thead>
                    <tr style="background:#fdf0f5;">
                      <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;">Item</th>
                      <th style="padding:8px 12px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;">Qty</th>
                    </tr>
                  </thead>
                  <tbody>${itemRows}</tbody>
                </table>
              </td>
            </tr>

            <!-- Total Breakdown -->
            <tr>
              <td style="padding:0 24px 24px;">
                <table width="100%" style="background:#fdf0f5;border-radius:12px;padding:16px;font-size:13px;">
                  <tr>
                    <td style="padding:4px 16px;color:#666;">Subtotal:</td>
                    <td style="padding:4px 16px;text-align:right;font-weight:600;">₱${order.subtotal}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 16px;color:#666;">Delivery Fee:</td>
                    <td style="padding:4px 16px;text-align:right;font-weight:600;">₱${order.deliveryFee}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 16px;color:#c2185b;font-weight:700;font-size:16px;border-top:2px dashed #f8b4c8;">Grand Total:</td>
                    <td style="padding:8px 16px;text-align:right;color:#c2185b;font-weight:700;font-size:16px;border-top:2px dashed #f8b4c8;">₱${order.total}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Action CTA -->
            <tr>
              <td style="padding:0 24px 24px;text-align:center;">
                <p style="margin:0 0 12px;color:#888;font-size:12px;">Review and manage this order in your admin dashboard 👩‍🍳</p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#fdf0f5;padding:16px 24px;text-align:center;">
                <p style="margin:0;color:#888;font-size:11px;">
                  💕 Dough & Drizzle — Freshly baked with love from Oriental Mindoro
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

// ── API Handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const order: OrderEmailPayload = await req.json();

    // Validate required env vars
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_APP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || "fettywapeto@gmail.com";

    if (!emailUser || !emailPass) {
      console.warn(
        "⚠️ Email not configured: EMAIL_USER and EMAIL_APP_PASSWORD are required in .env.local"
      );
      return NextResponse.json(
        { success: false, message: "Email service not configured. Order was saved locally." },
        { status: 200 } // 200 so the order still goes through
      );
    }

    // Create SMTP transporter (Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Build and send email
    const emailHTML = buildOrderEmailHTML(order);

    await transporter.sendMail({
      from: `"🧁 Dough & Drizzle" <${emailUser}>`,
      to: adminEmail,
      subject: `🧁 New Order #${order.orderId} from ${order.customerName}!`,
      html: emailHTML,
    });

    console.log(`✅ Order email sent for #${order.orderId} to ${adminEmail}`);
    return NextResponse.json({ success: true, message: "Email sent!" });
  } catch (error) {
    console.error("❌ Failed to send order email:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send email, but order was saved." },
      { status: 200 } // Still 200 so order flow isn't broken
    );
  }
}
