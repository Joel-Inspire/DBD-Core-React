import React from 'react';
import './InvoiceDetailsModal.css'; // We'll create this next

const InvoiceDetailsModal = ({ invoice, onClose }) => {
  if (!invoice) {
    return null;
  }

  // Helper to format date, defaulting to 'N/A' if date is invalid or not present
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  // Helper to format currency, defaulting to 0.00 if value is undefined
  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    return `$${(isNaN(num) ? 0 : num).toFixed(2)}`;
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Invoice Details: {invoice.invoiceNumber || invoice.id}</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="invoice-section">
            <h4>Invoice Information</h4>
            <p><strong>Customer Code:</strong> {invoice.customerCode || 'N/A'}</p>
            <p><strong>Order ID:</strong> {invoice.orderId || 'N/A'}</p>
            <p><strong>Invoice Date:</strong> {formatDate(invoice.invoiceDate)}</p>
            <p><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</p>
            <p><strong>Status:</strong> {invoice.status || 'N/A'}</p>
          </div>

          <div className="financials-section">
            <h4>Financials</h4>
            <p><strong>Subtotal:</strong> {formatCurrency(invoice.subTotal)}</p>
            <p><strong>Tax Amount:</strong> {formatCurrency(invoice.taxAmount)}</p>
            <p><strong>Shipping Amount:</strong> {formatCurrency(invoice.shippingAmount)}</p>
            <p><strong>Total Amount:</strong> {formatCurrency(invoice.totalAmount)}</p>
            <p><strong>Amount Paid:</strong> {formatCurrency(invoice.amountPaid)}</p>
            <p><strong>Balance Due:</strong> {formatCurrency(invoice.balanceDue)}</p>
          </div>

          {invoice.notes && (
            <div className="notes-section">
              <h4>Notes</h4>
              <p>{invoice.notes}</p>
            </div>
          )}
          
          {/* Placeholder for Line Items if invoices will have their own distinct lines */}
          {/* <div className="line-items-section">
            <h4>Line Items</h4>
            <p>Line item details for invoices to be implemented if needed.</p>
          </div> */}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="button-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsModal;
