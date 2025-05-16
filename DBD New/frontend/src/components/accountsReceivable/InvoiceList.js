import React, { useState, useEffect, useCallback } from 'react';
import { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice } from '../../services/accountsReceivableService';
import { toast } from 'react-toastify';
import './InvoiceList.css';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import InvoiceForm from './InvoiceForm';
import { FaPlus, FaPencilAlt, FaTrashAlt, FaEye, FaFileInvoiceDollar } from 'react-icons/fa';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices.');
      toast.error(err.message || 'Failed to fetch invoices.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    setShowInvoiceForm(true);
  };

  const handleEditInvoice = async (invoiceToEdit) => {
    setIsLoading(true);
    try {
      const fullInvoiceDetails = await getInvoiceById(invoiceToEdit.id);
      if (fullInvoiceDetails) {
        setEditingInvoice(fullInvoiceDetails);
        setShowInvoiceForm(true);
      } else {
        toast.error('Could not fetch invoice details for editing.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch invoice details for editing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await deleteInvoice(invoiceId);
        setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== invoiceId));
        toast.success('Invoice deleted successfully!');
      } catch (err) {
        toast.error(err.message || 'Failed to delete invoice.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleViewInvoice = async (id) => {
    setIsLoading(true);
    try {
      const invoiceDetails = await getInvoiceById(id);
      if (invoiceDetails) {
        setViewingInvoice(invoiceDetails);
        setShowDetailsModal(true);
      } else {
        toast.error('Could not fetch invoice details.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch invoice details.');
    }
    setIsLoading(false);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setViewingInvoice(null);
  };

  const handleSaveInvoice = async (invoiceData) => {
    setIsLoading(true);
    try {
      if (editingInvoice && editingInvoice.id) {
        const updatedInvoice = await updateInvoice(editingInvoice.id, invoiceData);
        setInvoices(prevInvoices => prevInvoices.map(inv => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
        toast.success('Invoice updated successfully!');
      } else {
        const newInvoice = await createInvoice(invoiceData);
        setInvoices(prevInvoices => [newInvoice, ...prevInvoices]);
        toast.success('Invoice created successfully!');
      }
      setShowInvoiceForm(false);
      setEditingInvoice(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save invoice.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvoiceForm = () => {
    setShowInvoiceForm(false);
    setEditingInvoice(null);
  };

  const handleRecordPayment = (id) => toast.info(`Record Payment for Invoice ${id} functionality to be implemented.`);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    return `$${(isNaN(num) ? 0 : num).toFixed(2)}`;
  };

  if (isLoading) return <div className="loading-container"><div className="spinner"></div><p>Loading invoices...</p></div>;
  if (error) return <div className="error-container"><p>Error: {error}</p><button onClick={fetchInvoices} className="button-primary">Retry</button></div>;

  return (
    <div className="invoice-list-container">
      <div className="list-header">
        <h2>Accounts Receivable - Invoices</h2>
        <button onClick={handleAddInvoice} className="button-primary add-button">
          <FaPlus /> Add New Invoice
        </button>
      </div>

      {invoices.length === 0 && !isLoading && (
        <div className="no-data-message">
          <p>No invoices found. Waiting for sales to close!</p>
        </div>
      )}

      {invoices.length > 0 && (
        <table className="invoice-table data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer Code</th>
              <th>Order ID</th>
              <th>Invoice Date</th>
              <th>Due Date</th>
              <th>Total Amount</th>
              <th>Balance Due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.customerCode}</td>
                <td>{invoice.orderId || 'N/A'}</td>
                <td>{formatDate(invoice.invoiceDate)}</td>
                <td>{formatDate(invoice.dueDate)}</td>
                <td>{formatCurrency(invoice.totalAmount)}</td>
                <td>{formatCurrency(invoice.balanceDue)}</td>
                <td><span className={`status-badge status-${invoice.status?.toLowerCase().replace(' ', '-')}`}>{invoice.status}</span></td>
                <td>
                  <button onClick={() => handleViewInvoice(invoice.id)} className="button-icon view-button" title="View Invoice">
                    <FaEye />
                  </button>
                  <button onClick={() => handleEditInvoice(invoice)} className="button-icon edit-button" title="Edit Invoice">
                    <FaPencilAlt />
                  </button>
                  {invoice.status?.toLowerCase() !== 'paid' && (
                     <button onClick={() => handleRecordPayment(invoice.id)} className="button-icon payment-button" title="Record Payment">
                        <FaFileInvoiceDollar />
                     </button>
                  )}
                  <button onClick={() => handleDeleteInvoice(invoice.id)} className="button-icon delete-button" title="Delete Invoice">
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showDetailsModal && viewingInvoice && (
        <InvoiceDetailsModal 
          invoice={viewingInvoice} 
          onClose={handleCloseDetailsModal} 
        />
      )}
      {showInvoiceForm && (
        <InvoiceForm 
          initialInvoice={editingInvoice} 
          onSave={handleSaveInvoice} 
          onCancel={handleCancelInvoiceForm} 
        />
      )}
    </div>
  );
};

export default InvoiceList;
