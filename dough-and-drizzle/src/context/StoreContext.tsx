"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Types ────────────────────────────────────────────────────────────────────
export type ProductSize = "Small" | "Regular" | "Large";
export type AddOn = { label: string; price: number };

export interface Product {
  id: string;
  name: string;
  emoji: string;
  description: string;
  basePrice: number;
  category: "cookie" | "muffin" | "brownie" | "cinnamon-roll";
  available: boolean;
  flavors: string[];
  addOns: AddOn[];
  tag?: string;
  tagColor?: "pink" | "mint" | "yellow" | "lavender";
  imageUrl?: string;
}

export interface CartItem {
  cartId: string;
  product: Product;
  size: ProductSize;
  flavor: string;
  addOns: AddOn[];
  quantity: number;
  specialNote: string;
}

export type Municipality = "Bulalacao, Oriental Mindoro" | "Roxas, Oriental Mindoro";

export type OrderStatus = "Pending" | "Confirmed" | "Out for Delivery" | "Delivered" | "Cancelled";

export interface Order {
  id: string;
  createdAt: string;
  username: string;      // customer username for order lookup
  customerName: string;
  phone: string;
  municipality: Municipality;
  barangayStreet: string;
  messenger: string; // Facebook Messenger name / profile / link
  specialInstructions?: string;
  paymentMethod: "Cash on Delivery (COD)" | "GCash";
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  deliveryDate?: string; // set by admin
  deliveryTime?: string; // set by admin
  adminNotes?: string;   // optional admin remarks
}

// ── Default Products ──────────────────────────────────────────────────────────
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "cookie-choco",
    name: "Chocolate Chip Cookie",
    emoji: "🍪",
    description: "Crispy edges, chewy center, loaded with melty choco chips",
    basePrice: 45,
    category: "cookie",
    available: true,
    flavors: ["Classic", "Double Choco", "White Chocolate", "Matcha"],
    addOns: [
      { label: "Extra choco chips", price: 10 },
      { label: "Sprinkles", price: 5 },
      { label: "Caramel drizzle", price: 15 },
    ],
    tag: "Best Seller",
    tagColor: "pink",
  },
  {
    id: "muffin-blue",
    name: "Blueberry Muffin",
    emoji: "🧁",
    description: "Fluffy, moist muffin bursting with fresh blueberries",
    basePrice: 55,
    category: "muffin",
    available: true,
    flavors: ["Blueberry", "Chocolate", "Banana", "Strawberry"],
    addOns: [
      { label: "Cream cheese filling", price: 20 },
      { label: "Streusel topping", price: 10 },
      { label: "Extra glaze", price: 8 },
    ],
    tag: "New",
    tagColor: "mint",
  },
  {
    id: "brownie-fudge",
    name: "Fudgy Brownie",
    emoji: "🟫",
    description: "Dense, rich, chocolatey brownie with a shiny crackly top",
    basePrice: 60,
    category: "brownie",
    available: true,
    flavors: ["Classic Fudge", "Nutella Swirl", "S'mores", "Raspberry"],
    addOns: [
      { label: "Walnut chunks", price: 15 },
      { label: "Whipped cream", price: 12 },
      { label: "Ice cream scoop", price: 35 },
    ],
    tag: "Fan Fave",
    tagColor: "lavender",
  },
  {
    id: "cinnaroll-classic",
    name: "Cinnamon Roll",
    emoji: "🌀",
    description: "Soft pillowy swirls with cinnamon sugar & cream cheese glaze",
    basePrice: 75,
    category: "cinnamon-roll",
    available: true,
    flavors: ["Classic Cream", "Caramel Pecan", "Strawberry", "Lemon Zest"],
    addOns: [
      { label: "Extra glaze drizzle", price: 10 },
      { label: "Toasted pecans", price: 18 },
      { label: "Cream cheese icing", price: 12 },
    ],
    tag: "Limited",
    tagColor: "yellow",
  },
];

