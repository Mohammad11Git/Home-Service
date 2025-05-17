import axios from "axios";
import { BASE_API_URL } from "../utils/constants";

export const fetchFromAPI = async (url, headers) => {
  const { data } = await axios.get(`${BASE_API_URL}/${url}`, headers);
  return data;
};

export const postToAPI = async (url, value, headers) => {
  const { data } = await axios.post(`${BASE_API_URL}/${url}`, value, headers);
  return data;
};

export const putToAPI = async (url, value, headers) => {
  const { data } = await axios.put(`${BASE_API_URL}/${url}`, value, headers);
  return data;
};

export const deleteFromAPI = async (url, headers) => {
  const { data } = await axios.delete(`${BASE_API_URL}/${url}`, headers);
  return data;
};
