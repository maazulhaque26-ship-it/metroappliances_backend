import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dealerAPI from '../../services/dealerAPI';

export const fetchDealerCart = createAsyncThunk('dealerCart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await dealerAPI.get('/dealer/cart');
    return data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk('dealerCart/add', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await dealerAPI.post('/dealer/cart', payload);
    return data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
  }
});

export const updateCartQuantity = createAsyncThunk('dealerCart/update', async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const { data } = await dealerAPI.put(`/dealer/cart/${itemId}`, { quantity });
    return data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update cart');
  }
});

export const removeFromCart = createAsyncThunk('dealerCart/remove', async (itemId, { rejectWithValue }) => {
  try {
    const { data } = await dealerAPI.delete(`/dealer/cart/${itemId}`);
    return data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove item');
  }
});

export const clearDealerCart = createAsyncThunk('dealerCart/clear', async (_, { rejectWithValue }) => {
  try {
    await dealerAPI.delete('/dealer/cart');
    return { items: [] };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
  }
});

const setCart = (state, action) => {
  state.loading = false;
  state.error   = null;
  state.cart    = action.payload || { items: [] };
};

const dealerCartSlice = createSlice({
  name: 'dealerCart',
  initialState: {
    cart:    { items: [] },
    loading: false,
    error:   null,
  },
  reducers: {
    clearDealerCartError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending  = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchDealerCart.pending,    pending)
      .addCase(fetchDealerCart.fulfilled,  setCart)
      .addCase(fetchDealerCart.rejected,   rejected)
      .addCase(addToCart.pending,          pending)
      .addCase(addToCart.fulfilled,        setCart)
      .addCase(addToCart.rejected,         rejected)
      .addCase(updateCartQuantity.pending,  pending)
      .addCase(updateCartQuantity.fulfilled, setCart)
      .addCase(updateCartQuantity.rejected,  rejected)
      .addCase(removeFromCart.pending,     pending)
      .addCase(removeFromCart.fulfilled,   setCart)
      .addCase(removeFromCart.rejected,    rejected)
      .addCase(clearDealerCart.pending,    pending)
      .addCase(clearDealerCart.fulfilled,  setCart)
      .addCase(clearDealerCart.rejected,   rejected);
  },
});

export const { clearDealerCartError } = dealerCartSlice.actions;
export default dealerCartSlice.reducer;
