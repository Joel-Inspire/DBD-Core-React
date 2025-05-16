// This service will handle API calls for products.
// For now, it's minimal to support testing ProductList.

import axios from 'axios'; // Assuming axios is preferred for consistency with OrderEntryService

const API_BASE_URL = 'http://localhost:3001'; // Assuming json-server for products too

export const getProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductById = async (productId) => {
  try {
    // Assuming 'id' is the field for item number in db.json products
    const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Product not found, return null or throw a specific error
      return null; 
    }
    console.error(`Error fetching product with id ${productId}:`, error);
    throw error;
  }
};

export const addProduct = async (productData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/products`, productData);
    return response.data;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/products/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error(`Error updating product with id ${productId}:`, error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    await axios.delete(`${API_BASE_URL}/products/${productId}`);
    // DELETE typically returns 204 No Content, so no data to return or just an empty object for confirmation
    return {}; 
  } catch (error) {
    console.error(`Error deleting product with id ${productId}:`, error);
    throw error;
  }
};
