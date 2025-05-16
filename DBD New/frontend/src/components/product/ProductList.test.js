import React from 'react';
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductList from './ProductList';
import * as productService from '../../services/productService';

// --- Mocks --- //
jest.mock('../../services/productService');

const mockProducts = [
  { id: 'P001', PROD_ID: 'SKU001', PROD_NAME: 'Laptop Pro', PROD_CATEGORY: 'Electronics', PROD_PRICE: 1200.00, PROD_STOCK_QTY: 50, VEND_CODE: 'V001' },
  { id: 'P002', PROD_ID: 'SKU002', PROD_NAME: 'Wireless Mouse', PROD_CATEGORY: 'Accessories', PROD_PRICE: 25.00, PROD_STOCK_QTY: 150, VEND_CODE: 'V002' },
  { id: 'P003', PROD_ID: 'SKU003', PROD_NAME: 'Office Chair', PROD_CATEGORY: 'Furniture', PROD_PRICE: 150.00, PROD_STOCK_QTY: 30, VEND_CODE: 'V001' },
];

// --- Test Suite --- //
describe('ProductList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    productService.getProducts.mockImplementation(async () => []); // Default to empty array
  });

  test('renders a heading and shows loading state initially, then empty state', async () => {
    render(<ProductList />);    
    expect(screen.getByRole('heading', { name: /product management/i })).toBeInTheDocument();
    expect(screen.getByText(/loading products.../i)).toBeInTheDocument(); // Check loading state first
    
    await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i)); // Wait for loading to finish
    
    expect(screen.getByText(/no products found/i)).toBeInTheDocument(); // Check final empty state
  });

  test('displays an empty state message when no products are available after loading', async () => {
    productService.getProducts.mockImplementationOnce(async () => []); 
    render(<ProductList />);
    expect(screen.getByText(/loading products.../i)).toBeInTheDocument();
    
    await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i));
    
    expect(productService.getProducts).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    expect(screen.queryByText(/error:/i)).not.toBeInTheDocument();
  });

  test('displays a list of products when products are available after loading', async () => {
    productService.getProducts.mockImplementationOnce(async () => mockProducts);
    render(<ProductList />);
    expect(screen.getByText(/loading products.../i)).toBeInTheDocument();

    await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i));
    
    expect(screen.getByText(mockProducts[0].PROD_NAME)).toBeInTheDocument();
    expect(screen.getByText(mockProducts[1].PROD_NAME)).toBeInTheDocument();
    expect(screen.getByText(mockProducts[2].PROD_NAME)).toBeInTheDocument();
    expect(screen.queryByText(/no products found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/error:/i)).not.toBeInTheDocument();
  });

  test('displays an error message when fetching products fails after loading attempt', async () => {
    const errorMessage = 'Network Error: Failed to fetch products';
    productService.getProducts.mockImplementationOnce(async () => {
      throw new Error(errorMessage);
    });
    render(<ProductList />);
    expect(screen.getByText(/loading products.../i)).toBeInTheDocument();

    await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i));
    
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument(); 
  });

  describe('Add Product', () => {
    // Test for rendering the add product form/button (can be expanded)
    test('renders an "Add Product" button after initial load (empty state)', async () => {
      // productService.getProducts is mocked to return [] by default
      render(<ProductList />);
      expect(screen.getByText(/loading products.../i)).toBeInTheDocument();
      await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i)); 
      
      expect(screen.getByText(/no products found/i)).toBeInTheDocument(); // Confirm empty state
      expect(screen.getByRole('button', { name: /add new product/i })).toBeInTheDocument();
    });

    test('adds a new product and displays it in the list', async () => {
      const initialProducts = [
        { id: 'P001', PROD_ID: 'SKU001', PROD_NAME: 'Existing Laptop', PROD_STOCK_QTY: 10 },
      ];
      const newProduct = {
        // id will be assigned by json-server typically, but for mock, we can define it
        id: 'P002', PROD_ID: 'SKU002', PROD_NAME: 'New Awesome Mouse', PROD_DESC: 'Wireless, ergonomic', PROD_CATEGORY: 'Accessory', PROD_PRICE: 49.99, PROD_STOCK_QTY: 150, VEND_CODE: 'V001',
      };

      // For this test, assume getProducts is called again after adding.
      // 1st call for initial load, 2nd call after adding product.
      productService.getProducts
        .mockImplementationOnce(async () => {
          return initialProducts; // Initial load
        })
        .mockImplementationOnce(async () => {
          return [...initialProducts, newProduct]; // After add
        });
      
      productService.addProduct = jest.fn().mockImplementationOnce(async () => newProduct);

      render(<ProductList />);
      expect(screen.getByText(/loading products.../i)).toBeInTheDocument();
      await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i));
      expect(screen.getByText(initialProducts[0].PROD_NAME)).toBeInTheDocument(); // Initial products loaded

      // Simulate user opening the form (if it's a modal) and filling it
      // For simplicity, let's assume form fields are directly available or revealed by a button
      // This part will likely need adjustment based on the actual form implementation
      fireEvent.click(screen.getByRole('button', { name: /add new product/i }));
      
      // Wait for form fields to appear (if form is shown conditionally)
      // Example: assuming input fields have labels or accessible names
      await screen.findByLabelText(/product name/i);

      fireEvent.change(screen.getByLabelText(/product name/i), { target: { value: newProduct.PROD_NAME } });
      fireEvent.change(screen.getByLabelText(/product id \(sku\)/i), { target: { value: newProduct.PROD_ID } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: newProduct.PROD_CATEGORY } });
      fireEvent.change(screen.getByLabelText(/price/i), { target: { value: parseFloat(newProduct.PROD_PRICE) } });
      fireEvent.change(screen.getByLabelText(/stock quantity/i), { target: { value: parseInt(newProduct.PROD_STOCK_QTY, 10) } });
      fireEvent.change(screen.getByLabelText(/vendor code/i), { target: { value: newProduct.VEND_CODE } });
      // fireEvent.change(screen.getByLabelText(/description/i), { target: { value: newProduct.PROD_DESC } }); // Optional

      fireEvent.click(screen.getByRole('button', { name: /save product/i }));

      // Wait for the list to re-render with the new product.
      await waitFor(() => {
        expect(screen.getByText(newProduct.PROD_NAME)).toBeInTheDocument();
        // Potentially check that a loading indicator for the add operation is gone, if applicable
      });

      // Verify all products are present
      expect(screen.getByText(initialProducts[0].PROD_NAME)).toBeInTheDocument();
      expect(screen.queryByText(/no products found/i)).not.toBeInTheDocument();
      // Also check that addProduct was called with the correct data
      expect(productService.addProduct).toHaveBeenCalledWith(expect.objectContaining({
        PROD_NAME: newProduct.PROD_NAME,
        PROD_ID: newProduct.PROD_ID,
        PROD_CATEGORY: newProduct.PROD_CATEGORY,
        PROD_PRICE: newProduct.PROD_PRICE,
        PROD_STOCK_QTY: newProduct.PROD_STOCK_QTY,
        VEND_CODE: newProduct.VEND_CODE,
      }));
      // Check if it's added to the list (example)
      expect(screen.getByText(`${newProduct.PROD_NAME} - ${newProduct.PROD_ID} (Stock: ${newProduct.PROD_STOCK_QTY})`)).toBeInTheDocument();
    });

    test('shows error if adding product fails', async () => {
      const initialProducts = [mockProducts[0]];
      const addError = 'Failed to add product';
      productService.getProducts.mockImplementationOnce(async () => initialProducts);
      productService.addProduct.mockRejectedValueOnce(new Error(addError));

      render(<ProductList />);
      expect(screen.getByText(/loading products.../i)).toBeInTheDocument();
      await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i));
      expect(screen.getByText(initialProducts[0].PROD_NAME)).toBeInTheDocument(); // Initial products loaded

      // Simulate opening modal and filling form
      fireEvent.click(screen.getByRole('button', { name: /add new product/i }));
      
      // Wait for form fields to appear (if form is shown conditionally)
      // Example: assuming input fields have labels or accessible names
      await screen.findByLabelText(/product name/i);

      fireEvent.change(screen.getByLabelText(/product name/i), { target: { value: 'New Product' } });
      fireEvent.change(screen.getByLabelText(/product id \(sku\)/i), { target: { value: 'SKU123' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'New Category' } });
      fireEvent.change(screen.getByLabelText(/price/i), { target: { value: 99.99 } });
      fireEvent.change(screen.getByLabelText(/stock quantity/i), { target: { value: 100 } });
      fireEvent.change(screen.getByLabelText(/vendor code/i), { target: { value: 'VEND123' } });

      fireEvent.click(screen.getByRole('button', { name: /save product/i }));

      // Look for the specific error message related to adding
      await waitFor(() => {
        expect(screen.getByText(new RegExp(addError, 'i'))).toBeInTheDocument();
      });
    });
  });

  describe('Edit Product', () => {
    const productsToEdit = [
      { id: 'P001', PROD_ID: 'SKU001', PROD_NAME: 'Editable Laptop', PROD_CATEGORY: 'Electronics', PROD_PRICE: 1200, PROD_STOCK_QTY: 10, VEND_CODE: 'V001' },
      { id: 'P002', PROD_ID: 'SKU002', PROD_NAME: 'Editable Chair', PROD_CATEGORY: 'Furniture', PROD_PRICE: 150, PROD_STOCK_QTY: 5, VEND_CODE: 'V002' },
    ];

    beforeEach(async () => {
      // Ensure getProducts is mocked for each edit test run for the initial load
      productService.getProducts.mockImplementationOnce(async () => productsToEdit);
      // Mock updateProduct for the describe block, specific tests can override
      productService.updateProduct = jest.fn().mockImplementation(async (id, data) => ({ id, ...data }));
    });

    test('opens edit modal with product data when Edit is clicked', async () => {
      render(<ProductList />); 
      expect(screen.getByText(/loading products.../i)).toBeInTheDocument();
      await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i));
      expect(screen.getByText(productsToEdit[0].PROD_NAME)).toBeInTheDocument(); // Initial products loaded
      
      const productToEdit = productsToEdit[0];
      const productItem = screen.getByText(new RegExp(productToEdit.PROD_NAME));
      fireEvent.click(within(productItem.closest('li')).getByRole('button', { name: /edit/i }));

      // Wait for form to appear (assuming it's a modal like Add Product)
      // and check if fields are pre-filled
      // Example: using findByLabelText for async form appearance
      expect(await screen.findByLabelText(/product name/i)).toHaveValue(productToEdit.PROD_NAME);
      expect(screen.getByLabelText(/product id \(sku\)/i)).toHaveValue(productToEdit.PROD_ID);
      expect(screen.getByLabelText(/category/i)).toHaveValue(productToEdit.PROD_CATEGORY);
      expect(screen.getByLabelText(/price/i)).toHaveValue(productToEdit.PROD_PRICE.toString());
      expect(screen.getByLabelText(/stock quantity/i)).toHaveValue(productToEdit.PROD_STOCK_QTY.toString());
      expect(screen.getByLabelText(/vendor code/i)).toHaveValue(productToEdit.VEND_CODE);
    });

    test('updates a product and reflects changes in the list', async () => {
      const productToEdit = { ...productsToEdit[0] }; // Clone
      const updatedName = 'Super Duper Laptop Pro';
      const updatedPrice = 1350.99;

      productService.getProducts.mockImplementationOnce(async () => [productToEdit]);
      productService.updateProduct.mockImplementationOnce(async (id, prod) => ({ ...prod, id }));

      render(<ProductList />);
      expect(screen.getByText(/loading products.../i)).toBeInTheDocument();
      await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i));
      expect(screen.getByText(productToEdit.PROD_NAME)).toBeInTheDocument(); // Initial product loaded

      const productItem = screen.getByText(new RegExp(productToEdit.PROD_NAME));
      fireEvent.click(within(productItem.closest('li')).getByRole('button', { name: /edit/i }));

      // Wait for form and fill it
      const nameInput = await screen.findByLabelText(/product name/i);
      fireEvent.change(nameInput, { target: { value: updatedName } });
      fireEvent.change(screen.getByLabelText(/price/i), { target: { value: updatedPrice.toString() } });

      fireEvent.click(screen.getByRole('button', { name: /save changes/i })); // Or 'Save Product' if same button is used

      // Wait for the updated product name to appear in the list
      await waitFor(() => {
        expect(screen.getByText(updatedName)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(updatedPrice.toString()))).toBeInTheDocument();
      });
      expect(screen.getByText(`${updatedName} - ${productToEdit.PROD_ID} (Stock: ${productToEdit.PROD_STOCK_QTY})`)).toBeInTheDocument();
      expect(screen.queryByText(new RegExp(productToEdit.PROD_NAME))).not.toBeInTheDocument(); // Old name should be gone

      expect(productService.updateProduct).toHaveBeenCalledWith(productToEdit.id, expect.objectContaining({
        PROD_NAME: updatedName,
        PROD_PRICE: updatedPrice,
      }));
    });

    test('shows error if updating product fails', async () => {
      const productToEdit = productsToEdit[0];
      const updateError = 'Failed to update';
      productService.getProducts.mockImplementationOnce(async () => [productToEdit]);
      productService.updateProduct.mockRejectedValueOnce(new Error(updateError));

      render(<ProductList />);
      expect(screen.getByText(/loading products.../i)).toBeInTheDocument();
      await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i));
      expect(screen.getByText(productToEdit.PROD_NAME)).toBeInTheDocument(); // Initial product loaded

      // Find and click the edit button for the first product
      const productItem = screen.getByText(new RegExp(productToEdit.PROD_NAME));
      fireEvent.click(within(productItem.closest('li')).getByRole('button', { name: /edit/i }));

      // Wait for form and fill it
      const nameInput = await screen.findByLabelText(/product name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      fireEvent.change(screen.getByLabelText(/price/i), { target: { value: 1500 } });

      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

      // Check for error message related to update
      await waitFor(() => {
        expect(screen.getByText(new RegExp(updateError, 'i'))).toBeInTheDocument();
      });
    });
  });

  describe('Delete Product', () => {
    const productsToDelete = [
      { id: 'P001', PROD_ID: 'SKU001', PROD_NAME: 'Deletable Laptop', PROD_CATEGORY: 'Electronics', PROD_PRICE: 1200, PROD_STOCK_QTY: 10, VEND_CODE: 'V001' },
      { id: 'P002', PROD_ID: 'SKU002', PROD_NAME: 'Deletable Chair', PROD_CATEGORY: 'Furniture', PROD_PRICE: 150, PROD_STOCK_QTY: 5, VEND_CODE: 'V002' },
    ];

    beforeEach(() => {
      productService.getProducts.mockImplementationOnce(async () => productsToDelete);
      // Mock deleteProduct if it's defined in productService, create a jest.fn() if not yet defined for tests
      if (!productService.deleteProduct) {
        productService.deleteProduct = jest.fn();
      }
      productService.deleteProduct.mockClear();
      // Mock window.confirm
      global.confirm = jest.fn(() => true); // Default to 'true' (user confirms deletion)
    });

    afterEach(() => {
      // Clean up the mock to ensure it doesn't interfere with other tests
      if (global.confirm.mockRestore) {
         global.confirm.mockRestore();
      }
    });

    test('renders a Delete button for each product in the list', async () => {
      render(<ProductList />);
      expect(screen.getByText(/loading products.../i)).toBeInTheDocument();
      await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i));
      productsToDelete.forEach(product => {
        const productItem = screen.getByText(new RegExp(product.PROD_NAME));
        expect(within(productItem.closest('li')).getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });
    });

    test('clicking Delete button and confirming removes the product from the list', async () => {
      let currentProducts = [...productsToDelete]; 
      const productToRemove = productsToDelete[0];

      productService.getProducts.mockImplementationOnce(async () => currentProducts); 
      productService.deleteProduct.mockImplementationOnce(async (id) => {
        currentProducts = currentProducts.filter(p => p.id !== id);
        return {}; // Simulate successful deletion
      });

      render(<ProductList />);
      expect(screen.getByText(/loading products.../i)).toBeInTheDocument();
      await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i));
      expect(screen.getByText(productToRemove.PROD_NAME)).toBeInTheDocument(); // Initial product loaded

      const productItemElement = screen.getByText(new RegExp(productToRemove.PROD_NAME));
      fireEvent.click(within(productItemElement.closest('li')).getByRole('button', { name: /delete/i }));

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this product?');
      
      // Wait for the product to be removed from the UI
      await waitFor(() => {
        expect(screen.queryByText(new RegExp(productToRemove.PROD_NAME))).not.toBeInTheDocument();
      });

      expect(productService.deleteProduct).toHaveBeenCalledWith(productToRemove.id);
      // Verify the product is removed from the DOM
      await waitFor(() => {
        expect(screen.queryByText(productToRemove.PROD_NAME)).not.toBeInTheDocument();
      });
      // Verify other product is still there
      expect(screen.getByText(productsToDelete[1].PROD_NAME)).toBeInTheDocument();
    });

    test('shows error if deleting product fails', async () => {
      const deleteError = 'Failed to delete product';
      productService.getProducts.mockImplementationOnce(async () => [...productsToDelete]);
      productService.deleteProduct.mockRejectedValueOnce(new Error(deleteError));

      render(<ProductList />);
      expect(screen.getByText(/loading products.../i)).toBeInTheDocument();
      await waitForElementToBeRemoved(() => screen.queryByText(/loading products.../i));
      expect(screen.getByText(productsToDelete[0].PROD_NAME)).toBeInTheDocument(); // Initial product loaded

      const productToRemove = productsToDelete[0];
      const productItemElement = screen.getByText(new RegExp(productToRemove.PROD_NAME));
      fireEvent.click(within(productItemElement.closest('li')).getByRole('button', { name: /delete/i }));

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this product?');
      await waitFor(() => {
        expect(screen.getByText(new RegExp(deleteError, 'i'))).toBeInTheDocument();
      });
      // Ensure product is NOT removed on error
      expect(screen.getByText(productToRemove.PROD_NAME)).toBeInTheDocument();
    });
  });

  // We'll add more tests here as we build features:
  // - filtering and sorting
});
