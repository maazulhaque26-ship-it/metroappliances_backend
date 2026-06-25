import { createSlice } from '@reduxjs/toolkit';

const compareSlice = createSlice({
  name: 'compare',
  initialState: { items: [] }, // max 4 full product objects
  reducers: {
    addToCompare: (state, { payload: product }) => {
      if (state.items.length >= 4) return;
      if (!state.items.some(p => p._id === product._id))
        state.items.push(product);
    },
    removeFromCompare: (state, { payload: id }) => {
      state.items = state.items.filter(p => p._id !== id);
    },
    clearCompare: (state) => { state.items = []; },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
