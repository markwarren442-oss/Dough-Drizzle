"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore, Municipality, Order } from "@/context/StoreContext";
import styles from "./checkout.module.css";

const MUNICIPALITIES: Municipality[] = [
  "Bulalacao, Oriental Mindoro",
  "Roxas, Oriental Mindoro",
];

const DELIVERY_FEES: Record<Municipality, number> = {
  "Bulalacao, Oriental Mindoro": 40,
  "Roxas, Oriental Mindoro": 50,
};

export default function CheckoutPage() {
  const { state, cartTotal, placeOrder } = useStore();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [municipality, setMunicipality] = useState<Municipality>("Bulalacao, Oriental Mindoro");
  const [barangayStreet, setBarangayStreet] = useState("");
  const [messenger, setMessenger] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash on Delivery (COD)" | "GCash">("Cash on Delivery (COD)");

  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = DELIVERY_FEES[municipality] || 40;
  const grandTotal = cartTotal + deliveryFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !barangayStreet.trim() || !messenger.trim()) {
      alert("Please fill in all required fields (Name, Phone, Address, and Facebook Messenger)!");
      return;
    }

    if (state.cart.length === 0) {
      alert("Your cart is empty! Please add items before placing an order.");
      return;
    }

    setSubmitting(true);
    try {
      const newOrder = await placeOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        municipality,
        barangayStreet: barangayStreet.trim(),
        messenger: messenger.trim(),
        specialInstructions: specialInstructions.trim() || undefined,
        paymentMethod,
        items: [...state.cart],
        subtotal: cartTotal,
        deliveryFee,
        total: grandTotal,
      });

      setPlacedOrder(newOrder);

      // 📧 Send email notification to admin (non-blocking)
      try {
        await fetch("/api/send-order-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: newOrder.id,
            customerName: newOrder.customerName,
            phone: newOrder.phone,
            municipality: newOrder.municipality,
            barangayStreet: newOrder.barangayStreet,
            messenger: newOrder.messenger,
            paymentMethod: newOrder.paymentMethod,
            subtotal: newOrder.subtotal,
            deliveryFee: newOrder.deliveryFee,
            total: newOrder.total,
            items: newOrder.items.map((item) => ({
              quantity: item.quantity,
              product: {
                name: item.product.name,
                emoji: item.product.emoji,
                basePrice: item.product.basePrice,
              },
              size: item.size,
              flavor: item.flavor,
              addOns: item.addOns,
              specialNote: item.specialNote,
            })),
            specialInstructions: newOrder.specialInstructions,
            createdAt: newOrder.createdAt,
          }),
        });
        console.log("📧 Order email notification sent!");
      } catch (emailErr) {
        console.warn("📧 Email notification failed (order still placed):", emailErr);
      }
    } catch (err: unknown) {
      console.error("Failed to place order:", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not place order: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // If order was placed successfully
  if (placedOrder) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.checkoutContainer}>
          <div className={styles.header}>
            <Link href="/" className={styles.backBtn}>← Back to Bakery</Link>
            <div className={styles.brandWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Dough & Drizzle" className={styles.logoImg} />
              <span className={styles.brandTitle}>Dough & Drizzle</span>
            </div>
          </div>

          <div className={styles.successCard}>
            <div className={styles.successEmoji}>🎉</div>
            <h1 className={styles.successTitle}>Order Received!</h1>
            <div className={styles.orderBadge}>Order #{placedOrder.id}</div>

            <div className={styles.statusNotice}>
              <h3 className={styles.statusTitle}>⏳ Pending Kitchen Confirmation</h3>
              <p className={styles.statusDesc}>
                Thank you, <strong>{placedOrder.customerName}</strong>! Our kitchen has received your order and is reviewing it.
              </p>
              <p className={styles.statusDesc} style={{ marginTop: 4 }}>
                <strong>What happens next?</strong> The admin will set your <strong>delivery date & time</strong> and contact you directly via your Facebook Messenger:
              </p>
              <p style={{ margin: "4px 0 0", color: "#0066cc", fontWeight: 700, fontSize: "13px" }}>
                💬 Messenger: {placedOrder.messenger}
              </p>
            </div>

            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span>Delivery Location:</span>
                <strong>{placedOrder.municipality}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Address:</span>
                <strong>{placedOrder.barangayStreet}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Contact Number:</span>
                <strong>{placedOrder.phone}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Payment:</span>
                <strong>{placedOrder.paymentMethod}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Total Amount:</span>
                <strong style={{ color: "var(--pink-deep)", fontSize: "15px" }}>₱{placedOrder.total}</strong>
              </div>
            </div>

            <div style={{ width: "100%", textAlign: "left", fontSize: "12px", color: "#888" }}>
              <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#444" }}>Items Ordered ({placedOrder.items.length}):</p>
              {placedOrder.items.map((item, idx) => (
                <div key={idx} style={{ padding: "4px 0", borderBottom: "1px dashed #f5e0ea" }}>
                  {item.quantity}x {item.product.name} ({item.size}) {item.flavor && `· ${item.flavor}`}
                </div>
              ))}
            </div>

            <Link href="/" className={styles.homeBtn}>
              Back to Home 🏠
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (state.cart.length === 0) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.checkoutContainer}>
          <div className={styles.header}>
            <Link href="/" className={styles.backBtn}>← Back to Bakery</Link>
            <div className={styles.brandWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Dough & Drizzle" className={styles.logoImg} />
              <span className={styles.brandTitle}>Dough & Drizzle</span>
            </div>
          </div>

          <div className={styles.card} style={{ textAlign: "center", padding: "48px 24px" }}>
            <span style={{ fontSize: "56px" }}>🍪</span>
            <h2 style={{ fontFamily: "Pacifico, cursive", color: "var(--pink-deep)", margin: "8px 0" }}>
              Your cart is empty!
            </h2>
            <p style={{ color: "#8a6d7a", fontSize: "14px", margin: "0 0 20px" }}>
              Add some of our freshly baked cookies, muffins, brownies, or cinnamon rolls first!
            </p>
            <Link href="/" className={styles.homeBtn} style={{ alignSelf: "center" }}>
              Browse Bakery Treats 🛍️
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.checkoutContainer}>
        {/* Header */}
        <header className={styles.header}>
          <Link href="/" className={styles.backBtn}>← Back to Bakery</Link>
          <div className={styles.brandWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Dough & Drizzle" className={styles.logoImg} />
            <span className={styles.brandTitle}>Dough & Drizzle</span>
          </div>
        </header>

        {/* Delivery Area Restriction Notice */}
        <div className={styles.deliveryBanner}>
          <span className={styles.bannerIcon}>📍</span>
          <p className={styles.bannerText}>
            <strong>Exclusive Delivery Service:</strong> We currently accept orders and deliver exclusively to <strong>Bulalacao</strong> and <strong>Roxas, Oriental Mindoro</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmitOrder} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 1. Review Order Items */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🧁</span>
              <h2 className={styles.cardTitle}>1. Order Items Review ({state.cart.length})</h2>
            </div>

            <div className={styles.itemsList}>
              {state.cart.map((item) => {
                const sizeExtra = item.size === "Large" ? 20 : item.size === "Small" ? -10 : 0;
                const addOnTotal = item.addOns.reduce((a, b) => a + b.price, 0);
                const itemTotal = (item.product.basePrice + sizeExtra + addOnTotal) * item.quantity;

                return (
                  <div key={item.cartId} className={styles.itemRow}>
                    <div className={styles.itemThumb}>
                      {item.product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.imageUrl} alt={item.product.name} className={styles.itemImg} />
                      ) : (
                        <span>{item.product.emoji}</span>
                      )}
                    </div>
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemName}>
                        {item.quantity}x {item.product.name}
                      </h4>
                      <p className={styles.itemDetails}>
                        Size: <strong>{item.size}</strong> {item.flavor && `· ${item.flavor}`}
                      </p>
                      {item.addOns.length > 0 && (
                        <p className={styles.itemDetails}>
                          Add-ons: {item.addOns.map((a) => a.label).join(", ")}
                        </p>
                      )}
                      {item.specialNote && (
                        <p className={styles.itemNote}>Note: &ldquo;{item.specialNote}&rdquo;</p>
                      )}
                    </div>
                    <div className={styles.itemPrice}>₱{itemTotal}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Customer & Delivery Address */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>📍</span>
              <h2 className={styles.cardTitle}>2. Delivery & Customer Details</h2>
            </div>

            {/* Customer Name */}
            <div className={styles.formGroup}>
              <label htmlFor="checkout-name" className={styles.label}>
                Full Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="customerName"
                className={styles.input}
                placeholder="e.g. Maria Santos"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                id="checkout-name"
                autoComplete="name"
              />
            </div>

            {/* Phone Number */}
            <div className={styles.formGroup}>
              <label htmlFor="checkout-phone" className={styles.label}>
                Mobile Number <span className={styles.required}>*</span>
              </label>
              <input
                type="tel"
                name="phone"
                className={styles.input}
                placeholder="e.g. 0917-123-4567"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                id="checkout-phone"
                autoComplete="tel"
              />
            </div>

            {/* Municipality Dropdown (Strictly Bulalacao or Roxas) */}
            <div className={styles.formGroup}>
              <label htmlFor="checkout-municipality" className={styles.label}>
                Municipality (Oriental Mindoro only) <span className={styles.required}>*</span>
              </label>
              <select
                name="municipality"
                className={styles.select}
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value as Municipality)}
                id="checkout-municipality"
              >
                {MUNICIPALITIES.map((mun) => (
                  <option key={mun} value={mun}>
                    {mun === "Bulalacao, Oriental Mindoro" ? "🏝️ " : "⚓ "}
                    {mun} (₱{DELIVERY_FEES[mun]} delivery)
                  </option>
                ))}
              </select>
              <p className={styles.fieldHint}>
                ✨ Only Bulalacao and Roxas are covered for fresh home delivery.
              </p>
            </div>

            {/* Barangay / Street / Landmark */}
            <div className={styles.formGroup}>
              <label htmlFor="checkout-address" className={styles.label}>
                Barangay, Street & Landmark <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="barangayStreet"
                className={styles.input}
                placeholder="e.g. Brgy. Poblacion, near Municipal Hall / Yellow Gate"
                required
                value={barangayStreet}
                onChange={(e) => setBarangayStreet(e.target.value)}
                id="checkout-address"
                autoComplete="street-address"
              />
            </div>

            {/* Facebook Messenger Notification Info */}
            <div className={styles.messengerBox}>
              <div className={styles.messengerBoxTitle}>
                <span>💬</span>
                <span>Facebook Messenger Notification</span>
              </div>
              <p className={styles.messengerBoxText}>
                The admin will set your delivery date & time after reviewing your order, and send the schedule straight to your Messenger!
              </p>
              <div className={styles.formGroup} style={{ marginTop: 6 }}>
                <label htmlFor="checkout-messenger" className={styles.label} style={{ color: "#0066cc" }}>
                  Your Facebook Messenger Name or Profile Link <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="messenger"
                  className={styles.input}
                  placeholder="e.g. Maria Santos (or m.me/maria.santos)"
                  required
                  value={messenger}
                  onChange={(e) => setMessenger(e.target.value)}
                  id="checkout-messenger"
                />
              </div>
            </div>

            {/* Special Instructions */}
            <div className={styles.formGroup}>
              <label htmlFor="checkout-instructions" className={styles.label}>Special Delivery Instructions (Optional)</label>
              <textarea
                id="checkout-instructions"
                name="specialInstructions"
                className={styles.textarea}
                placeholder="Special notes for the rider or baker..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>💳</span>
              <h2 className={styles.cardTitle}>3. Payment Method</h2>
            </div>

            <div className={styles.paymentOptions}>
              <label htmlFor="payment-cod" className={`${styles.paymentLabel} ${paymentMethod === "Cash on Delivery (COD)" ? styles.paymentActive : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  id="payment-cod"
                  value="Cash on Delivery (COD)"
                  checked={paymentMethod === "Cash on Delivery (COD)"}
                  onChange={() => setPaymentMethod("Cash on Delivery (COD)")}
                />
                <span>💵 Cash on Delivery</span>
              </label>

              <label htmlFor="payment-gcash" className={`${styles.paymentLabel} ${paymentMethod === "GCash" ? styles.paymentActive : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  id="payment-gcash"
                  value="GCash"
                  checked={paymentMethod === "GCash"}
                  onChange={() => setPaymentMethod("GCash")}
                />
                <span>📱 GCash</span>
              </label>
            </div>
          </div>

          {/* 4. Total Breakdown & Confirmation */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🧾</span>
              <h2 className={styles.cardTitle}>4. Order Summary</h2>
            </div>

            <div className={styles.summaryRow}>
              <span>Items Subtotal</span>
              <span>₱{cartTotal}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Delivery Fee ({municipality.split(",")[0]})</span>
              <span>₱{deliveryFee}</span>
            </div>

            <div className={styles.summaryTotalRow}>
              <span>Grand Total</span>
              <span className={styles.totalAmount}>₱{grandTotal}</span>
            </div>

            <button type="submit" className={styles.submitBtn} id="confirm-order-btn" disabled={submitting}>
              {submitting ? "Placing Order..." : "Confirm & Place Order ✨"}
            </button>
            <p style={{ textAlign: "center", fontSize: "11px", color: "#8a6d7a", margin: 0 }}>
              💕 Made fresh with love at Dough & Drizzle
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
