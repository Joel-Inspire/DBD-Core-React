import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import VendorList from './VendorList';
import * as vendorService from '../../services/vendorService'; // To mock its functions

// Mock the vendorService module
jest.mock('../../services/vendorService');

describe('VendorList Component', () => {
  const mockVendors = [
    { id: 'V001', VEND_CODE: 'ACME001', VEND_NAME: 'Acme Corp', VEND_CONTACT_PERSON: 'Wile E. Coyote', VEND_EMAIL: 'wile@acme.com' },
    { id: 'V002', VEND_CODE: 'WAYNECO', VEND_NAME: 'Wayne Enterprises', VEND_CONTACT_PERSON: 'Lucius Fox', VEND_EMAIL: 'lucius@wayne.com' },
    { id: 'V003', VEND_CODE: 'STARKIND', VEND_NAME: 'Stark Industries', VEND_CONTACT_PERSON: 'Pepper Potts', VEND_EMAIL: 'pepper@stark.com' },
  ];

  beforeEach(() => {
    // Reset mocks before each test
    vendorService.getVendors.mockReset();
  });

  test('renders a heading', () => {
    vendorService.getVendors.mockResolvedValueOnce([]); // Mock a successful empty fetch
    render(<VendorList />);
    expect(screen.getByRole('heading', { name: /vendor management/i })).toBeInTheDocument();
  });

  test('displays a loading message initially', () => {
    vendorService.getVendors.mockImplementationOnce(() => new Promise(() => {})); // Simulate pending promise
    render(<VendorList />);
    expect(screen.getByText(/loading vendors.../i)).toBeInTheDocument();
  });

  test('displays a list of vendors when data is successfully fetched', async () => {
    vendorService.getVendors.mockResolvedValueOnce(mockVendors);
    render(<VendorList />);

    await waitFor(() => {
      expect(screen.queryByText(/loading vendors.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Acme Corp - ACME001/i)).toBeInTheDocument();
    expect(screen.getByText(/Wayne Enterprises - WAYNECO/i)).toBeInTheDocument();
    expect(screen.getByText(/Stark Industries - STARKIND/i)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBe(mockVendors.length);
  });

  test('displays an empty state message when no vendors are available', async () => {
    vendorService.getVendors.mockResolvedValueOnce([]);
    render(<VendorList />);

    await waitFor(() => {
      expect(screen.queryByText(/loading vendors.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/no vendors found./i)).toBeInTheDocument();
  });

  test('displays an error message when fetching vendors fails', async () => {
    const errorMessage = 'Network Error: Failed to fetch vendors';
    vendorService.getVendors.mockRejectedValueOnce(new Error(errorMessage));
    render(<VendorList />);

    await waitFor(() => {
      expect(screen.queryByText(/loading vendors.../i)).not.toBeInTheDocument();
    });

    // Check for the error message. The exact text might vary based on implementation.
    expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
  });

  test('renders an "Add New Vendor" button', async () => {
    vendorService.getVendors.mockResolvedValueOnce([]); // Mock a successful empty fetch for this test
    render(<VendorList />);
    
    await waitFor(() => { // Ensure loading is complete before checking for the button
        expect(screen.queryByText(/loading vendors.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /add new vendor/i })).toBeInTheDocument();
  });
});
