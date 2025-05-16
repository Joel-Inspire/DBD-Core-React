import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, recordPayment } from '../../services/accountsReceivableService';
import { toast } from 'react-toastify';
import './InvoiceList.css';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import InvoiceForm from './InvoiceForm';
import RecordPaymentModal from './RecordPaymentModal';
import { FaPlus, FaPencilAlt, FaTrashAlt, FaEye, FaFileInvoiceDollar } from 'react-icons/fa';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);

  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
        const newInvoiceData = {
          ...invoiceData,
          invoiceNumber: `INV-${Date.now()}` 
        };
        const newInvoice = await createInvoice(newInvoiceData);
        setInvoices(prevInvoices => [newInvoice, ...prevInvoices]);
        toast.success('Invoice created successfully!');
      }
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

  const handleOpenRecordPaymentModal = (invoice) => {
    setPayingInvoice(invoice);
    setShowRecordPaymentModal(true);
  };

  const handleCloseRecordPaymentModal = () => {
    setPayingInvoice(null);
    setShowRecordPaymentModal(false);
  };

  const handleSavePayment = async (invoiceId, paymentData) => {
    setIsLoading(true);
    try {
      const updatedInvoice = await recordPayment(invoiceId, paymentData);
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
      );
      toast.success('Payment recorded successfully!');
      handleCloseRecordPaymentModal();
      if (viewingInvoice && viewingInvoice.id === invoiceId) {
        setViewingInvoice(updatedInvoice);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record payment.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and Paginate Invoices
  const filteredAndPaginatedInvoices = useMemo(() => {
    let filtered = invoices;
    if (searchTerm) {
      filtered = invoices.filter(invoice => 
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Paginate
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  }, [invoices, searchTerm, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(invoices.filter(invoice => 
    searchTerm ? 
    (invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.status?.toLowerCase().includes(searchTerm.toLowerCase())) 
    : true
  ).length / itemsPerPage);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    return `$${(isNaN(num) ? 0 : num).toFixed(2)}`;
  };

  return (
    <div className="invoice-list-container">
      <div className="list-header">
        <h2>Accounts Receivable - Invoices</h2>
        <button onClick={handleAddInvoice} className="button-primary add-button">
          <FaPlus /> Add New Invoice
        </button>
        <input 
          type="text" 
          placeholder="Search Invoices (Number, Customer, Order ID, Status)..." 
          value={searchTerm} 
          onChange={handleSearchChange} 
          className="search-input"
        />
      </div>

      {isLoading && <div className="loading-container"><div className="spinner"></div><p>Loading invoices...</p></div>}
      {error && <div className="error-container"><p>Error: {error}</p><button onClick={fetchInvoices} className="button-primary">Retry</button></div>}
      {!isLoading && !error && invoices.length === 0 && (
        <div className="no-data-message">
          <p>No invoices found. Waiting for sales to close!</p>
        </div>
      )}
      {!isLoading && !error && invoices.length > 0 && filteredAndPaginatedInvoices.length === 0 && (
         <div className="no-data-message">
          <p>No invoices match your search criteria.</p>
        </div>
      )}
      {!isLoading && !error && filteredAndPaginatedInvoices.length > 0 && (
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
            {filteredAndPaginatedInvoices.map((invoice) => (
              <tr key={invoice.id} className={`status-${invoice.status?.toLowerCase().replace(' ', '-')}`}>
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
                  <button 
                    onClick={() => handleOpenRecordPaymentModal(invoice)} 
                    className="button-icon record-payment-button" 
                    title="Record Payment"
                    disabled={invoice.status?.toLowerCase() === 'paid'} 
                  >
                    <FaFileInvoiceDollar />
                  </button>
                  <button 
                    onClick={() => handleDeleteInvoice(invoice.id)} 
                    className="button-icon delete-button" 
                    title="Delete Invoice"
                    disabled={invoice.status?.toLowerCase() === 'paid' || parseFloat(invoice.amountPaid) > 0} 
                  >
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!isLoading && !error && totalPages > 1 && (
        <div className="pagination-controls">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            &laquo; Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next &raquo;
          </button>
        </div>
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
      {showRecordPaymentModal && payingInvoice && (
        <RecordPaymentModal
          invoice={payingInvoice}
          onSave={handleSavePayment}
          onCancel={handleCloseRecordPaymentModal}
        />
      )}
    </div>
  );
};

export default InvoiceList;
