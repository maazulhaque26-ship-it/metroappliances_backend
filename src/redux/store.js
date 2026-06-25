import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dealerAuthReducer from './slices/dealerAuthSlice';
import agentAuthReducer from './slices/agentAuthSlice';
import warehouseAuthReducer from './slices/warehouseAuthSlice';
import supplierAuthReducer  from './slices/supplierAuthSlice';
import technicianAuthReducer from './slices/technicianAuthSlice';
import engineerAuthReducer   from './slices/engineerAuthSlice';
import { cartReducer, wishlistReducer, productsReducer } from './slices/shopSlices';
import settingsReducer from './slices/settingsSlice';
import compareReducer from './slices/compareSlice';
import notificationReducer from './slices/notificationSlice';
import dealerCartReducer   from './slices/dealerCartSlice';

const store = configureStore({
  reducer: {
    auth:           authReducer,
    dealerAuth:     dealerAuthReducer,
    agentAuth:      agentAuthReducer,
    warehouseAuth:  warehouseAuthReducer,
    supplierAuth:   supplierAuthReducer,
    technicianAuth: technicianAuthReducer,
    engineerAuth:   engineerAuthReducer,
    cart:           cartReducer,
    wishlist:       wishlistReducer,
    products:       productsReducer,
    settings:       settingsReducer,
    compare:        compareReducer,
    notifications:  notificationReducer,
    dealerCart:     dealerCartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;