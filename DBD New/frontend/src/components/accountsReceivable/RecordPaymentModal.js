import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './RecordPaymentModal.css'; // We'll create this next

const RecordPaymentModal = ({ invoice, onSave, onCancel }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  if (!invoice) return null;

  const validateForm = () => {
    const newErrors = {};
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.paymentAmount = 'Payment amount must be a positive number.';
    }
    // Optional: Check if payment amount exceeds balance due, depending on business logic
    // const balanceDue = parseFloat(invoice.balanceDue);
    // if (amount > balanceDue) {
    //   newErrors.paymentAmount = 'Payment amount cannot exceed balance due.';
    // }
    if (!paymentDate) {
      newErrors.paymentDate = 'Payment date is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(invoice.id, { 
        paymentAmount,
        paymentDate,
        notes // You might want to store payment-specific notes if your model supports it
      });
    } else {
      toast.error('Please correct the errors in the form.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content record-payment-modal">
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-header">
            <h2>Record Payment for Invoice #{invoice.invoiceNumber}</h2>
            <button type="button" onClick={onCancel} className="close-button">&times;</button>
          </div>
          <div className="modal-body">
            <p><strong>Customer:</strong> {invoice.customerCode}</p>
            <p><strong>Total Amount:</strong> ${parseFloat(invoice.totalAmount).toFixed(2)}</p>
            <p><strong>Balance Due:</strong> <span className="balance-due-highlight">${parseFloat(invoice.balanceDue).toFixed(2)}</span></p>
            
            <hr />

            <div className="form-group">
              <label htmlFor="paymentAmount">Payment Amount <span className="required">*</span></label>
              <input 
                type="number" 
                id="paymentAmount" 
                name="paymentAmount" 
                step="0.01" 
                value={paymentAmount} 
                onChange={(e) => setPaymentAmount(e.target.value)} 
              />
              {errors.paymentAmount && <p className="error-text">{errors.paymentAmount}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="paymentDate">Payment Date <span className="required">*</span></label>
              <input 
                type="date" 
                id="paymentDate" 
                name="paymentDate" 
                value={paymentDate} 
                onChange={(e) => setPaymentDate(e.target.value)} 
              />
              {errors.paymentDate && <p className="error-text">{errors.paymentDate}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="paymentNotes">Payment Notes (Optional)</label>
              <textarea 
                id="paymentNotes" 
                name="paymentNotes" 
                rows="3" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
            <button type="submit" className="button-primary">Record Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
