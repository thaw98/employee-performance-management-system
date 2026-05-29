import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PermissionState {
  permissions: Record<string, Record<string, boolean>>;
  loaded: boolean;
}

const initialState: PermissionState = {
  permissions: {},
  loaded: false,
};

const permissionSlice = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    setPermissions(state, action: PayloadAction<Record<string, Record<string, boolean>>>) {
      state.permissions = action.payload;
      state.loaded = true;
    },
    clearPermissions(state) {
      state.permissions = {};
      state.loaded = false;
    },
  },
});

export const { setPermissions, clearPermissions } = permissionSlice.actions;
export default permissionSlice.reducer;
