import React, { useState, useEffect } from 'react';
import './ProductList.css';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../services/productService';

const initialProductFormState = {
  PROD_ID: '',
  PROD_NAME: '',
  PROD_DESC: '',
  PROD_CATEGORY: '',
  PROD_PRICE: '',
  PROD_STOCK_QTY: '',
  VEND_CODE: '',
};

const ProductList = () => {
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState(initialProductFormState);
  const [addingProduct, setAddingProduct] = useState(false);
  const [addProductError, setAddProductError] = useState(null);

  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); 
  const [currentEditForm, setCurrentEditForm] = useState(initialProductFormState); 
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [editProductError, setEditProductError] = useState(null);

  const [deletingProductId, setDeletingProductId] = useState(null); 
  const [deleteProductError, setDeleteProductError] = useState(null);

  useEffect(() => {
    let isMounted = true; 

    const loadProducts = async () => {
      if (!isMounted) { 
          return;
      }
      
      try {
        const data = await getProducts(); 
        if (isMounted) { 
          setProducts(data || []); 
          setError(null);         
          setLoading(false);      
        }
      } catch (err) {
        if (isMounted) { 
          console.error("Failed to fetch products:", err);
          setError(err.message || 'Failed to load products. Please try again later.');
          setProducts([]);       
          setLoading(false);     
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false; 
    };
  }, []);

  const handleFormInputChange = (event, formSetter) => {
    const { name, value } = event.target;
    formSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProductSubmit = async (event) => {
    event.preventDefault();
    setAddingProduct(true);
    setAddProductError(null);
    try {
      if (!newProduct.PROD_NAME || !newProduct.PROD_ID) {
        throw new Error('Product Name and Product ID (SKU) are required.');
      }
      const productToAdd = {
        ...newProduct,
        PROD_PRICE: parseFloat(newProduct.PROD_PRICE) || 0,
        PROD_STOCK_QTY: parseInt(newProduct.PROD_STOCK_QTY, 10) || 0,
      };
      const added = await addProduct(productToAdd);
      setProducts(prevProducts => [...prevProducts, added]); 
      setShowAddProductModal(false);
      setNewProduct(initialProductFormState); 
    } catch (err) {
      console.error("Failed to add product:", err);
      setAddProductError(err.message || 'Failed to add product.');
    } finally {
      setAddingProduct(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setCurrentEditForm({ 
      ...initialProductFormState,
      ...product,
      PROD_PRICE: product.PROD_PRICE !== undefined ? product.PROD_PRICE.toString() : '',
      PROD_STOCK_QTY: product.PROD_STOCK_QTY !== undefined ? product.PROD_STOCK_QTY.toString() : '',
    });
    setShowEditProductModal(true);
    setEditProductError(null);
  };

  const handleEditProductSubmit = async (event) => {
    event.preventDefault();
    if (!editingProduct) return;

    setUpdatingProduct(true);
    setEditProductError(null);
    try {
      if (!currentEditForm.PROD_NAME || !currentEditForm.PROD_ID) {
        throw new Error('Product Name and Product ID (SKU) are required.');
      }
      const productToUpdate = {
        ...currentEditForm,
        PROD_PRICE: parseFloat(currentEditForm.PROD_PRICE) || 0,
        PROD_STOCK_QTY: parseInt(currentEditForm.PROD_STOCK_QTY, 10) || 0,
      };
      const updated = await updateProduct(editingProduct.id, productToUpdate);
      setProducts(prevProducts => 
        prevProducts.map(p => (p.id === editingProduct.id ? updated : p)) 
      );
      setShowEditProductModal(false);
      setEditingProduct(null);
    } catch (err) {
      console.error("Failed to update product:", err);
      setEditProductError(err.message || 'Failed to update product.');
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handleDeleteClick = async (productId, productName) => {
    setDeleteProductError(null);

    if (window.confirm(`Are you sure you want to delete the product "${productName}" (ID: ${productId})?`)) {
      setDeletingProductId(productId); 
      try {
        await deleteProduct(productId);
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId)); 
      } catch (err) {
        console.error("Failed to delete product:", err);
        setDeleteProductError(`Failed to delete product ${productName} (ID: ${productId}). ${err.message || ''}`);
      } finally {
        setDeletingProductId(null); 
      }
    }
  };

  if (loading) {
    return <div className="product-list-container centered-message">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="product-list-container centered-message error-message">
        Error: {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="product-list-container">
        <h1>Product Management</h1>
        <button 
          onClick={() => { setShowAddProductModal(true); setAddProductError(null); setNewProduct(initialProductFormState); }} 
          className="add-product-button"
        >
          Add New Product
        </button>
        <div className="centered-message">No products found.</div>
        {showAddProductModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h2>Add New Product</h2>
              <form onSubmit={handleAddProductSubmit}>
                <div>
                  <label htmlFor="add-PROD_NAME">Product Name:</label>
                  <input type="text" id="add-PROD_NAME" name="PROD_NAME" value={newProduct.PROD_NAME} onChange={(e) => handleFormInputChange(e, setNewProduct)} required />
                </div>
                <div>
                  <label htmlFor="add-PROD_ID">Product ID (SKU):</label>
                  <input type="text" id="add-PROD_ID" name="PROD_ID" value={newProduct.PROD_ID} onChange={(e) => handleFormInputChange(e, setNewProduct)} required />
                </div>
                <div>
                  <label htmlFor="add-PROD_CATEGORY">Category:</label>
                  <input type="text" id="add-PROD_CATEGORY" name="PROD_CATEGORY" value={newProduct.PROD_CATEGORY} onChange={(e) => handleFormInputChange(e, setNewProduct)} />
                </div>
                <div>
                  <label htmlFor="add-PROD_PRICE">Price:</label>
                  <input type="number" id="add-PROD_PRICE" name="PROD_PRICE" value={newProduct.PROD_PRICE} onChange={(e) => handleFormInputChange(e, setNewProduct)} step="0.01" />
                </div>
                <div>
                  <label htmlFor="add-PROD_STOCK_QTY">Stock Quantity:</label>
                  <input type="number" id="add-PROD_STOCK_QTY" name="PROD_STOCK_QTY" value={newProduct.PROD_STOCK_QTY} onChange={(e) => handleFormInputChange(e, setNewProduct)} step="1" />
                </div>
                <div>
                  <label htmlFor="add-VEND_CODE">Vendor Code:</label>
                  <input type="text" id="add-VEND_CODE" name="VEND_CODE" value={newProduct.VEND_CODE} onChange={(e) => handleFormInputChange(e, setNewProduct)} />
                </div>
                <div>
                  <label htmlFor="add-PROD_DESC">Description:</label>
                  <textarea id="add-PROD_DESC" name="PROD_DESC" value={newProduct.PROD_DESC} onChange={(e) => handleFormInputChange(e, setNewProduct)}></textarea>
                </div>
                {addProductError && <p className="error-message form-error">{addProductError}</p>}
                <div className="form-actions">
                  <button type="submit" disabled={addingProduct}>
                    {addingProduct ? 'Saving...' : 'Save Product'}
                  </button>
                  <button type="button" onClick={() => { setShowAddProductModal(false); setAddProductError(null); setNewProduct(initialProductFormState); }} disabled={addingProduct}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <h1>Product Management</h1>
      <button 
        onClick={() => { setShowAddProductModal(true); setAddProductError(null); setNewProduct(initialProductFormState); }} 
        className="add-product-button"
      >
        Add New Product
      </button>

      {showAddProductModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Add New Product</h2>
            <form onSubmit={handleAddProductSubmit}>
              <div>
                <label htmlFor="add-PROD_NAME">Product Name:</label>
                <input type="text" id="add-PROD_NAME" name="PROD_NAME" value={newProduct.PROD_NAME} onChange={(e) => handleFormInputChange(e, setNewProduct)} required />
              </div>
              <div>
                <label htmlFor="add-PROD_ID">Product ID (SKU):</label>
                <input type="text" id="add-PROD_ID" name="PROD_ID" value={newProduct.PROD_ID} onChange={(e) => handleFormInputChange(e, setNewProduct)} required />
              </div>
              <div>
                <label htmlFor="add-PROD_CATEGORY">Category:</label>
                <input type="text" id="add-PROD_CATEGORY" name="PROD_CATEGORY" value={newProduct.PROD_CATEGORY} onChange={(e) => handleFormInputChange(e, setNewProduct)} />
              </div>
              <div>
                <label htmlFor="add-PROD_PRICE">Price:</label>
                <input type="number" id="add-PROD_PRICE" name="PROD_PRICE" value={newProduct.PROD_PRICE} onChange={(e) => handleFormInputChange(e, setNewProduct)} step="0.01" />
              </div>
              <div>
                <label htmlFor="add-PROD_STOCK_QTY">Stock Quantity:</label>
                <input type="number" id="add-PROD_STOCK_QTY" name="PROD_STOCK_QTY" value={newProduct.PROD_STOCK_QTY} onChange={(e) => handleFormInputChange(e, setNewProduct)} step="1" />
              </div>
              <div>
                <label htmlFor="add-VEND_CODE">Vendor Code:</label>
                <input type="text" id="add-VEND_CODE" name="VEND_CODE" value={newProduct.VEND_CODE} onChange={(e) => handleFormInputChange(e, setNewProduct)} />
              </div>
              <div>
                <label htmlFor="add-PROD_DESC">Description:</label>
                <textarea id="add-PROD_DESC" name="PROD_DESC" value={newProduct.PROD_DESC} onChange={(e) => handleFormInputChange(e, setNewProduct)}></textarea>
              </div>
              {addProductError && <p className="error-message form-error">{addProductError}</p>}
              <div className="form-actions">
                <button type="submit" disabled={addingProduct}>
                  {addingProduct ? 'Saving...' : 'Save Product'}
                </button>
                <button type="button" onClick={() => { setShowAddProductModal(false); setAddProductError(null); setNewProduct(initialProductFormState); }} disabled={addingProduct}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditProductModal && editingProduct && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Edit Product: {editingProduct.PROD_NAME}</h2>
            <form onSubmit={handleEditProductSubmit}>
              <div>
                <label htmlFor="edit-PROD_NAME">Product Name:</label>
                <input type="text" id="edit-PROD_NAME" name="PROD_NAME" value={currentEditForm.PROD_NAME} onChange={(e) => handleFormInputChange(e, setCurrentEditForm)} required />
              </div>
              <div>
                <label htmlFor="edit-PROD_ID">Product ID (SKU):</label>
                <input type="text" id="edit-PROD_ID" name="PROD_ID" value={currentEditForm.PROD_ID} onChange={(e) => handleFormInputChange(e, setCurrentEditForm)} required readOnly />
              </div>
              <div>
                <label htmlFor="edit-PROD_CATEGORY">Category:</label>
                <input type="text" id="edit-PROD_CATEGORY" name="PROD_CATEGORY" value={currentEditForm.PROD_CATEGORY} onChange={(e) => handleFormInputChange(e, setCurrentEditForm)} />
              </div>
              <div>
                <label htmlFor="edit-PROD_PRICE">Price:</label>
                <input type="number" id="edit-PROD_PRICE" name="PROD_PRICE" value={currentEditForm.PROD_PRICE} onChange={(e) => handleFormInputChange(e, setCurrentEditForm)} step="0.01" />
              </div>
              <div>
                <label htmlFor="edit-PROD_STOCK_QTY">Stock Quantity:</label>
                <input type="number" id="edit-PROD_STOCK_QTY" name="PROD_STOCK_QTY" value={currentEditForm.PROD_STOCK_QTY} onChange={(e) => handleFormInputChange(e, setCurrentEditForm)} step="1" />
              </div>
              <div>
                <label htmlFor="edit-VEND_CODE">Vendor Code:</label>
                <input type="text" id="edit-VEND_CODE" name="VEND_CODE" value={currentEditForm.VEND_CODE} onChange={(e) => handleFormInputChange(e, setCurrentEditForm)} />
              </div>
              <div>
                <label htmlFor="edit-PROD_DESC">Description:</label>
                <textarea id="edit-PROD_DESC" name="PROD_DESC" value={currentEditForm.PROD_DESC} onChange={(e) => handleFormInputChange(e, setCurrentEditForm)}></textarea>
              </div>
              {editProductError && <p className="error-message form-error">{editProductError}</p>}
              <div className="form-actions">
                <button type="submit" disabled={updatingProduct}>
                  {updatingProduct ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { setShowEditProductModal(false); setEditProductError(null); }} disabled={updatingProduct}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ul className="product-item-list">
        {products.map(product => (
          <li key={product.id || product.PROD_ID} className="product-item">
            <div className="product-info">
              <h3>{product.PROD_NAME} - {product.PROD_ID}</h3>
              <p>Category: {product.PROD_CATEGORY || 'N/A'}</p>
              <p>Price: ${typeof product.PROD_PRICE === 'number' ? product.PROD_PRICE.toFixed(2) : 'N/A'}</p>
              <p>Stock: {product.PROD_STOCK_QTY !== undefined ? product.PROD_STOCK_QTY : 'N/A'}</p>
              <p>Vendor: {product.VEND_CODE || 'N/A'}</p>
              <p>Description: {product.PROD_DESC || 'No description available.'}</p>
            </div>
            <div className="product-actions">
              <button onClick={() => handleEditClick(product)} className="edit-button">Edit</button>
              <button 
                onClick={() => handleDeleteClick(product.id || product.PROD_ID, product.PROD_NAME)} 
                disabled={deletingProductId === (product.id || product.PROD_ID)}
                className="delete-button"
              >
                {deletingProductId === (product.id || product.PROD_ID) ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {deleteProductError && 
        <p className="error-message centered-message">{deleteProductError}</p>
      }
    </div>
  );
};

export default ProductList;
