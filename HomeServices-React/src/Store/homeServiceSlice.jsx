import { fetchFromAPI } from "../api/FetchFromAPI";

const { createSlice, createAsyncThunk } = require("@reduxjs/toolkit");

const initialState = {
  isRegistered: false,
  userInputValue: { email: "", password: "" },
  isSelected: 1,
  areasList: null,
  userTotalInfo: null,
  balance: null,
  selectedUser: null,
  userToken: null,
  categories: null,
  selectedServiceToUpdate: null,
  selectedCategory: null,
  clearResults: false,
  flagToClose: false,
  showList: 0,
};

export const getNewRelease = createAsyncThunk(
  "homeService/getNewRelease",
  async (args) => {
    try {
      const response = fetchFromAPI(
        `discover/${args}?sort_by=release_date.desc`
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }
);

const homeServiceSlice = createSlice({
  name: "homeService",
  initialState,
  reducers: {
    setIsRegistered: (state, action) => {
      state.isRegistered = action.payload;
    },
    setUserInputValue: (state, action) => {
      state.userInputValue = action.payload;
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setUserTotalInfo: (state, action) => {
      state.userTotalInfo = action.payload;
    },
    setBalance: (state, action) => {
      state.balance = action.payload;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    setUserToken: (state, action) => {
      state.userToken = action.payload;
    },
    setIsSelected: (state, action) => {
      state.isSelected = action.payload;
    },
    setAreasList: (state, action) => {
      state.areasList = action.payload;
    },
    setSelectedServiceToUpdate: (state, action) => {
      state.selectedServiceToUpdate = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setClearResults: (state, action) => {
      state.clearResults = action.payload;
    },
    setFlagToClose: (state, action) => {
      state.flagToClose = action.payload;
    },
    setShowList: (state, action) => {
      state.showList = action.payload;
    },
  },
});

export const {
  setIsRegistered,
  setUserInputValue,
  setIsSelected,
  setUserTotalInfo,
  setBalance,
  setSelectedUser,
  setUserToken,
  setCategories,
  setAreasList,
  setSelectedServiceToUpdate,
  setSelectedCategory,
  setClearResults,
  setFlagToClose,
  setShowList,
} = homeServiceSlice.actions;
export default homeServiceSlice.reducer;
