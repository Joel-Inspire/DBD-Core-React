import React, { useState, useEffect, useCallback } from 'react';
import { getOrderEntries, createOrderEntry, updateOrderEntry, deleteOrderEntry } from '../../services/orderEntryService';
import OrderEntryForm from './OrderEntryForm';
import OrderDetailsModal from './OrderDetailsModal';
import { FaPlus, FaPencilAlt, FaTrashAlt, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './OrderEntryList.css';

const OrderEntryList = () => {
  const [orderEntries, setOrderEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOrderEntries();
      setOrderEntries(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch sales orders.');
      toast.error(err.message || 'Failed to fetch sales orders.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAddOrder = () => {
    setEditingOrder(null);
    setShowAddForm(true);
  };

  const handleSaveOrder = async (orderData) => {
    setIsLoading(true);
    try {
      if (editingOrder && editingOrder.id) {
        await updateOrderEntry(editingOrder.id, orderData);
        toast.success('Sales order updated successfully!');
      } else {
        await createOrderEntry(orderData);
        toast.success('Sales order added successfully!');
      }
      setShowAddForm(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to save sales order.');
      setError(err.message || 'Failed to save sales order.');
    }
    setIsLoading(false);
  };

  const handleCancelAddOrder = () => {
    setShowAddForm(false);
    setEditingOrder(null);
  };

  const handleEditOrder = (orderId) => {
    const orderToEdit = orderEntries.find(order => order.id === orderId);
    setEditingOrder(orderToEdit);
    setShowAddForm(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      try {
        await deleteOrderEntry(orderId);
        setOrderEntries(prevOrders => prevOrders.filter(order => order.id !== orderId));
        toast.success('Sales order deleted successfully.');
      } catch (err) {
        toast.error(err.message || 'Failed to delete sales order.');
      }
    }
  };

  const handleViewOrder = (orderId) => {
    const orderToView = orderEntries.find(order => order.id === orderId);
    if (orderToView) {
      setViewingOrder(orderToView);
      setShowDetailsModal(true);
    } else {
      toast.error('Could not find order details.');
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setViewingOrder(null);
  };

  if (isLoading) return <div className="loading-container"><div className="spinner"></div><p>Loading sales orders...</p></div>;
  if (error) return <div className="error-container"><p>Error: {error}</p><button onClick={fetchOrders}>Retry</button></div>;

  return (
    <div className="order-entry-list-container">
      <div className="list-header">
        <h2>Sales Orders</h2>
        {!showAddForm && (
          <button onClick={handleAddOrder} className="button-primary add-button">
            <FaPlus /> Add New Order
          </button>
        )}
      </div>

      {showAddForm && (
        <OrderEntryForm 
          onSave={handleSaveOrder} 
          onCancel={handleCancelAddOrder} 
          initialOrder={editingOrder} 
        />
      )}

      {showDetailsModal && viewingOrder && (
        <OrderDetailsModal 
          order={viewingOrder} 
          onClose={handleCloseDetailsModal} 
        />
      )}

      {orderEntries.length === 0 && !isLoading && (
        <div className="no-data-message">
          <p>No sales orders found. Why not add one?</p>
        </div>
      )}

      {orderEntries.length > 0 && (
        <table className="styled-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer ID</th>
              <th>Order Date</th>
              <th>Status</th>
              <th>Total Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orderEntries.map(order => (
              <tr key={order.id}>
                <td>{order.orderNumber || order.id}</td>
                <td>{order.customerCode || 'N/A'}</td>
                <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</td>
                <td>{order.status || 'N/A'}</td>
                <td>${(order.totalAmount !== undefined ? order.totalAmount : 0).toFixed(2)}</td>
                <td>
                  <button onClick={() => handleViewOrder(order.id)} className="button-icon view-button" title="View Order">
                    <FaEye />
                  </button>
                  <button onClick={() => handleEditOrder(order.id)} className="button-icon edit-button" title="Edit Order">
                    <FaPencilAlt />
                  </button>
                  <button onClick={() => handleDeleteOrder(order.id)} className="button-icon delete-button" title="Delete Order">
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderEntryList;
