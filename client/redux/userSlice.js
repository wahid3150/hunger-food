import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { serverUrl } from "../src/App";

export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${serverUrl}/api/auth/current`, {
        withCredentials: true,
      });
      return res.data?.user ?? res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Not authenticated",
      );
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.userData = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearUser: (state) => {
      state.userData = null;
      state.status = "failed";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.userData = action.payload;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.userData = null;
        state.status = "failed";
        state.error = action.payload || action.error?.message || null;
      });
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
