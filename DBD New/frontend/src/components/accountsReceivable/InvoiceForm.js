import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './InvoiceForm.css'; // We'll create this next

const InvoiceForm = ({ onSave, onCancel, initialInvoice }) => {
  const [invoice, setInvoice] = useState(
    initialInvoice || {
      invoiceNumber: '',
      customerCode: '',
      orderId: '', // Optional, can be linked later or if generated from an order
      invoiceDate: new Date().toISOString().slice(0, 10), // Default to today
      dueDate: '',
      subTotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      totalAmount: 0, // Should be auto-calculated
      amountPaid: 0,
      balanceDue: 0, // Should be auto-calculated
      status: 'Open', // Default status
      notes: '',
    }
  );
  const [errors, setErrors] = useState({});

  // Auto-calculate totalAmount and balanceDue when relevant fields change
  useEffect(() => {
    const subTotal = parseFloat(invoice.subTotal) || 0;
    const taxAmount = parseFloat(invoice.taxAmount) || 0;
    const shippingAmount = parseFloat(invoice.shippingAmount) || 0;
    const amountPaid = parseFloat(invoice.amountPaid) || 0;

    const total = subTotal + taxAmount + shippingAmount;
    const balance = total - amountPaid;

    setInvoice(prev => ({ 
      ...prev, 
      totalAmount: total.toFixed(2),
      balanceDue: balance.toFixed(2)
    }));
  }, [invoice.subTotal, invoice.taxAmount, invoice.shippingAmount, invoice.amountPaid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoice({ ...invoice, [name]: value });
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!invoice.invoiceNumber.trim()) newErrors.invoiceNumber = 'Invoice Number is required.';
    if (!invoice.customerCode.trim()) newErrors.customerCode = 'Customer Code is required.';
    if (!invoice.invoiceDate) newErrors.invoiceDate = 'Invoice Date is required.';
    if (!invoice.dueDate) newErrors.dueDate = 'Due Date is required.';
    // Basic check for amounts - can be more sophisticated
    if (isNaN(parseFloat(invoice.subTotal))) newErrors.subTotal = 'Subtotal must be a number.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(invoice);
    } else {
      toast.error('Please correct the errors in the form.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content invoice-form-modal">
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-header">
            <h2>{initialInvoice ? 'Edit Invoice' : 'Add New Invoice'}</h2>
            <button type="button" onClick={onCancel} className="close-button">&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="invoiceNumber">Invoice Number <span className="required">*</span></label>
                <input type="text" id="invoiceNumber" name="invoiceNumber" value={invoice.invoiceNumber} onChange={handleChange} />
                {errors.invoiceNumber && <p className="error-text">{errors.invoiceNumber}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="customerCode">Customer Code <span className="required">*</span></label>
                <input type="text" id="customerCode" name="customerCode" value={invoice.customerCode} onChange={handleChange} />
                {/* TODO: Implement customer lookup like in OrderEntryForm */}
                {errors.customerCode && <p className="error-text">{errors.customerCode}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="orderId">Order ID (Optional)</label>
                <input type="text" id="orderId" name="orderId" value={invoice.orderId} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="invoiceDate">Invoice Date <span className="required">*</span></label>
                <input type="date" id="invoiceDate" name="invoiceDate" value={invoice.invoiceDate} onChange={handleChange} />
                {errors.invoiceDate && <p className="error-text">{errors.invoiceDate}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="dueDate">Due Date <span className="required">*</span></label>
                <input type="date" id="dueDate" name="dueDate" value={invoice.dueDate} onChange={handleChange} />
                {errors.dueDate && <p className="error-text">{errors.dueDate}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={invoice.status} onChange={handleChange}>
                  <option value="Open">Open</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Void">Void</option>
                </select>
              </div>
            </div>

            <h4>Financials</h4>
            <div className="form-grid financials-grid">
              <div className="form-group">
                <label htmlFor="subTotal">Subtotal <span className="required">*</span></label>
                <input type="number" id="subTotal" name="subTotal" step="0.01" value={invoice.subTotal} onChange={handleChange} />
                {errors.subTotal && <p className="error-text">{errors.subTotal}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="taxAmount">Tax Amount</label>
                <input type="number" id="taxAmount" name="taxAmount" step="0.01" value={invoice.taxAmount} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="shippingAmount">Shipping Amount</label>
                <input type="number" id="shippingAmount" name="shippingAmount" step="0.01" value={invoice.shippingAmount} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="totalAmount">Total Amount</label>
                <input type="number" id="totalAmount" name="totalAmount" value={invoice.totalAmount} readOnly disabled />
              </div>
              <div className="form-group">
                <label htmlFor="amountPaid">Amount Paid</label>
                <input type="number" id="amountPaid" name="amountPaid" step="0.01" value={invoice.amountPaid} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="balanceDue">Balance Due</label>
                <input type="number" id="balanceDue" name="balanceDue" value={invoice.balanceDue} readOnly disabled />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" name="notes" value={invoice.notes} onChange={handleChange} rows="3"></textarea>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
            <button type="submit" className="button-primary">{initialInvoice ? 'Save Changes' : 'Create Invoice'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
