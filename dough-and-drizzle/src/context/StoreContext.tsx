"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";

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
const PRODUCTS_STORAGE_KEY = "dough_and_drizzle_products_v1";
const ORDERS_STORAGE_KEY = "dough_and_drizzle_orders_v1";
const USERNAME_STORAGE_KEY = "dough_and_drizzle_username_v1";

function saveProductsToLocalStorage(products: Product[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn("Could not save products to localStorage", e);
    }
  }
}

function saveOrdersToLocalStorage(orders: Order[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn("Could not save orders to localStorage", e);
    }
  }
}

interface State {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  cartOpen: boolean;
  username: string | null;
}

type Action =
  | { type: "LOAD_PRODUCTS"; products: Product[] }
  | { type: "RESET_DEFAULT_PRODUCTS" }
  | { type: "LOAD_ORDERS"; orders: Order[] }
  | { type: "PLACE_ORDER"; order: Order }
  | { type: "UPDATE_ORDER"; orderId: string; updates: Partial<Order> }
  | { type: "DELETE_ORDER"; orderId: string }
  | { type: "ADD_TO_CART"; item: CartItem }
  | { type: "REMOVE_FROM_CART"; cartId: string }
  | { type: "UPDATE_QUANTITY"; cartId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART"; open?: boolean }
  | { type: "ADD_PRODUCT"; product: Product }
  | { type: "UPDATE_PRODUCT"; product: Product }
  | { type: "DELETE_PRODUCT"; id: string }
  | { type: "TOGGLE_AVAILABILITY"; id: string }
  | { type: "SET_USERNAME"; username: string }
  | { type: "CLEAR_USERNAME" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOAD_PRODUCTS":
      return { ...state, products: action.products };
    case "RESET_DEFAULT_PRODUCTS": {
      saveProductsToLocalStorage(DEFAULT_PRODUCTS);
      return { ...state, products: DEFAULT_PRODUCTS };
    }
    case "LOAD_ORDERS":
      return { ...state, orders: action.orders };
    case "PLACE_ORDER": {
      const updatedOrders = [action.order, ...state.orders];
      saveOrdersToLocalStorage(updatedOrders);
      return { ...state, orders: updatedOrders, cart: [], cartOpen: false };
    }
    case "UPDATE_ORDER": {
      const updatedOrders = state.orders.map((o) =>
        o.id === action.orderId ? { ...o, ...action.updates } : o
      );
      saveOrdersToLocalStorage(updatedOrders);
      return { ...state, orders: updatedOrders };
    }
    case "DELETE_ORDER": {
      const updatedOrders = state.orders.filter((o) => o.id !== action.orderId);
      saveOrdersToLocalStorage(updatedOrders);
      return { ...state, orders: updatedOrders };
    }
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
    case "ADD_PRODUCT": {
      const updated = [...state.products, action.product];
      saveProductsToLocalStorage(updated);
      return { ...state, products: updated };
    }
    case "UPDATE_PRODUCT": {
      const updated = state.products.map((p) =>
        p.id === action.product.id ? action.product : p
      );
      saveProductsToLocalStorage(updated);
      return { ...state, products: updated };
    }
    case "DELETE_PRODUCT": {
      const updated = state.products.filter((p) => p.id !== action.id);
      saveProductsToLocalStorage(updated);
      return { ...state, products: updated };
    }
    case "TOGGLE_AVAILABILITY": {
      const updated = state.products.map((p) =>
        p.id === action.id ? { ...p, available: !p.available } : p
      );
      saveProductsToLocalStorage(updated);
      return { ...state, products: updated };
    }
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
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  toggleAvailability: (id: string) => void;
  resetDefaultProducts: () => void;
  placeOrder: (orderData: Omit<Order, "id" | "createdAt" | "status" | "username">) => Order;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
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
  });

  // Sync with localStorage on mount & listen to other tabs
  React.useEffect(() => {
    // 1. Load products
    try {
      const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: "LOAD_PRODUCTS", products: parsed });
        }
      } else {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      }
    } catch (e) {
      console.warn("Failed to load products from localStorage:", e);
    }

    // 2. Load orders
    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        if (Array.isArray(parsedOrders)) {
          dispatch({ type: "LOAD_ORDERS", orders: parsedOrders });
        }
      }
    } catch (e) {
      console.warn("Failed to load orders from localStorage:", e);
    }

    // 3. Load username
    try {
      const storedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
      if (storedUsername) {
        dispatch({ type: "SET_USERNAME", username: storedUsername });
      }
    } catch (e) {
      console.warn("Failed to load username from localStorage:", e);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PRODUCTS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            dispatch({ type: "LOAD_PRODUCTS", products: parsed });
          }
        } catch (err) {
          console.warn("Error parsing products storage update:", err);
        }
      }
      if (e.key === ORDERS_STORAGE_KEY && e.newValue) {
        try {
          const parsedOrders = JSON.parse(e.newValue);
          if (Array.isArray(parsedOrders)) {
            dispatch({ type: "LOAD_ORDERS", orders: parsedOrders });
          }
        } catch (err) {
          console.warn("Error parsing orders storage update:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const addToCart = useCallback((item: CartItem) => dispatch({ type: "ADD_TO_CART", item }), []);
  const removeFromCart = useCallback((cartId: string) => dispatch({ type: "REMOVE_FROM_CART", cartId }), []);
  const updateQuantity = useCallback((cartId: string, quantity: number) => dispatch({ type: "UPDATE_QUANTITY", cartId, quantity }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);
  const toggleCart = useCallback((open?: boolean) => dispatch({ type: "TOGGLE_CART", open }), []);
  const addProduct = useCallback((product: Product) => dispatch({ type: "ADD_PRODUCT", product }), []);
  const updateProduct = useCallback((product: Product) => dispatch({ type: "UPDATE_PRODUCT", product }), []);
  const deleteProduct = useCallback((id: string) => dispatch({ type: "DELETE_PRODUCT", id }), []);
  const toggleAvailability = useCallback((id: string) => dispatch({ type: "TOGGLE_AVAILABILITY", id }), []);
  const resetDefaultProducts = useCallback(() => dispatch({ type: "RESET_DEFAULT_PRODUCTS" }), []);

  const placeOrder = useCallback((orderData: Omit<Order, "id" | "createdAt" | "status" | "username">) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const storedUsername = typeof window !== "undefined"
      ? localStorage.getItem(USERNAME_STORAGE_KEY) || "guest"
      : "guest";
    const newOrder: Order = {
      ...orderData,
      id: `DD-${randomSuffix}`,
      createdAt: new Date().toISOString(),
      status: "Pending",
      username: storedUsername,
    };
    dispatch({ type: "PLACE_ORDER", order: newOrder });
    return newOrder;
  }, []);

  const updateOrder = useCallback((orderId: string, updates: Partial<Order>) => {
    dispatch({ type: "UPDATE_ORDER", orderId, updates });
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    dispatch({ type: "DELETE_ORDER", orderId });
  }, []);

  const setUsername = useCallback((username: string) => {
    dispatch({ type: "SET_USERNAME", username });
  }, []);

  const clearUsername = useCallback(() => {
    dispatch({ type: "CLEAR_USERNAME" });
  }, []);

  const cartTotal = state.cart.reduce((sum, item) => {
    const sizeExtra = item.size === "Large" ? 20 : item.size === "Small" ? -10 : 0;
    const addOnTotal = item.addOns.reduce((a, b) => a + b.price, 0);
    return sum + (item.product.basePrice + sizeExtra + addOnTotal) * item.quantity;
  }, 0);

  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const pendingOrdersCount = state.orders.filter((o) => o.status === "Pending").length;

  return (
    <StoreContext.Provider value={{
      state,
      addToCart, removeFromCart, updateQuantity, clearCart,
      toggleCart, addProduct, updateProduct, deleteProduct, toggleAvailability,
      resetDefaultProducts, placeOrder, updateOrder, deleteOrder,
      setUsername, clearUsername,
      cartTotal, cartCount, pendingOrdersCount,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
