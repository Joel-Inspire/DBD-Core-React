// Mock database - in a real app, this data would come from a backend API
// let mockVendors = [ ... ]; // No longer needed, json-server uses db.json

const API_BASE_URL = 'http://localhost:3001';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  // For 204 No Content, there might not be a body to parse
  if (response.status === 204) {
    return null; 
  }
  return response.json();
};

export const getVendors = async () => {
  const response = await fetch(`${API_BASE_URL}/vendors`);
  return handleResponse(response);
};

export const addVendor = async (vendorData) => {
  // json-server will create an id if it's not present. 
  // We'll create a composite id as before to match our existing logic.
  // However, for PUT/DELETE json-server relies on its own `id` field.
  // We need to ensure our `id` in db.json is unique and used for these operations.
  // Let's ensure the vendorData we send for POST includes the 'id' we defined in db.json.
  const newVendorWithId = {
    ...vendorData,
    id: `${vendorData.VEND_CODE}-${vendorData.VEND_DIV}` // Ensure our composite ID is set
  };

  const response = await fetch(`${API_BASE_URL}/vendors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newVendorWithId),
  });
  return handleResponse(response);
};

export const updateVendor = async (vendorId, vendorData) => {
  // vendorId here should be the `id` field used by json-server (e.g., "ACME001-01")
  // The vendorData should also contain this id.
  const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vendorData), // Ensure vendorData contains the 'id'
  });
  return handleResponse(response);
};

export const deleteVendor = async (vendorId) => {
  // vendorId here should be the `id` field used by json-server
  const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
    method: 'DELETE',
  });
  // DELETE might return 204 No Content or the deleted object depending on server.
  // json-server typically returns an empty object {} on successful delete (status 200)
  // or 404 if not found.
  if (!response.ok) { // Special handling for DELETE if it doesn't return JSON on error
    throw new Error(`API request failed with status ${response.status}`);
  }
  if (response.status === 204) return null; // Handle 204 No Content
  return response.json(); // Or handle empty {} response from json-server
};
