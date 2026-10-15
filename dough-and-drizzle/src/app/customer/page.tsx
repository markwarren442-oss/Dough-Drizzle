"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore, Product } from "@/context/StoreContext";
import CustomizeModal from "@/components/CustomizeModal";
import styles from "./customer.module.css";

const CATEGORIES = ["All", "cookie", "muffin", "brownie", "cinnamon-roll"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  All: "🍽️ All",
  cookie: "🍪 Cookies",
  muffin: "🧁 Muffins",
  brownie: "🟫 Brownies",
  "cinnamon-roll": "🌀 Cinnamon Rolls",
};

export default function CustomerPage() {
  const { state, toggleCart, cartCount } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  const filtered = state.products.filter(
    (p) => p.available && (activeCategory === "All" || p.category === activeCategory)
  );

  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <header className={styles.header}>
        <div className={styles.headerBg} />
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Dough & Drizzle" className={styles.logoImg} />
            <div>
              <h1 className={styles.logoTitle}>Dough & Drizzle</h1>
              <p className={styles.logoSub}>Homemade with love ✨</p>
            </div>
          </div>
          <button className={styles.cartBtn} onClick={() => toggleCart(true)} id="cart-button">
            🛍️
            {cartCount > 0 && (
              <span className={styles.cartBadge}>{cartCount}</span>
            )}
          </button>
        </div>

        {/* Hero image + greeting */}
        <div className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.greeting}>Hello there! 👋</p>
            <h2 className={styles.heroTitle}>What sweet treat<br />are you craving? 🍪</h2>
            <p className={styles.heroSub}>Fresh baked daily, made with 💕</p>
          </div>
          <div className={styles.heroDecor}>
            <div className={styles.floatDot1} />
            <div className={styles.floatDot2} />
            <div className={styles.floatDot3} />
          </div>
        </div>
      </header>

      {/* Active Order Banner (if any orders placed) */}
      {state.orders.length > 0 && (
        <div
          className={styles.activeOrderBanner}
          onClick={() => setShowOrdersModal(true)}
          style={{ cursor: "pointer" }}
          id="customer-active-order-banner"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>
              {state.orders[0].status === "Pending" && "⏳"}
              {state.orders[0].status === "Confirmed" && "📅"}
              {state.orders[0].status === "Out for Delivery" && "🛵"}
              {state.orders[0].status === "Delivered" && "✅"}
              {state.orders[0].status === "Cancelled" && "❌"}
            </span>
            <div>
              <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "13px", color: "#3d2b1f" }}>
                Order #{state.orders[0].id} · <span style={{ color: "var(--pink-deep)" }}>{state.orders[0].status}</span>
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#8a6d7a" }}>
                {state.orders[0].deliveryDate && state.orders[0].deliveryTime
                  ? `Delivery on ${state.orders[0].deliveryDate} at ${state.orders[0].deliveryTime}`
                  : "Awaiting kitchen delivery date & time schedule"}
              </p>
            </div>
          </div>
          <span style={{ fontSize: "12px", color: "var(--pink-deep)", fontWeight: 800 }}>View Details →</span>
        </div>
      )}

      {/* Category Filter */}
      <div className={styles.catWrap}>
        <div className={styles.categories}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.catBtn} ${activeCategory === cat ? styles.catBtnActive : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <main className={styles.main}>
        <p className={styles.sectionLabel}>
          {activeCategory === "All" ? "✨ All Sweet Treats" : CATEGORY_LABELS[activeCategory]}
          <span className={styles.productCount}> · {filtered.length} items</span>
        </p>

        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyEmoji}>😔</div>
            <p>No items available in this category right now.</p>
          </div>
        )}

        <div className={styles.grid}>
          {filtered.map((product, i) => (
            <div
              key={product.id}
              className={styles.card}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              {product.tag && (
                <span className={`${styles.cardTag} tag tag-${product.tagColor}`}>
                  {product.tag}
                </span>
              )}
              <div className={styles.cardMedia}>
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className={styles.cardImg} />
                ) : (
                  <span className={styles.cardEmoji}>{product.emoji}</span>
                )}
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardName}>{product.name}</h3>
                <p className={styles.cardDesc}>{product.description}</p>
                <div className={styles.cardFlavors}>
                  {product.flavors.slice(0, 3).map((f) => (
                    <span key={f} className={styles.flavorTag}>{f}</span>
                  ))}
                  {product.flavors.length > 3 && (
                    <span className={styles.flavorMore}>+{product.flavors.length - 3}</span>
                  )}
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.price}>₱{product.basePrice}</span>
                  <button
                    className={styles.addBtn}
                    onClick={() => setSelectedProduct(product)}
                    id={`add-${product.id}`}
                  >
                    + Customize
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className={styles.bottomNav}>
        <button
          className={`${styles.navBtn} ${!showOrdersModal ? styles.navBtnActive : ""}`}
          onClick={() => setShowOrdersModal(false)}
        >
          <span>🏠</span>
          <span>Home</span>
        </button>
        <button className={styles.navBtn} onClick={() => toggleCart(true)}>
          <span>🛍️</span>
          <span>Cart {cartCount > 0 && `(${cartCount})`}</span>
        </button>
        <button
          className={`${styles.navBtn} ${showOrdersModal ? styles.navBtnActive : ""}`}
          onClick={() => setShowOrdersModal(true)}
          id="customer-orders-nav-btn"
        >
          <span>📦</span>
          <span>Orders {state.orders.length > 0 && `(${state.orders.length})`}</span>
        </button>
        <Link href="/admin" className={styles.navBtn}>
          <span>🛠️</span>
          <span>Admin</span>
        </Link>
      </nav>

      {/* Customer Orders Modal */}
      {showOrdersModal && (
        <div className={styles.modalOverlay} onClick={() => setShowOrdersModal(false)}>
          <div className={styles.ordersModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Your Orders 📦</h2>
              <button className={styles.modalCloseBtn} onClick={() => setShowOrdersModal(false)}>✕</button>
            </div>

            {state.orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 10px", color: "#8a6d7a" }}>
                <span style={{ fontSize: "48px" }}>🍪</span>
                <p style={{ fontWeight: 800, marginTop: 8, color: "#3d2b1f" }}>No orders placed yet!</p>
                <p style={{ fontSize: "12px", color: "#aaa" }}>
                  Add your favorite treats to the cart and confirm your delivery to Bulalacao or Roxas!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {state.orders.map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      background: "#fff9fb",
                      border: "1.5px solid #fde8f2",
                      borderRadius: "18px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "14px", color: "#3d2b1f" }}>#{ord.id}</strong>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          background:
                            ord.status === "Pending" ? "#fff3cd" :
                            ord.status === "Confirmed" ? "#e1f5fe" :
                            ord.status === "Out for Delivery" ? "#e0f2f1" :
                            ord.status === "Delivered" ? "#e8f5e9" : "#ffebee",
                          color:
                            ord.status === "Pending" ? "#856404" :
                            ord.status === "Confirmed" ? "#0277bd" :
                            ord.status === "Out for Delivery" ? "#00796b" :
                            ord.status === "Delivered" ? "#2e7d32" : "#c62828",
                        }}
                      >
                        {ord.status}
                      </span>
                    </div>

                    {/* Delivery schedule notice */}
                    {ord.deliveryDate && ord.deliveryTime ? (
                      <div style={{ background: "#e1f5fe", padding: "8px 12px", borderRadius: "10px", fontSize: "12px", color: "#0277bd" }}>
                        📅 Scheduled Delivery: <strong>{ord.deliveryDate}</strong> at <strong>{ord.deliveryTime}</strong>
                      </div>
                    ) : (
                      <div style={{ background: "#fffdf0", padding: "8px 12px", borderRadius: "10px", fontSize: "12px", color: "#b7791f", border: "1px dashed #ffeaa7" }}>
                        ⏳ <strong>Awaiting kitchen schedule</strong>: The admin will notify you on your Facebook Messenger (<strong>{ord.messenger}</strong>) with your delivery time!
                      </div>
                    )}

                    <div style={{ fontSize: "12px", color: "#555" }}>
                      <p style={{ margin: "2px 0" }}>📍 <strong>{ord.municipality}</strong> · {ord.barangayStreet}</p>
                      <p style={{ margin: "2px 0" }}>💬 Messenger: <strong>{ord.messenger}</strong></p>
                      <p style={{ margin: "2px 0" }}>💳 {ord.paymentMethod}</p>
                    </div>

                    <div style={{ borderTop: "1px dashed #fce4ec", paddingTop: "8px", fontSize: "12px", color: "#666" }}>
                      {ord.items.map((it, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>{it.quantity}x {it.product.name} ({it.size})</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontWeight: 800, color: "var(--pink-deep)", fontSize: "13px" }}>
                        <span>Total</span>
                        <span>₱{ord.total}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customize Modal */}
      {selectedProduct && (
        <CustomizeModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
