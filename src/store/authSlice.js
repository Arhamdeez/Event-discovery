import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiRequest, setAuthToken, getAuthToken } from '../lib/api';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      return rejectWithValue(err.message || 'Sign in failed.');
    }
  },
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      return rejectWithValue(err.message || 'Could not create account.');
    }
  },
);

export const fetchSessionUser = createAsyncThunk(
  'auth/fetchSessionUser',
  async (_, { rejectWithValue }) => {
    try {
      if (!getAuthToken()) return { user: null };
      return await apiRequest('/api/auth/me');
    } catch (err) {
      return rejectWithValue(err.message || 'Could not restore session.');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: true,
    error: '',
  },
  reducers: {
    clearAuthState(state) {
      state.user = null;
      state.error = '';
      state.loading = false;
      setAuthToken('');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessionUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSessionUser.fulfilled, (state, action) => {
        state.user = action.payload?.user || null;
        state.loading = false;
        state.error = '';
      })
      .addCase(fetchSessionUser.rejected, (state) => {
        state.user = null;
        state.loading = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.loading = false;
        state.error = '';
        setAuthToken(action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sign in failed.';
      })
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.loading = false;
        state.error = '';
        setAuthToken(action.payload.token);
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Could not create account.';
      });
  },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;
