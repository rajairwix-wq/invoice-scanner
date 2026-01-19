import React, { useState } from 'react';
import axios from 'axios';

const GSTInvoiceScanner = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleScan = async () => {
    if (!file) return alert("Select a file!");
    setLoading(true);

    const formData = new FormData();
    formData.append('invoiceImage', file);

    try {
      const response = await axios.post('http://localhost:8000/api/scan-invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error(error);
      alert("Error scanning invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">AI GST Invoice Scanner</h1>
        
        {/* Upload Box */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col items-center space-y-4">
            <input 
              type="file" 
              accept=".jpg, .jpeg, .png, .pdf" 
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button 
              onClick={handleScan} 
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing AI...' : 'Scan Invoice / PDF'}
            </button>
          </div>
        </div>

        {/* RESULT DISPLAY: PROFESSIONAL INVOICE FORMAT */}
        {data && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Seller (From)</h3>
                <p className="font-bold text-gray-900">{data.seller.name}</p>
                <p className="text-gray-600">{data.seller.address}</p>
                <p className="text-gray-700">GSTIN: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{data.seller.gstin}</span></p>
              </div>
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">INVOICE</h2>
                <p className="text-gray-600">#: {data.invoice_details.number}</p>
                <p className="text-gray-600">Date: {data.invoice_details.date}</p>
              </div>
              <div className="border-b pb-4 text-right">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Buyer (To)</h3>
                <p className="font-bold text-gray-900">{data.buyer.name || 'Cash/General'}</p>
                <p className="text-gray-600">Billing: {data.buyer.billing_address}</p>
                <p className="text-gray-600">Shipping: {data.buyer.shipping_address}</p>
                <p className="text-gray-700">GSTIN: {data.buyer.gstin}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left text-gray-700">ITEM / Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-gray-700">HSN/SAC</th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-gray-700">Qty</th>
                    <th className="border border-gray-300 px-4 py-2 text-right text-gray-700">Rate</th>
                    <th className="border border-gray-300 px-4 py-2 text-right text-gray-700">Tax Amt</th>
                    <th className="border border-gray-300 px-4 py-2 text-right text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.hsn}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.qty}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{item.rate}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{item.tax_amount}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end">
              <div className="w-full md:w-1/2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700">Taxable Value:</span>
                  <span className="font-semibold">{data.totals.taxable}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700">Total Tax:</span>
                  <span className="font-semibold">{data.totals.tax}</span>
                </div>
                <div className="flex justify-between py-3 bg-gray-100 px-4 rounded">
                  <span className="text-lg font-bold text-gray-800">Grand Total:</span>
                  <span className="text-lg font-bold text-gray-800">{data.totals.grand_total}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GSTInvoiceScanner;
