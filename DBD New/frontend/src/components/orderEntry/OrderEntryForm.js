import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for line items
import { toast } from 'react-toastify';
import { getProductById } from '../../services/productService'; // Import product service
import { getCustomerByCustomerCode } from '../../services/customerService'; // Import customer service
import './OrderEntryForm.css';

const OrderEntryForm = ({ onSave, onCancel, initialOrder }) => {
  const [order, setOrder] = useState(initialOrder || {
    orderNumber: '',
    customerCode: '',
    orderDate: new Date().toISOString().slice(0, 10), // Default to today
    status: 'Pending',
    salespersonCode: '',
    companyDivisionPrefix: '',
    shipToAddress: {
      name: '', street: '', city: '', state: '', zip: '', country: ''
    },
    billToAddress: {
      name: '', street: '', city: '', state: '', zip: '', country: ''
    },
    notes: '',
    items: [
      {
        id: uuidv4(), // Client-side generated ID for new item
        lineNumber: '001',
        itemNumber: '',
        itemDescription: '',
        quantityOrdered: 1,
        unitPrice: 0,
        // lineTotal will be calculated
        warehouseCode: '',
        sellingUOM: '',
        costingUOM: '',
        vendorCode: '',
        lineType: 'S', // Default to Stock
        taxProductType: '',
        itemWeight: 0,
        poLinkTypeSeq: ''
      }
    ]
    // subTotal, taxAmount, shippingAmount, totalAmount will be calculated or handled by service
  });

  useEffect(() => {
    if (initialOrder) {
      setOrder({
        ...initialOrder,
        orderDate: initialOrder.orderDate ? new Date(initialOrder.orderDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        items: initialOrder.items && initialOrder.items.length > 0 ? initialOrder.items.map(item => ({ ...item, id: item.id || uuidv4() })) : [
          {
            id: uuidv4(), lineNumber: '001', itemNumber: '', itemDescription: '', quantityOrdered: 1, unitPrice: 0,
            warehouseCode: '', sellingUOM: '', costingUOM: '', vendorCode: '', lineType: 'S', taxProductType: '', itemWeight: 0, poLinkTypeSeq: ''
          }
        ]
      });
    }
  }, [initialOrder]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrder(prevOrder => ({
      ...prevOrder,
      [name]: value
    }));

    // If the changed field is 'customerCode', try to fetch customer details
    if (name === 'customerCode' && value) { // value is the customerCode entered
      fetchCustomerDetails(value);
    }
  };

  const handleAddressChange = (addressType, e) => {
    const { name, value } = e.target;
    setOrder(prevOrder => ({
      ...prevOrder,
      [addressType]: {
        ...prevOrder[addressType],
        [name]: value
      }
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...order.items];
    newItems[index][name] = name === 'quantityOrdered' || name === 'unitPrice' || name === 'itemWeight' ? parseFloat(value) || 0 : value;
    setOrder(prevOrder => ({
      ...prevOrder,
      items: newItems
    }));

    // If the changed field is 'itemNumber', try to fetch product details
    if (name === 'itemNumber' && value) { // value is the itemNumber entered
      fetchProductDetails(index, value);
    }
  };

  const fetchCustomerDetails = async (customerCode) => {
    if (!customerCode) return; // Do nothing if customerCode is cleared

    try {
      const customer = await getCustomerByCustomerCode(customerCode);
      if (customer) {
        setOrder(prevOrder => ({
          ...prevOrder,
          shipToAddress: {
            name: customer.shipToAddress?.name || '',
            street1: customer.shipToAddress?.street1 || '',
            street2: customer.shipToAddress?.street2 || '',
            city: customer.shipToAddress?.city || '',
            state: customer.shipToAddress?.state || '',
            zip: customer.shipToAddress?.zip || '',
            country: customer.shipToAddress?.country || ''
          },
          billToAddress: {
            name: customer.billToAddress?.name || '',
            street1: customer.billToAddress?.street1 || '',
            street2: customer.billToAddress?.street2 || '',
            city: customer.billToAddress?.city || '',
            state: customer.billToAddress?.state || '',
            zip: customer.billToAddress?.zip || '',
            country: customer.billToAddress?.country || ''
          }
        }));
        toast.success(`Customer "${customer.name || customerCode}" details loaded.`);
      } else {
        // Customer not found, clear relevant fields
        setOrder(prevOrder => ({
          ...prevOrder,
          shipToAddress: { name: '', street1: '', street2: '', city: '', state: '', zip: '', country: '' },
          billToAddress: { name: '', street1: '', street2: '', city: '', state: '', zip: '', country: '' }
        }));
        toast.warn(`Customer with Code "${customerCode}" not found.`);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error('Failed to fetch customer details.');
      // Optionally clear fields if fetch fails
      setOrder(prevOrder => ({
        ...prevOrder,
        shipToAddress: { name: '', street1: '', street2: '', city: '', state: '', zip: '', country: '' },
        billToAddress: { name: '', street1: '', street2: '', city: '', state: '', zip: '', country: '' }
      }));
    }
  };

  const fetchProductDetails = async (lineIndex, itemNumber) => {
    if (!itemNumber) return; // Do nothing if itemNumber is cleared

    try {
      const product = await getProductById(itemNumber);
      if (product) {
        setOrder(prevOrder => {
          const updatedItems = [...prevOrder.items];
          updatedItems[lineIndex] = {
            ...updatedItems[lineIndex],
            itemDescription: product.name || '',
            unitPrice: product.price !== undefined ? product.price.toString() : '', // Ensure price is a string for input
            // Potentially set UOM, warehouse, etc. if available and needed
          };
          return { ...prevOrder, items: updatedItems };
        });
        // Recalculate totals after product details are fetched and price is updated
        // This will be handled by the useEffect that watches order.items
      } else {
        // Product not found, clear relevant fields or notify user
        setOrder(prevOrder => {
          const updatedItems = [...prevOrder.items];
          updatedItems[lineIndex] = {
            ...updatedItems[lineIndex],
            itemDescription: '', // Clear description
            unitPrice: '',   // Clear price
          };
          return { ...prevOrder, items: updatedItems };
        });
        toast.warn(`Product with Item Number "${itemNumber}" not found.`);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error('Failed to fetch product details.');
      // Optionally clear fields if fetch fails catastrophically
      setOrder(prevOrder => {
        const updatedItems = [...prevOrder.items];
        updatedItems[lineIndex] = {
          ...updatedItems[lineIndex],
          itemDescription: '', 
          unitPrice: '',   
        };
        return { ...prevOrder, items: updatedItems };
      });
    }
  };

  const addItem = () => {
    const newItemLineNumber = (order.items.length + 1).toString().padStart(3, '0');
    setOrder(prevOrder => ({
      ...prevOrder,
      items: [
        ...prevOrder.items,
        {
          id: uuidv4(), // Client-side generated ID
          lineNumber: newItemLineNumber,
          itemNumber: '',
          itemDescription: '',
          quantityOrdered: 1,
          unitPrice: 0,
          warehouseCode: '',
          sellingUOM: '',
          costingUOM: '',
          vendorCode: '',
          lineType: 'S',
          taxProductType: '',
          itemWeight: 0,
          poLinkTypeSeq: ''
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (order.items.length <= 1) {
      toast.warn("An order must have at least one line item.");
      return;
    }
    const newItems = order.items.filter((_, i) => i !== index);
    // Re-number lines if needed
    const renumberedItems = newItems.map((item, idx) => ({ ...item, lineNumber: (idx + 1).toString().padStart(3, '0')}));
    setOrder(prevOrder => ({
      ...prevOrder,
      items: renumberedItems
    }));
  };

  const calculateTotals = (items) => {
    const subTotal = items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitPrice), 0);
    // Basic tax calculation (e.g., 8%), can be more complex
    const taxAmount = subTotal * 0.08; 
    const shippingAmount = order.shippingAmount || 10.00; // Example fixed shipping or make it an input
    const totalAmount = subTotal + taxAmount + shippingAmount;
    return { subTotal, taxAmount, shippingAmount, totalAmount };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (order.items.some(item => !item.itemNumber || item.quantityOrdered <= 0 || item.unitPrice <= 0)) {
      toast.error('Please ensure all line items have an item number, quantity > 0, and price > 0.');
      return;
    }
    const totals = calculateTotals(order.items);
    const finalOrder = {
      ...order,
      ...totals,
      items: order.items.map(item => ({
        ...item,
        lineTotal: item.quantityOrdered * item.unitPrice
      }))
    };
    onSave(finalOrder);
  };

  // Calculate totals for display
  const displayTotals = calculateTotals(order.items);

  return (
    <div className="order-entry-form-container">
      <h3>{initialOrder ? 'Edit Sales Order' : 'Create New Sales Order'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h4>Order Header</h4>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="orderNumber">Order Number</label>
              <input type="text" id="orderNumber" name="orderNumber" value={order.orderNumber} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label htmlFor="customerCode">Customer Code</label>
              <input type="text" id="customerCode" name="customerCode" value={order.customerCode} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label htmlFor="orderDate">Order Date</label>
              <input type="date" id="orderDate" name="orderDate" value={order.orderDate} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={order.status} onChange={handleChange}>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Shipped">Shipped</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="salespersonCode">Salesperson Code</label>
              <input type="text" id="salespersonCode" name="salespersonCode" value={order.salespersonCode} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label htmlFor="companyDivisionPrefix">Company/Division</label>
              <input type="text" id="companyDivisionPrefix" name="companyDivisionPrefix" value={order.companyDivisionPrefix} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Shipping Address</h4>
          <div className="form-grid">
            <div className="form-field"><label>Name</label><input type="text" name="name" value={order.shipToAddress.name} onChange={(e) => handleAddressChange('shipToAddress', e)} /></div>
            <div className="form-field"><label>Street</label><input type="text" name="street" value={order.shipToAddress.street} onChange={(e) => handleAddressChange('shipToAddress', e)} /></div>
            <div className="form-field"><label>City</label><input type="text" name="city" value={order.shipToAddress.city} onChange={(e) => handleAddressChange('shipToAddress', e)} /></div>
            <div className="form-field"><label>State</label><input type="text" name="state" value={order.shipToAddress.state} onChange={(e) => handleAddressChange('shipToAddress', e)} /></div>
            <div className="form-field"><label>ZIP Code</label><input type="text" name="zip" value={order.shipToAddress.zip} onChange={(e) => handleAddressChange('shipToAddress', e)} /></div>
            <div className="form-field"><label>Country</label><input type="text" name="country" value={order.shipToAddress.country} onChange={(e) => handleAddressChange('shipToAddress', e)} /></div>
          </div>
        </div>
        
        <div className="form-section">
          <h4>Billing Address</h4>
          {/* TODO: Add a checkbox 'Same as Shipping' */}
          <div className="form-grid">
            <div className="form-field"><label>Name</label><input type="text" name="name" value={order.billToAddress.name} onChange={(e) => handleAddressChange('billToAddress', e)} /></div>
            <div className="form-field"><label>Street</label><input type="text" name="street" value={order.billToAddress.street} onChange={(e) => handleAddressChange('billToAddress', e)} /></div>
            <div className="form-field"><label>City</label><input type="text" name="city" value={order.billToAddress.city} onChange={(e) => handleAddressChange('billToAddress', e)} /></div>
            <div className="form-field"><label>State</label><input type="text" name="state" value={order.billToAddress.state} onChange={(e) => handleAddressChange('billToAddress', e)} /></div>
            <div className="form-field"><label>ZIP Code</label><input type="text" name="zip" value={order.billToAddress.zip} onChange={(e) => handleAddressChange('billToAddress', e)} /></div>
            <div className="form-field"><label>Country</label><input type="text" name="country" value={order.billToAddress.country} onChange={(e) => handleAddressChange('billToAddress', e)} /></div>
          </div>
        </div>

        <div className="form-section line-items-section">
          <h4>
            Line Items
            <button type="button" onClick={addItem} className="button-add-item">Add Item</button>
          </h4>
          {order.items.map((item, index) => (
            <div key={item.id || index} className="line-item">
              <div className="line-item-grid">
                <div className="form-field">
                  <label htmlFor={`itemNumber-${index}`}>Item Number</label>
                  <input type="text" id={`itemNumber-${index}`} name="itemNumber" value={item.itemNumber} onChange={(e) => handleItemChange(index, e)} required />
                </div>
                <div className="form-field">
                  <label htmlFor={`itemDescription-${index}`}>Description</label>
                  <input type="text" id={`itemDescription-${index}`} name="itemDescription" value={item.itemDescription} onChange={(e) => handleItemChange(index, e)} />
                </div>
                <div className="form-field">
                  <label htmlFor={`quantityOrdered-${index}`}>Quantity</label>
                  <input type="number" id={`quantityOrdered-${index}`} name="quantityOrdered" value={item.quantityOrdered} onChange={(e) => handleItemChange(index, e)} min="1" required />
                </div>
                <div className="form-field">
                  <label htmlFor={`unitPrice-${index}`}>Unit Price</label>
                  <input type="number" id={`unitPrice-${index}`} name="unitPrice" value={item.unitPrice} onChange={(e) => handleItemChange(index, e)} step="0.01" min="0" required />
                </div>
                <div className="form-field">
                  <label>Line Total</label>
                  <input type="text" value={(item.quantityOrdered * item.unitPrice).toFixed(2)} readOnly />
                </div>
                <div className="form-field">
                  <label htmlFor={`warehouseCode-${index}`}>Warehouse</label>
                  <input type="text" id={`warehouseCode-${index}`} name="warehouseCode" value={item.warehouseCode} onChange={(e) => handleItemChange(index, e)} />
                </div>
                <div className="form-field">
                  <label htmlFor={`sellingUOM-${index}`}>Selling UOM</label>
                  <input type="text" id={`sellingUOM-${index}`} name="sellingUOM" value={item.sellingUOM} onChange={(e) => handleItemChange(index, e)} />
                </div>
                {order.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="button-remove-item">Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="form-section">
            <h4>Order Totals</h4>
            <div className="form-grid">
                <div className="form-field">
                    <label>Subtotal</label>
                    <input type="text" value={displayTotals.subTotal.toFixed(2)} readOnly />
                </div>
                <div className="form-field">
                    <label>Tax Amount (8%)</label> {/* Example tax rate */}
                    <input type="text" value={displayTotals.taxAmount.toFixed(2)} readOnly />
                </div>
                <div className="form-field">
                    <label htmlFor="shippingAmount">Shipping Amount</label>
                    <input 
                        type="number" 
                        id="shippingAmount" 
                        name="shippingAmount" 
                        value={order.shippingAmount === undefined ? 10.00 : order.shippingAmount} 
                        onChange={handleChange} 
                        step="0.01" 
                        min="0" 
                    />
                </div>
                <div className="form-field">
                    <label>Total Amount</label>
                    <input type="text" value={displayTotals.totalAmount.toFixed(2)} readOnly />
                </div>
            </div>
        </div>

        <div className="form-section">
          <h4>Notes</h4>
          <div className="form-field">
            <textarea id="notes" name="notes" value={order.notes} onChange={handleChange}></textarea>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="button-save">Save Order</button>
          {onCancel && <button type="button" onClick={onCancel} className="button-cancel">Cancel</button>}
        </div>
      </form>
    </div>
  );
};

export default OrderEntryForm;