// ── State ─────────────────────────────────────────────────────────────────────
// Username stays local (per-browser session)
const USERNAME_STORAGE_KEY = "dough_and_drizzle_username_v1";

// Strip undefined fields — Firestore does not accept `undefined`
function cleanForFirestore<T extends object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

interface State {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  cartOpen: boolean;
  username: string | null;
  firestoreReady: boolean;
}

type Action =
  | { type: "LOAD_PRODUCTS"; products: Product[] }
  | { type: "LOAD_ORDERS"; orders: Order[] }
  | { type: "ADD_TO_CART"; item: CartItem }
  | { type: "REMOVE_FROM_CART"; cartId: string }
  | { type: "UPDATE_QUANTITY"; cartId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART"; open?: boolean }
  | { type: "SET_USERNAME"; username: string }
  | { type: "CLEAR_USERNAME" }
  | { type: "SET_FIRESTORE_READY" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOAD_PRODUCTS":
      return { ...state, products: action.products };
    case "LOAD_ORDERS":
      return { ...state, orders: action.orders };
    case "ADD_TO_CART":
      return { ...state, cart: [...state.cart, action.item] };
    case "REMOVE_FROM_CART":
      return { ...state, cart: state.cart.filter((i) => i.cartId !== action.cartId) };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.cartId === action.cartId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR_CART":
      return { ...state, cart: [] };
    case "TOGGLE_CART":
      return { ...state, cartOpen: action.open !== undefined ? action.open : !state.cartOpen };
    case "SET_USERNAME": {
      if (typeof window !== "undefined") {
        localStorage.setItem(USERNAME_STORAGE_KEY, action.username);
      }
      return { ...state, username: action.username };
    }
    case "CLEAR_USERNAME": {
      if (typeof window !== "undefined") {
        localStorage.removeItem(USERNAME_STORAGE_KEY);
      }
      return { ...state, username: null };
    }
    case "SET_FIRESTORE_READY":
      return { ...state, firestoreReady: true };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
interface StoreContextType {
  state: State;
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: (open?: boolean) => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleAvailability: (id: string) => Promise<void>;
  resetDefaultProducts: () => Promise<void>;
  placeOrder: (orderData: Omit<Order, "id" | "createdAt" | "status" | "username">) => Promise<Order>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  setUsername: (username: string) => void;
  clearUsername: () => void;
  cartTotal: number;
  cartCount: number;
  pendingOrdersCount: number;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    products: DEFAULT_PRODUCTS,
    orders: [],
    cart: [],
    cartOpen: false,
    username: null,
    firestoreReady: false,
  });

  // ── Load username from localStorage on mount ─────────────────────────────
  useEffect(() => {
    try {
      const storedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
      if (storedUsername) {
        dispatch({ type: "SET_USERNAME", username: storedUsername });
      }
    } catch (e) {
      console.warn("Failed to load username from localStorage:", e);
    }
  }, []);

  // ── Real-time listener: Products ─────────────────────────────────────────
  useEffect(() => {
    const productsCol = collection(db, "products");
    const unsub = onSnapshot(productsCol, async (snapshot) => {
      if (snapshot.empty) {
        // First-time setup — seed Firestore with default products
        console.log("🌱 Seeding Firestore with default products...");
        for (const product of DEFAULT_PRODUCTS) {
          await setDoc(doc(db, "products", product.id), cleanForFirestore(product));
        }
        dispatch({ type: "LOAD_PRODUCTS", products: DEFAULT_PRODUCTS });
      } else {
        const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        dispatch({ type: "LOAD_PRODUCTS", products });
      }
    }, (err) => {
      console.error("Firestore products listener error:", err);
    });
    return () => unsub();
  }, []);

  // ── Real-time listener: Orders ───────────────────────────────────────────
  useEffect(() => {
    const ordersCol = collection(db, "orders");
    const unsub = onSnapshot(ordersCol, (snapshot) => {
      const orders = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Order))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      console.log(`📦 Synced ${orders.length} orders from Firestore`);
      dispatch({ type: "LOAD_ORDERS", orders });
      dispatch({ type: "SET_FIRESTORE_READY" });
    }, (err) => {
      console.error("Firestore orders listener error:", err);
      dispatch({ type: "SET_FIRESTORE_READY" });
    });
    return () => unsub();
  }, []);

  // ── Cart (local — per session) ───────────────────────────────────────────
  const addToCart = useCallback((item: CartItem) => dispatch({ type: "ADD_TO_CART", item }), []);
  const removeFromCart = useCallback((cartId: string) => dispatch({ type: "REMOVE_FROM_CART", cartId }), []);
  const updateQuantity = useCallback((cartId: string, quantity: number) => dispatch({ type: "UPDATE_QUANTITY", cartId, quantity }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);
  const toggleCart = useCallback((open?: boolean) => dispatch({ type: "TOGGLE_CART", open }), []);

  // ── Product actions → Firestore ──────────────────────────────────────────
  const addProduct = useCallback(async (product: Product) => {
    await setDoc(doc(db, "products", product.id), cleanForFirestore(product));
  }, []);

  const updateProduct = useCallback(async (product: Product) => {
    await setDoc(doc(db, "products", product.id), cleanForFirestore(product));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "products", id));
  }, []);

  const toggleAvailability = useCallback(async (id: string) => {
    const product = state.products.find((p) => p.id === id);
    if (!product) return;
    await updateDoc(doc(db, "products", id), { available: !product.available });
  }, [state.products]);

  const resetDefaultProducts = useCallback(async () => {
    for (const product of DEFAULT_PRODUCTS) {
      await setDoc(doc(db, "products", product.id), cleanForFirestore(product));
    }
  }, []);

  // ── Order actions → Firestore ────────────────────────────────────────────
  const placeOrder = useCallback(async (
    orderData: Omit<Order, "id" | "createdAt" | "status" | "username">
  ): Promise<Order> => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const storedUsername =
      typeof window !== "undefined"
        ? localStorage.getItem(USERNAME_STORAGE_KEY) || "guest"
        : "guest";
    const newOrder: Order = {
      ...orderData,
      id: `DD-${randomSuffix}`,
      createdAt: new Date().toISOString(),
      status: "Pending",
      username: storedUsername,
    };
    await setDoc(doc(db, "orders", newOrder.id), cleanForFirestore(newOrder));
    dispatch({ type: "CLEAR_CART" });
    dispatch({ type: "TOGGLE_CART", open: false });
    return newOrder;
  }, []);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
    await updateDoc(doc(db, "orders", orderId), cleanForFirestore(updates));
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    await deleteDoc(doc(db, "orders", orderId));
  }, []);

  // ── Username (localStorage only) ─────────────────────────────────────────
  const setUsername = useCallback((username: string) => {
    dispatch({ type: "SET_USERNAME", username });
  }, []);

  const clearUsername = useCallback(() => {
    dispatch({ type: "CLEAR_USERNAME" });
  }, []);

  // ── Derived values ───────────────────────────────────────────────────────
  const cartTotal = state.cart.reduce((sum, item) => {
    const sizeExtra = item.size === "Large" ? 20 : item.size === "Small" ? -10 : 0;
    const addOnTotal = item.addOns.reduce((a, b) => a + b.price, 0);
    return sum + (item.product.basePrice + sizeExtra + addOnTotal) * item.quantity;
  }, 0);

  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const pendingOrdersCount = state.orders.filter((o) => o.status === "Pending").length;

  return (
    <StoreContext.Provider
      value={{
        state,
        addToCart, removeFromCart, updateQuantity, clearCart,
        toggleCart, addProduct, updateProduct, deleteProduct, toggleAvailability,
        resetDefaultProducts, placeOrder, updateOrder, deleteOrder,
        setUsername, clearUsername,
        cartTotal, cartCount, pendingOrdersCount,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
