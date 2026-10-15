"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import styles from "./CartDrawer.module.css";

const SIZE_ADJUSTMENTS: Record<string, number> = {
  Small: -10,
  Regular: 0,
  Large: 20,
};

export default function CartDrawer() {
  const router = useRouter();
  const { state, removeFromCart, updateQuantity, clearCart, toggleCart, cartTotal, cartCount } = useStore();

  if (!state.cartOpen) return null;

  const itemPrice = (item: typeof state.cart[0]) => {
    const sizeAdj = SIZE_ADJUSTMENTS[item.size] ?? 0;
    const addOnTotal = item.addOns.reduce((a, b) => a + b.price, 0);
    return (item.product.basePrice + sizeAdj + addOnTotal) * item.quantity;
  };

  return (
    <>
      <div className={styles.overlay} onClick={() => toggleCart(false)} />
      <aside className={styles.drawer}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>🛍️ My Cart</h2>
            <span className={styles.count}>{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
          </div>
          <button className={styles.closeBtn} onClick={() => toggleCart(false)}>✕</button>
        </div>

        {state.cart.length === 0 ? (
          <div className={styles.empty}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Dough & Drizzle" className={styles.emptyLogo} />
            <p className={styles.emptyText}>Your cart is empty!</p>
            <p className={styles.emptyHint}>Add something sweet~</p>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {state.cart.map((item) => (
                <div key={item.cartId} className={styles.item}>
                  <div className={styles.itemEmoji}>{item.product.emoji}</div>
                  <div className={styles.itemDetails}>
                    <p className={styles.itemName}>{item.product.name}</p>
                    <div className={styles.itemMeta}>
                      <span>{item.size}</span>
                      {item.flavor && <span>· {item.flavor}</span>}
                    </div>
                    {item.addOns.length > 0 && (
                      <div className={styles.itemAddons}>
                        {item.addOns.map((a) => (
                          <span key={a.label} className={styles.addonChip}>+{a.label}</span>
                        ))}
                      </div>
                    )}
                    {item.specialNote && (
                      <p className={styles.itemNote}>📝 {item.specialNote}</p>
                    )}
                    <div className={styles.itemBottom}>
                      <p className={styles.itemPrice}>₱{itemPrice(item)}</p>
                      <div className={styles.qtyControl}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => item.quantity > 1 ? updateQuantity(item.cartId, item.quantity - 1) : removeFromCart(item.cartId)}
                        >−</button>
                        <span className={styles.qty}>{item.quantity}</span>
                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.cartId, item.quantity + 1)}>+</button>
                      </div>
                    </div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeFromCart(item.cartId)}>🗑️</button>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <button className={styles.clearBtn} onClick={clearCart}>Clear all</button>
              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.total}>₱{cartTotal}</span>
              </div>
              <button
                className={styles.checkoutBtn}
                id="cart-checkout-btn"
                onClick={() => {
                  toggleCart(false);
                  router.push("/checkout");
                }}
              >
                Confirm Order Details 🎀
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
