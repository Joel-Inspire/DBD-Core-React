import React from 'react';
import './OrderDetailsModal.css'; // We'll create this next

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) {
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
          <h2>Order Details: {order.orderNumber || order.id}</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="order-section">
            <h4>Order Information</h4>
            <p><strong>Customer Code:</strong> {order.customerCode || 'N/A'}</p>
            <p><strong>Order Date:</strong> {formatDate(order.orderDate)}</p>
            <p><strong>Status:</strong> {order.status || 'N/A'}</p>
            <p><strong>Salesperson:</strong> {order.salespersonCode || 'N/A'}</p>
            <p><strong>Company/Division:</strong> {order.companyDivisionPrefix || 'N/A'}</p>
          </div>

          <div className="address-section">
            <div className="address-block">
              <h4>Shipping Address</h4>
              <p>{order.shipToAddress?.name || 'N/A'}</p>
              <p>{order.shipToAddress?.street1 || ''}</p>
              {order.shipToAddress?.street2 && <p>{order.shipToAddress.street2}</p>}
              <p>
                {order.shipToAddress?.city || ''}, {order.shipToAddress?.state || ''} {order.shipToAddress?.zip || ''}
              </p>
              <p>{order.shipToAddress?.country || ''}</p>
            </div>
            <div className="address-block">
              <h4>Billing Address</h4>
              <p>{order.billToAddress?.name || 'N/A'}</p>
              <p>{order.billToAddress?.street1 || ''}</p>
              {order.billToAddress?.street2 && <p>{order.billToAddress.street2}</p>}
              <p>
                {order.billToAddress?.city || ''}, {order.billToAddress?.state || ''} {order.billToAddress?.zip || ''}
              </p>
              <p>{order.billToAddress?.country || ''}</p>
            </div>
          </div>

          <div className="line-items-section">
            <h4>Line Items</h4>
            {order.items && order.items.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item No.</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{item.lineNumber || index + 1}</td>
                      <td>{item.itemNumber || 'N/A'}</td>
                      <td>{item.itemDescription || item.description || 'N/A'}</td>
                      <td>{item.quantityOrdered || 0}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No line items for this order.</p>
            )}
          </div>

          <div className="totals-section">
            <h4>Order Totals</h4>
            <p><strong>Subtotal:</strong> {formatCurrency(order.subTotal)}</p>
            <p><strong>Tax:</strong> {formatCurrency(order.taxAmount)}</p>
            <p><strong>Shipping:</strong> {formatCurrency(order.shippingAmount)}</p>
            <p><strong>Total Amount:</strong> {formatCurrency(order.totalAmount)}</p>
          </div>

          {order.notes && (
            <div className="notes-section">
              <h4>Notes</h4>
              <p>{order.notes}</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="button-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
