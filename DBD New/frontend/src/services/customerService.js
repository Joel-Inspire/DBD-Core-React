import axios from 'axios';
const API_URL = 'http://localhost:3001/customers';
const API_BASE_URL = 'http://localhost:3001'; 

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }
  // For 204 No Content, return null or an empty object as there's no body to parse
  if (response.status === 204) {
    return null; 
  }
  return response.json();
};

// GET all customers
export const getCustomers = async () => {
  const response = await fetch(API_URL);
  return handleResponse(response);
};

// GET a single customer by ID
export const getCustomerById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);
  return handleResponse(response);
};

// POST a new customer
export const addCustomer = async (customerData) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });
  return handleResponse(response);
};

// PUT (update) an existing customer
export const updateCustomer = async (id, customerData) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });
  return handleResponse(response);
};

// DELETE a customer by ID
export const deleteCustomer = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  // DELETE often returns 204 No Content or the deleted object
  // handleResponse will correctly parse or return null for 204
  return handleResponse(response);
};

/**
 * Fetches a customer by their unique customer code.
 * @param {string} customerCode - The code of the customer to fetch.
 * @returns {Promise<Object|null>} A promise that resolves to the customer object if found, or null otherwise.
 */
export const getCustomerByCustomerCode = async (customerCode) => {
  if (!customerCode) {
    return null;
  }
  try {
    // json-server supports filtering like this: /customers?customerCode=CUST001
    // This will return an array. We expect at most one customer with a unique code.
    const response = await axios.get(`${API_BASE_URL}/customers?customerCode=${encodeURIComponent(customerCode)}`);
    if (response.data && response.data.length > 0) {
      return response.data[0]; // Return the first match
    } else {
      return null; // No customer found with that code
    }
  } catch (error) {
    console.error(`Error fetching customer with code ${customerCode}:`, error);
    // Depending on desired error handling, you might throw the error or return null
    // For a lookup, returning null on error (or specific not-found) might be preferred by the form
    if (error.response && error.response.status === 404) {
        return null;
    }
    throw error; // Re-throw other errors to be handled by the caller
  }
};
