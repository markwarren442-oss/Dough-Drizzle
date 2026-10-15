"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useStore, Product, AddOn, Order, OrderStatus } from "@/context/StoreContext";
import styles from "./admin.module.css";

interface Props {
  onLogout: () => void;
}

type Tab = "products" | "add" | "orders";

const CATEGORY_OPTIONS = [
  { value: "cookie", label: "🍪 Cookie" },
  { value: "muffin", label: "🧁 Muffin" },
  { value: "brownie", label: "🟫 Brownie" },
  { value: "cinnamon-roll", label: "🌀 Cinnamon Roll" },
] as const;

const TAG_COLORS = ["pink", "mint", "yellow", "lavender"] as const;

const EMPTY_FORM = {
  name: "",
  emoji: "🍪",
  description: "",
  basePrice: "",
  category: "cookie" as Product["category"],
  flavors: "",
  addOns: "",
  tag: "",
  tagColor: "pink" as Product["tagColor"],
  imageUrl: "",
};

export default function AdminDashboard({ onLogout }: Props) {
  const {
    state,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleAvailability,
    resetDefaultProducts,
    updateOrder,
    deleteOrder,
    pendingOrdersCount,
  } = useStore();

  const [tab, setTab] = useState<Tab>("products");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Orders management state
  const [orderFilter, setOrderFilter] = useState<"All" | OrderStatus>("All");
  const [scheduleInputs, setScheduleInputs] = useState<Record<string, { date: string; time: string; note: string }>>({});
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Convert and compress uploaded file to base64
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawResult = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          setImagePreview(compressed);
          setForm((prev) => ({ ...prev, imageUrl: compressed }));
        } else {
          setImagePreview(rawResult);
          setForm((prev) => ({ ...prev, imageUrl: rawResult }));
        }
      };
      img.onerror = () => {
        setImagePreview(rawResult);
        setForm((prev) => ({ ...prev, imageUrl: rawResult }));
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setForm((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      emoji: product.emoji,
      description: product.description,
      basePrice: String(product.basePrice),
      category: product.category,
      flavors: product.flavors.join(", "),
      addOns: product.addOns.map((a) => `${a.label}:${a.price}`).join(", "),
      tag: product.tag ?? "",
      tagColor: product.tagColor ?? "pink",
      imageUrl: product.imageUrl ?? "",
    });
    setImagePreview(product.imageUrl ?? "");
    setEditId(product.id);
    setTab("add");
  };

  const handleSave = () => {
    if (!form.name || !form.basePrice) return;

    const parsedAddOns: AddOn[] = form.addOns
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const [label, price] = s.split(":").map((x) => x.trim());
        return { label, price: Number(price) || 0 };
      });

    const parsedFlavors = form.flavors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const product: Product = {
      id: editId ?? `product-${Date.now()}`,
      name: form.name,
      emoji: form.emoji,
      description: form.description,
      basePrice: Number(form.basePrice),
      category: form.category,
      available: true,
      flavors: parsedFlavors,
      addOns: parsedAddOns,
      tag: form.tag || undefined,
      tagColor: (form.tag ? form.tagColor : undefined) as Product["tagColor"],
      imageUrl: form.imageUrl || undefined,
    };

    if (editId) {
      updateProduct(product);
    } else {
      addProduct(product);
    }

    setSaved(true);
    setForm(EMPTY_FORM);
    setImagePreview("");
    setEditId(null);
    setTimeout(() => {
      setSaved(false);
      setTab("products");
    }, 1200);
  };

  const resetForm = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setImagePreview("");
  };

  const getOrderNotificationText = (order: Order, date: string, time: string, note?: string) => {
    return `✨ Hello ${order.customerName}! 🍪
Your order #${order.id} from Dough & Drizzle has been CONFIRMED!

📅 Scheduled Delivery Date: ${date}
⏰ Scheduled Delivery Time: ${time}
📍 Delivery Address: ${order.barangayStreet}, ${order.municipality}
💰 Total Amount: ₱${order.total} (${order.paymentMethod})
${order.specialInstructions ? `📝 Special Note: ${order.specialInstructions}\n` : ""}${note ? `🧁 Baker Note: ${note}\n` : ""}
We are preparing your sweet treats fresh with love 💕 Thank you for ordering from Dough & Drizzle!`;
  };

  const handleConfirmAndNotify = (order: Order) => {
    const sched = scheduleInputs[order.id] || {
      date: order.deliveryDate || "",
      time: order.deliveryTime || "",
      note: order.adminNotes || "",
    };

    if (!sched.date || !sched.time) {
      alert("⚠️ Please enter both a Delivery Date and Delivery Time before confirming!");
      return;
    }

    updateOrder(order.id, {
      status: "Confirmed",
      deliveryDate: sched.date,
      deliveryTime: sched.time,
      adminNotes: sched.note,
    });

    const msg = getOrderNotificationText(order, sched.date, sched.time, sched.note);

    if (typeof navigator !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(msg);
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 4000);
    }

    // Open Messenger URL
    const clean = order.messenger.trim();
    let messengerUrl = "https://www.messenger.com";
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      messengerUrl = clean;
    } else if (clean.startsWith("m.me/")) {
      messengerUrl = `https://${clean}`;
    } else if (!clean.includes(" ") && clean.length > 0) {
      messengerUrl = `https://m.me/${encodeURIComponent(clean)}`;
    }

    window.open(messengerUrl, "_blank");
    alert(`🎉 Order #${order.id} Confirmed!\n\nDelivery scheduled for: ${sched.date} at ${sched.time}.\n\nThe notification message has been copied to your clipboard! Paste it into Messenger to notify ${order.customerName}.`);
  };

  const handleCopyMessage = (order: Order) => {
    const sched = scheduleInputs[order.id] || {
      date: order.deliveryDate || "Scheduled",
      time: order.deliveryTime || "TBD",
      note: order.adminNotes || "",
    };
    const msg = getOrderNotificationText(order, sched.date, sched.time, sched.note);
    if (typeof navigator !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(msg);
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 3000);
    }
  };

  const filteredOrders = state.orders.filter((o) =>
    orderFilter === "All" ? true : o.status === orderFilter
  );

  return (
    <div className={styles.dashPage}>
      {/* Header */}
      <header className={styles.dashHeader}>
        <div className={styles.dashBrand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Dough & Drizzle" className={styles.dashLogo} />
          <div>
            <h1 className={styles.dashTitle}>Kitchen Admin</h1>
            <p className={styles.dashSub}>Dough & Drizzle</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Link href="/" className={styles.viewShopBtn}>🛍️ View Shop</Link>
          <button className={styles.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{state.products.length}</span>
          <span className={styles.statLabel}>Products</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{state.products.filter((p) => p.available).length}</span>
          <span className={styles.statLabel}>Available</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{state.orders.length}</span>
          <span className={styles.statLabel}>
            Orders {pendingOrdersCount > 0 ? `(${pendingOrdersCount} new)` : ""}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "products" ? styles.tabActive : ""}`}
          onClick={() => { setTab("products"); resetForm(); }}
        >📋 Products</button>
        <button
          className={`${styles.tab} ${tab === "add" ? styles.tabActive : ""}`}
          onClick={() => { setTab("add"); resetForm(); }}
        >{editId ? "✏️ Edit" : "➕ Add Product"}</button>
        <button
          className={`${styles.tab} ${tab === "orders" ? styles.tabActive : ""}`}
          onClick={() => { setTab("orders"); resetForm(); }}
          id="admin-orders-tab"
        >
          📦 Orders ({state.orders.length})
          {pendingOrdersCount > 0 && (
            <span className={styles.tabBadge}>{pendingOrdersCount}</span>
          )}
        </button>
      </div>

      {/* Products List */}
      {tab === "products" && (
        <div className={styles.productList}>
          {state.products.map((product) => (
            <div key={product.id} className={`${styles.productRow} ${!product.available ? styles.productRowHidden : ""}`}>
              {/* Thumbnail: image if exists, else emoji */}
              <div className={styles.productRowThumb}>
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className={styles.productRowImg} />
                ) : (
                  <span>{product.emoji}</span>
                )}
              </div>
              <div className={styles.productRowInfo}>
                <div className={styles.productRowName}>{product.name}</div>
                <div className={styles.productRowMeta}>
                  ₱{product.basePrice} · {product.category}
                  {product.imageUrl && <span className={styles.hasImgBadge}> · 📷 Has Image</span>}
                  {!product.available && <span className={styles.hiddenBadge}> · Hidden</span>}
                </div>
              </div>
              <div className={styles.productRowActions}>
                <button
                  className={`${styles.actionBtn} ${product.available ? styles.actionToggleOn : styles.actionToggleOff}`}
                  onClick={() => toggleAvailability(product.id)}
                  title={product.available ? "Hide product" : "Show product"}
                >
                  {product.available ? "👁️" : "🙈"}
                </button>
                <button className={styles.actionBtn} onClick={() => handleEdit(product)} title="Edit">✏️</button>
                {deleteConfirm === product.id ? (
                  <button
                    className={`${styles.actionBtn} ${styles.actionDelete}`}
                    onClick={() => { deleteProduct(product.id); setDeleteConfirm(null); }}
                  >Confirm?</button>
                ) : (
                  <button
                    className={styles.actionBtn}
                    onClick={() => setDeleteConfirm(product.id)}
                    title="Delete"
                  >🗑️</button>
                )}
              </div>
            </div>
          ))}
          <div style={{ textAlign: "center", marginTop: "1rem", paddingBottom: "0.5rem" }}>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Reset all products back to default bakery items?")) {
                  resetDefaultProducts();
                }
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-light)",
                fontSize: "0.75rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              ↺ Reset Menu to Default Items
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Form */}
      {tab === "add" && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>{editId ? "✏️ Edit Product" : "➕ Add New Product"}</h2>

          {/* ── Image Upload ── */}
          <div className={`${styles.fieldGroup} ${styles.fieldFull}`} style={{ marginBottom: 4 }}>
            <label className={styles.fieldLabel}>📷 Product Image</label>

            {imagePreview ? (
              <div className={styles.imagePreviewWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                <div className={styles.imagePreviewOverlay}>
                  <button
                    className={styles.changeImgBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >🔄 Change</button>
                  <button className={styles.removeImgBtn} onClick={handleRemoveImage}>🗑️ Remove</button>
                </div>
              </div>
            ) : (
              <div
                className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneDrag : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                id="image-upload-zone"
              >
                <span className={styles.uploadIcon}>📷</span>
                <p className={styles.uploadText}>Tap to upload or drag & drop</p>
                <p className={styles.uploadHint}>PNG, JPG, WEBP up to 5MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFileInput}
              onChange={handleImageChange}
              id="image-file-input"
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Product Name *</label>
              <input
                className={styles.fieldInput}
                placeholder="e.g. Chocolate Chip Cookie"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                id="field-name"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Emoji (fallback)</label>
              <input
                className={styles.fieldInput}
                placeholder="🍪"
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                id="field-emoji"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
              <label className={styles.fieldLabel}>Description</label>
              <textarea
                className={styles.fieldTextarea}
                placeholder="Short and sweet description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                id="field-description"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Base Price (₱) *</label>
              <input
                type="number"
                className={styles.fieldInput}
                placeholder="45"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                id="field-price"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Category</label>
              <select
                className={styles.fieldSelect}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Product["category"] })}
                id="field-category"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
              <label className={styles.fieldLabel}>Flavors (comma-separated)</label>
              <input
                className={styles.fieldInput}
                placeholder="Classic, Double Choco, Matcha, Strawberry"
                value={form.flavors}
                onChange={(e) => setForm({ ...form, flavors: e.target.value })}
                id="field-flavors"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
              <label className={styles.fieldLabel}>Add-ons (format: label:price, label:price)</label>
              <input
                className={styles.fieldInput}
                placeholder="Extra choco chips:10, Sprinkles:5, Caramel drizzle:15"
                value={form.addOns}
                onChange={(e) => setForm({ ...form, addOns: e.target.value })}
                id="field-addons"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Tag (optional)</label>
              <input
                className={styles.fieldInput}
                placeholder="Best Seller"
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                id="field-tag"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Tag Color</label>
              <div className={styles.colorRow}>
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`${styles.colorDot} ${styles[`color-${c}`]} ${form.tagColor === c ? styles.colorDotActive : ""}`}
                    onClick={() => setForm({ ...form, tagColor: c })}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ""}`}
            onClick={handleSave}
            disabled={saved}
            id="save-product-btn"
          >
            {saved ? "✓ Saved!" : editId ? "💾 Save Changes" : "✨ Add Product"}
          </button>

          {editId && (
            <button className={styles.cancelBtn} onClick={() => { resetForm(); setTab("products"); }}>
              Cancel
            </button>
          )}
        </div>
      )}

      {/* ── Orders Management Tab ── */}
      {tab === "orders" && (
        <div>
          {/* Order Filter Pills */}
          <div className={styles.orderFilterBar}>
            {(["All", "Pending", "Confirmed", "Out for Delivery", "Delivered", "Cancelled"] as const).map((st) => {
              const count = st === "All" ? state.orders.length : state.orders.filter((o) => o.status === st).length;
              return (
                <button
                  key={st}
                  className={`${styles.orderFilterBtn} ${orderFilter === st ? styles.orderFilterBtnActive : ""}`}
                  onClick={() => setOrderFilter(st)}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#8a6d7a" }}>
              <span style={{ fontSize: "48px" }}>📦</span>
              <h3 style={{ margin: "12px 0 4px", color: "var(--pink-deep)", fontWeight: 800 }}>
                No {orderFilter !== "All" ? orderFilter.toLowerCase() : ""} orders yet
              </h3>
              <p style={{ fontSize: "12.5px", color: "#8a6d7a", margin: 0 }}>
                When customers confirm orders from Bulalacao or Roxas, they will appear here!
              </p>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {filteredOrders.map((order) => {
                const currentSched = scheduleInputs[order.id] || {
                  date: order.deliveryDate || "",
                  time: order.deliveryTime || "",
                  note: order.adminNotes || "",
                };

                const getStatusPillClass = () => {
                  switch (order.status) {
                    case "Pending": return styles.statusPending;
                    case "Confirmed": return styles.statusConfirmed;
                    case "Out for Delivery": return styles.statusOutForDelivery;
                    case "Delivered": return styles.statusDelivered;
                    case "Cancelled": return styles.statusCancelled;
                    default: return "";
                  }
                };

                const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const timeStr = new Date(order.createdAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={order.id} className={styles.orderCard} id={`order-card-${order.id}`}>
                    {/* Header */}
                    <div className={styles.orderTop}>
                      <div>
                        <span className={styles.orderId}>#{order.id}</span>
                        <span className={styles.orderDate}>{dateStr} at {timeStr}</span>
                      </div>
                      <span className={`${styles.statusPill} ${getStatusPillClass()}`}>
                        {order.status === "Pending" && "⏳ "}
                        {order.status === "Confirmed" && "📅 "}
                        {order.status === "Out for Delivery" && "🛵 "}
                        {order.status === "Delivered" && "✅ "}
                        {order.status === "Cancelled" && "❌ "}
                        {order.status}
                      </span>
                    </div>

                    {/* Customer & Location */}
                    <div className={styles.customerInfoBox}>
                      <div className={styles.customerRow}>
                        <span>👤 Customer:</span>
                        <strong>{order.customerName}</strong>
                      </div>
                      <div className={styles.customerRow}>
                        <span>📞 Phone:</span>
                        <strong>{order.phone}</strong>
                      </div>
                      <div className={styles.customerRow}>
                        <span>📍 Municipality:</span>
                        <strong style={{ color: "var(--pink-deep)" }}>{order.municipality}</strong>
                      </div>
                      <div className={styles.customerRow}>
                        <span>🏠 Address:</span>
                        <strong>{order.barangayStreet}</strong>
                      </div>
                      <div className={styles.customerRow} style={{ marginTop: 2 }}>
                        <span>💬 Messenger:</span>
                        <span className={styles.messengerTag}>
                          {order.messenger}
                        </span>
                      </div>
                      {order.specialInstructions && (
                        <div style={{ marginTop: 4, fontStyle: "italic", color: "#c08060", fontSize: "11.5px" }}>
                          📝 Customer Note: &ldquo;{order.specialInstructions}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Items List */}
                    <div className={styles.orderItemsBox}>
                      {order.items.map((item, i) => (
                        <div key={i} className={styles.orderItemLine}>
                          <span>
                            {item.quantity}x {item.product.name} ({item.size})
                            {item.flavor && ` · ${item.flavor}`}
                            {item.addOns.length > 0 && ` (+${item.addOns.map(a => a.label).join(", ")})`}
                          </span>
                        </div>
                      ))}
                      <div className={styles.orderItemLine} style={{ color: "#888", fontSize: "11px", marginTop: 4 }}>
                        <span>Delivery Fee ({order.municipality.split(",")[0]})</span>
                        <span>₱{order.deliveryFee}</span>
                      </div>
                      <div className={styles.orderTotalRow}>
                        <span>Total ({order.paymentMethod})</span>
                        <span>₱{order.total}</span>
                      </div>
                    </div>

                    {/* ── Admin Delivery Scheduling & Messenger Notification ── */}
                    <div className={styles.scheduleSection}>
                      <h4 className={styles.scheduleTitle}>
                        <span>📅</span>
                        <span>Set Delivery Schedule & Notify Messenger</span>
                      </h4>

                      <div className={styles.scheduleInputs}>
                        <div className={styles.scheduleField}>
                          <label className={styles.scheduleLabel}>Delivery Date</label>
                          <input
                            type="date"
                            className={styles.scheduleInput}
                            value={currentSched.date}
                            onChange={(e) =>
                              setScheduleInputs((prev) => ({
                                ...prev,
                                [order.id]: { ...currentSched, date: e.target.value },
                              }))
                            }
                          />
                        </div>

                        <div className={styles.scheduleField}>
                          <label className={styles.scheduleLabel}>Delivery Time</label>
                          <input
                            type="time"
                            className={styles.scheduleInput}
                            value={currentSched.time}
                            onChange={(e) =>
                              setScheduleInputs((prev) => ({
                                ...prev,
                                [order.id]: { ...currentSched, time: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className={styles.scheduleField}>
                        <label className={styles.scheduleLabel}>Baker Remarks (Optional)</label>
                        <input
                          type="text"
                          className={styles.scheduleInput}
                          placeholder="e.g. Fresh out of the oven! Rider is on the way."
                          value={currentSched.note}
                          onChange={(e) =>
                            setScheduleInputs((prev) => ({
                              ...prev,
                              [order.id]: { ...currentSched, note: e.target.value },
                            }))
                          }
                        />
                      </div>

                      {order.deliveryDate && order.deliveryTime && (
                        <div style={{ fontSize: "11.5px", color: "#0277bd", background: "#e1f5fe", padding: "6px 10px", borderRadius: "8px" }}>
                          ✓ Scheduled: <strong>{order.deliveryDate}</strong> at <strong>{order.deliveryTime}</strong>
                        </div>
                      )}

                      <button
                        className={styles.confirmNotifyBtn}
                        onClick={() => handleConfirmAndNotify(order)}
                        id={`confirm-notify-btn-${order.id}`}
                      >
                        💬 Confirm Order & Notify on Messenger
                      </button>

                      <button
                        className={styles.copyNotifyBtn}
                        onClick={() => handleCopyMessage(order)}
                      >
                        {copiedOrderId === order.id ? "✓ Copied to Clipboard!" : "📋 Copy Messenger Notification Text"}
                      </button>
                    </div>

                    {/* Quick Status Changers & Delete */}
                    <div className={styles.orderActionsRow}>
                      <span style={{ fontSize: "11px", color: "#888", fontWeight: 700 }}>Update Status:</span>
                      {order.status !== "Out for Delivery" && (
                        <button
                          className={styles.statusChangeBtn}
                          onClick={() => updateOrder(order.id, { status: "Out for Delivery" })}
                        >
                          🛵 Out for Delivery
                        </button>
                      )}
                      {order.status !== "Delivered" && (
                        <button
                          className={styles.statusChangeBtn}
                          onClick={() => updateOrder(order.id, { status: "Delivered" })}
                        >
                          ✅ Delivered
                        </button>
                      )}
                      {order.status !== "Cancelled" && (
                        <button
                          className={styles.statusChangeBtn}
                          style={{ color: "#c62828" }}
                          onClick={() => {
                            if (window.confirm(`Cancel order #${order.id}?`)) {
                              updateOrder(order.id, { status: "Cancelled" });
                            }
                          }}
                        >
                          ❌ Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
