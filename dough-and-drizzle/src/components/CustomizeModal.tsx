"use client";

import { useState } from "react";
import { Product, AddOn, CartItem, ProductSize, useStore } from "@/context/StoreContext";
import styles from "./CustomizeModal.module.css";

interface Props {
  product: Product;
  onClose: () => void;
}

const SIZES: { label: ProductSize; adj: number }[] = [
  { label: "Small", adj: -10 },
  { label: "Regular", adj: 0 },
  { label: "Large", adj: 20 },
];

export default function CustomizeModal({ product, onClose }: Props) {
  const { addToCart, toggleCart } = useStore();
  const [size, setSize] = useState<ProductSize>("Regular");
  const [flavor, setFlavor] = useState(product.flavors[0] ?? "");
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);

  const sizeAdj = SIZES.find((s) => s.label === size)?.adj ?? 0;
  const addOnTotal = selectedAddOns.reduce((a, b) => a + b.price, 0);
  const unitPrice = product.basePrice + sizeAdj + addOnTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns((prev) =>
      prev.some((a) => a.label === addOn.label)
        ? prev.filter((a) => a.label !== addOn.label)
        : [...prev, addOn]
    );
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      cartId: `${product.id}-${Date.now()}`,
      product,
      size,
      flavor,
      addOns: selectedAddOns,
      quantity,
      specialNote: note,
    };
    addToCart(cartItem);
    setAdded(true);
    setTimeout(() => {
      onClose();
      toggleCart(true);
    }, 700);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.emojiBox}>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className={styles.headerImg} />
            ) : (
              product.emoji
            )}
          </div>
          <div>
            <h2 className={styles.productName}>{product.name}</h2>
            <p className={styles.description}>{product.description}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* Size */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>✨ Size</h3>
            <div className={styles.sizeRow}>
              {SIZES.map(({ label, adj }) => (
                <button
                  key={label}
                  className={`${styles.sizeBtn} ${size === label ? styles.sizeBtnActive : ""}`}
                  onClick={() => setSize(label)}
                >
                  <span>{label}</span>
                  <span className={styles.sizeAdj}>
                    {adj === 0 ? "Base" : adj > 0 ? `+₱${adj}` : `-₱${Math.abs(adj)}`}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Flavor */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>🍓 Flavor</h3>
            <div className={styles.flavorGrid}>
              {product.flavors.map((f) => (
                <button
                  key={f}
                  className={`${styles.flavorBtn} ${flavor === f ? styles.flavorBtnActive : ""}`}
                  onClick={() => setFlavor(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </section>

          {/* Add-ons */}
          {product.addOns.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>🧁 Add-ons</h3>
              <div className={styles.addOnList}>
                {product.addOns.map((a) => {
                  const checked = selectedAddOns.some((x) => x.label === a.label);
                  return (
                    <button
                      key={a.label}
                      className={`${styles.addOnBtn} ${checked ? styles.addOnBtnActive : ""}`}
                      onClick={() => toggleAddOn(a)}
                    >
                      <span className={styles.addOnCheck}>{checked ? "✓" : "+"}</span>
                      <span className={styles.addOnLabel}>{a.label}</span>
                      <span className={styles.addOnPrice}>+₱{a.price}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Special note */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>📝 Special Note</h3>
            <textarea
              className={styles.noteInput}
              placeholder="Any special requests? (e.g. no nuts, extra sweet...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </section>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.qtyRow}>
            <button className={styles.qtyBtn} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
            <span className={styles.qty}>{quantity}</span>
            <button className={styles.qtyBtn} onClick={() => setQuantity((q) => q + 1)}>+</button>
          </div>
          <button
            className={`${styles.addBtn} ${added ? styles.addBtnAdded : ""}`}
            onClick={handleAddToCart}
            disabled={added}
          >
            {added ? "✓ Added!" : `Add to Cart · ₱${totalPrice}`}
          </button>
        </div>
      </div>
    </>
  );
}
