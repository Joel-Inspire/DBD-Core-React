// This service will handle API calls for products.
// For now, it's minimal to support testing ProductList.

const API_BASE_URL = 'http://localhost:3001'; // Assuming json-server for products too

// Helper function to handle API responses (can be shared or refactored later)
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return null; 
  }
  return response.json();
};

export const getProducts = async () => {
  // This will eventually fetch from `${API_BASE_URL}/products`
  // For TDD with ProductList, this function will be mocked by tests initially.
  // When ProductList calls it, the mock in ProductList.test.js will respond.
  console.warn('productService.getProducts called - should be mocked in tests or implemented for actual use');
  return Promise.resolve([]); // Placeholder for actual implementation
};

// We will add addProduct, updateProduct, deleteProduct later following TDD

export const addProduct = async (productData) => {
  // This will eventually send a POST request to `${API_BASE_URL}/products`
  // For TDD, this will be mocked in tests.
  console.warn('productService.addProduct called - should be mocked in tests or implemented for actual use');
  // Simulate API call, assuming json-server will assign an id if not provided.
  // For a real backend, the response would be the newly created product, often with its DB-assigned ID.
  return Promise.resolve({ ...productData, id: `mock-${Date.now()}` }); // Mock response
};

export const updateProduct = async (productId, productData) => {
  // This will eventually send a PUT request to `${API_BASE_URL}/products/${productId}`
  // For TDD, this will be mocked in tests.
  console.warn(`productService.updateProduct called for ${productId} - should be mocked or implemented`);
  // Simulate API call, returning the updated product data.
  // A real backend would persist the changes and return the updated record.
  return Promise.resolve({ id: productId, ...productData }); // Mock response
};

export const deleteProduct = async (productId) => {
  // This will eventually send a DELETE request to `${API_BASE_URL}/products/${productId}`
  // For TDD, this will be mocked in tests.
  console.warn(`productService.deleteProduct called for ${productId} - should be mocked or implemented`);
  // Simulate API call. A successful DELETE request usually returns a 200 OK or 204 No Content.
  return Promise.resolve({}); // Mock response for successful deletion
};
