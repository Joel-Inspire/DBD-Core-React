import axios from 'axios';

const API_URL = 'http://localhost:3001/salesOrders'; // Assuming json-server is on port 3001

// Fetch all sales orders
export const getOrderEntries = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    throw error;
  }
};

// Fetch a single sales order by ID
export const getOrderEntryById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sales order with id ${id}:`, error);
    throw error;
  }
};

// Create a new sales order
export const createOrderEntry = async (orderEntryData) => {
  try {
    const response = await axios.post(API_URL, orderEntryData);
    return response.data;
  } catch (error) {
    console.error('Error creating sales order:', error);
    throw error;
  }
};

// Update an existing sales order
export const updateOrderEntry = async (id, orderData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, orderData);
    return response.data;
  } catch (error) {
    console.error(`Error updating sales order with id ${id}:`, error);
    throw error;
  }
};

// Delete a sales order
export const deleteOrderEntry = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data; // Or handle as per API response, e.g., status code
  } catch (error) {
    console.error(`Error deleting sales order with id ${id}:`, error);
    throw error;
  }
};
