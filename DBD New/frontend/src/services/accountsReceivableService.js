import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001'; // Your mock API base URL

/**
 * Fetches all invoices.
 * @returns {Promise<Array>} A promise that resolves to an array of invoice objects.
 */
export const getInvoices = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/invoices`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    // Consider more sophisticated error handling or re-throwing for the component to handle
    throw error; 
  }
};

/**
 * Fetches a single invoice by its ID.
 * @param {string} invoiceId - The ID of the invoice to fetch.
 * @returns {Promise<Object|null>} A promise that resolves to the invoice object if found, or null.
 */
export const getInvoiceById = async (invoiceId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Not found
    }
    console.error(`Error fetching invoice with ID ${invoiceId}:`, error);
    throw error;
  }
};

// Future functions for AR:
/**
 * Creates a new invoice.
 * @param {Object} invoiceData - The data for the new invoice.
 * @returns {Promise<Object>} A promise that resolves to the newly created invoice object.
 */
export const createInvoice = async (invoiceData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/invoices`, invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

/**
 * Updates an existing invoice.
 * @param {string} invoiceId - The ID of the invoice to update.
 * @param {Object} invoiceData - The data to update the invoice with.
 * @returns {Promise<Object>} A promise that resolves to the updated invoice object.
 */
export const updateInvoice = async (invoiceId, invoiceData) => {
  try {
    // Ensure the id is not part of the payload if your API doesn't expect it
    // or ensure it matches the URL id if it does.
    // For json-server, it's usually fine to include it or omit it as long as the URL is correct.
    const response = await axios.put(`${API_BASE_URL}/invoices/${invoiceId}`, invoiceData);
    return response.data;
  } catch (error) {
    console.error(`Error updating invoice ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * Deletes an invoice.
 * @param {string} invoiceId - The ID of the invoice to delete.
 * @returns {Promise<void>} A promise that resolves when the invoice is deleted.
 */
export const deleteInvoice = async (invoiceId) => {
  try {
    await axios.delete(`${API_BASE_URL}/invoices/${invoiceId}`);
  } catch (error) {
    console.error(`Error deleting invoice ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * Records a payment against an invoice.
 * This typically involves updating the invoice's amountPaid and status.
 * @param {string} invoiceId - The ID of the invoice.
 * @param {Object} paymentDetails - An object containing payment information (e.g., amountPaid, paymentDate, newStatus).
 *                                 The backend will handle updating the invoice record.
 * @returns {Promise<Object>} A promise that resolves to the updated invoice object.
 */
export const recordPayment = async (invoiceId, paymentDetails) => {
  try {
    // We'll fetch the current invoice, update its payment fields, then PUT it back.
    // A PATCH request might be more efficient if the API supports partial updates well.
    // For json-server, GET then PUT is reliable.
    const invoice = await getInvoiceById(invoiceId);

    const newAmountPaid = (parseFloat(invoice.amountPaid) || 0) + (parseFloat(paymentDetails.paymentAmount) || 0);
    const newBalanceDue = parseFloat(invoice.totalAmount) - newAmountPaid;
    
    let newStatus = invoice.status;
    if (newBalanceDue <= 0) {
      newStatus = 'Paid';
    } else if (newAmountPaid > 0 && newBalanceDue > 0) {
      newStatus = 'Partially Paid';
    }
    // If newAmountPaid is 0 and total is > 0, it might be 'Open' or 'Overdue' based on due date.
    // We'll let the form handle setting it back to 'Open' if a payment is reversed or initially 'Open'.

    const updatedInvoiceData = {
      ...invoice, // Spread existing invoice data
      amountPaid: newAmountPaid.toFixed(2),
      balanceDue: newBalanceDue.toFixed(2),
      status: newStatus,
      // Potentially add payment history or last payment date if model supports it
      // lastPaymentDate: paymentDetails.paymentDate, 
    };

    const response = await axios.put(`${API_BASE_URL}/invoices/${invoiceId}`, updatedInvoiceData);
    return response.data;
  } catch (error) {
    console.error(`Error recording payment for invoice ${invoiceId}:`, error);
    throw error;
  }
};
