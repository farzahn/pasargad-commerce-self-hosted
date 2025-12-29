'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import type { CartItem, Cart } from '@/types/pocketbase';

const CART_STORAGE_KEY = 'cart';

// Create a simple store for cart state
let cartListeners: Array<() => void> = [];
let cartState: Cart = {
  items: [],
  discountCode: undefined,
  discountAmount: 0,
};

function emitChange() {
  for (const listener of cartListeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  cartListeners = [...cartListeners, listener];
  return () => {
    cartListeners = cartListeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return cartState;
}

function getServerSnapshot() {
  return {
    items: [],
    discountCode: undefined,
    discountAmount: 0,
  };
}

// Load cart from localStorage
function loadCart(): Cart {
  if (typeof window === 'undefined') {
    return { items: [], discountCode: undefined, discountAmount: 0 };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Invalid JSON, return default
  }

  return { items: [], discountCode: undefined, discountAmount: 0 };
}

// Save cart to localStorage
function saveCart(cart: Cart) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Storage full or unavailable
  }
}

// Initialize cart from localStorage
if (typeof window !== 'undefined') {
  cartState = loadCart();
}

export function useCart() {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantity = item.quantity || 1;
    const existingIndex = cartState.items.findIndex(
      (i) =>
        i.productId === item.productId &&
        i.variant === item.variant
    );

    let newItems: CartItem[];

    if (existingIndex >= 0) {
      // Update quantity of existing item
      newItems = cartState.items.map((i, index) =>
        index === existingIndex
          ? { ...i, quantity: i.quantity + quantity }
          : i
      );
    } else {
      // Add new item
      newItems = [...cartState.items, { ...item, quantity }];
    }

    cartState = { ...cartState, items: newItems };
    saveCart(cartState);
    emitChange();
  }, []);

  const removeItem = useCallback((productId: string, variant?: string) => {
    const newItems = cartState.items.filter(
      (i) =>
        !(
          i.productId === productId &&
          i.variant === variant
        )
    );

    cartState = { ...cartState, items: newItems };
    saveCart(cartState);
    emitChange();
  }, []);

  const updateQuantity = useCallback(
    (productId: string, variant: string | undefined, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, variant);
        return;
      }

      const newItems = cartState.items.map((i) =>
        i.productId === productId && i.variant === variant
          ? { ...i, quantity }
          : i
      );

      cartState = { ...cartState, items: newItems };
      saveCart(cartState);
      emitChange();
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    cartState = { items: [], discountCode: undefined, discountAmount: 0 };
    saveCart(cartState);
    emitChange();
  }, []);

  const applyDiscount = useCallback((code: string, amount: number) => {
    cartState = { ...cartState, discountCode: code, discountAmount: amount };
    saveCart(cartState);
    emitChange();
  }, []);

  const removeDiscount = useCallback(() => {
    cartState = { ...cartState, discountCode: undefined, discountAmount: 0 };
    saveCart(cartState);
    emitChange();
  }, []);

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: cart.items,
    discountCode: cart.discountCode,
    discountAmount: cart.discountAmount,
    subtotal,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyDiscount,
    removeDiscount,
  };
}
