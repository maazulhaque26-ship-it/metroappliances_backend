import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue, getState }) => {
    if (getState().cart.loading) return rejectWithValue('already loading');
    try {
      const res = await API.get('/cart');
      return res.data.cart;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const addToCart = createAsyncThunk('cart/add', async (data, { rejectWithValue }) => {
  try { const res = await API.post('/cart', data); return res.data.cart; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, quantity }, { rejectWithValue }) => {
  try { const res = await API.put(`/cart/${itemId}`, { quantity }); return res.data.cart; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue }) => {
  try { const res = await API.delete(`/cart/${itemId}`); return res.data.cart; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try { await API.delete('/cart'); return { items: [] }; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], loading: false, error: null, coupon: null, couponDiscount: 0 },
  reducers: {
    resetCart:   (state) => { state.items = []; state.loading = false; state.coupon = null; state.couponDiscount = 0; },
    setCoupon:   (state, action) => { state.coupon = action.payload.coupon; state.couponDiscount = action.payload.discount; },
    clearCoupon: (state) => { state.coupon = null; state.couponDiscount = 0; },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      state.loading = false;
      if (action.payload && action.payload.items) {
        state.items = action.payload.items;
      }
    };
    builder
      .addCase(fetchCart.pending,        (s) => { s.loading = true; })
      .addCase(fetchCart.fulfilled,      setCart)
      .addCase(fetchCart.rejected,       (s) => { s.loading = false; })
      .addCase(addToCart.fulfilled,      setCart)
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(removeFromCart.fulfilled, setCart)
      .addCase(clearCart.fulfilled,      (s) => { s.items = []; s.loading = false; s.coupon = null; s.couponDiscount = 0; });
  },
});

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_, { rejectWithValue, getState }) => {
    if (getState().wishlist.loading) return rejectWithValue('already loading');
    try {
      const res = await API.get('/wishlist');
      return res.data.wishlist;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId, { rejectWithValue }) => {
  try { const res = await API.post('/wishlist', { productId }); return res.data.wishlist; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { products: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    const setWishlist = (state, action) => {
      state.loading = false;
      if (action.payload) state.products = action.payload.products || [];
    };
    builder
      .addCase(fetchWishlist.pending,    (s) => { s.loading = true; })
      .addCase(fetchWishlist.fulfilled,  setWishlist)
      .addCase(fetchWishlist.rejected,   (s) => { s.loading = false; })
      .addCase(toggleWishlist.fulfilled, setWishlist);
  },
});

// ─── Products ─────────────────────────────────────────────────────────────────
export const fetchProducts = createAsyncThunk(
  'products/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const res = await API.get('/products', { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchProductBySlug = createAsyncThunk(
  'products/fetchBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const res = await API.get(`/products/slug/${slug}`);
      return res.data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// fetchCategories — always fetches from the API.
//
// The previous version had an early-return guard:
//   if (existing && existing.length > 0) return existing;
//
// That guard permanently prevented re-fetching once any categories were
// loaded into Redux.  A customer who visited the site before an admin
// created new categories would NEVER see those categories — Redux held
// stale data for the entire session and the API was never called again.
//
// The /categories endpoint is public, lightweight, and fast.
// Always fetching ensures the home page always shows current categories.
export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/categories');
      return res.data.categories;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [], product: null, categories: [],
    total: 0, pages: 1, loading: false, error: null,
  },
  reducers: {
    clearProduct: (state) => { state.product = null; },
    // Category socket reducers
    categoryAdded: (state, action) => {
      const cat = action.payload;
      if (!cat?._id) return;
      if (!state.categories.some(c => c._id === cat._id)) {
        state.categories = [cat, ...state.categories];
      }
    },
    categoryUpdated: (state, action) => {
      const cat = action.payload;
      if (!cat?._id) return;
      state.categories = state.categories.map(c => c._id === cat._id ? cat : c);
    },
    categoryRemoved: (state, action) => {
      const id = action.payload;
      if (!id) return;
      state.categories = state.categories.filter(c => c._id !== id);
    },
    // Product socket reducers — keep Redux product lists in sync with admin changes
    productAdded: (state, action) => {
      const product = action.payload;
      if (!product?._id) return;
      if (!state.items.some(p => p._id === product._id)) {
        state.items = [product, ...state.items];
        state.total = state.total + 1;
      }
    },
    productUpdated: (state, action) => {
      const product = action.payload;
      if (!product?._id) return;
      state.items = state.items.map(p => p._id === product._id ? product : p);
      if (state.product?._id === product._id) state.product = product;
    },
    productRemoved: (state, action) => {
      const id = action.payload;
      if (!id) return;
      const existed = state.items.some(p => p._id === id);
      state.items = state.items.filter(p => p._id !== id);
      if (existed) state.total = Math.max(0, state.total - 1);
      if (state.product?._id === id) state.product = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,        (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProducts.fulfilled,      (s, a) => {
        s.loading = false;
        s.items   = a.payload.products || [];
        s.total   = a.payload.total   || 0;
        s.pages   = a.payload.pages   || 1;
      })
      .addCase(fetchProducts.rejected,       (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchProductBySlug.pending,   (s) => { s.loading = true; })
      .addCase(fetchProductBySlug.fulfilled, (s, a) => { s.loading = false; s.product = a.payload; })
      .addCase(fetchProductBySlug.rejected,  (s) => { s.loading = false; })
      .addCase(fetchCategories.fulfilled,    (s, a) => {
        if (Array.isArray(a.payload)) s.categories = a.payload;
      });
  },
});

export const { resetCart, setCoupon, clearCoupon }              = cartSlice.actions;
export const { clearProduct, categoryAdded, categoryUpdated, categoryRemoved, productAdded, productUpdated, productRemoved } = productsSlice.actions;

export const cartReducer     = cartSlice.reducer;
export const wishlistReducer = wishlistSlice.reducer;
export const productsReducer = productsSlice.reducer;
