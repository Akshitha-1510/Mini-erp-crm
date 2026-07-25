import React from 'react';
import { Challan } from '../types';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface InvoiceModalProps {
  challan: Challan;
  onClose: () => void;
  onConfirmStatus: (id: string, status: 'Confirmed') => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ challan, onClose, onConfirmStatus }) => {
  const handlePrint = () => {
    window.print();
  };

  const snapshotItems = challan.items && challan.items.length > 0 
    ? challan.items 
    : (challan.parsedSnapshot || []);

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg" style={{ background: '#ffffff', color: '#111827', padding: '2.5rem' }}>
        {/* Modal Controls (Hidden during print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handlePrint} className="btn btn-primary btn-sm">
              <Printer size={16} /> Print / Save PDF Invoice
            </button>
            {challan.status === 'Draft' && (
              <button onClick={() => onConfirmStatus(challan.id, 'Confirmed')} className="btn btn-emerald btn-sm">
                <CheckCircle2 size={16} /> Confirm Challan Now
              </button>
            )}
          </div>
          <button onClick={onClose} className="close-btn" style={{ color: '#374151' }}><X size={24} /></button>
        </div>

        {/* Printable Document Body */}
        <div className="printable-area">
          {/* Company Branding & Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111827', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.025em' }}>
                GLOBAL WHOLESALE DISTRIBUTORS
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' }}>
                Industrial Equipment & Electrical Supplies Division<br />
                Plot 105, Corporate Logistics Park, West Zone<br />
                GSTIN: 27AABCG9988Z1Z5 | Phone: +91 22 4999 8888
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: challan.status === 'Confirmed' ? '#dcfce7' : '#f3e8ff', color: challan.status === 'Confirmed' ? '#166534' : '#6b21a8', borderRadius: '4px', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                SALES CHALLAN - {challan.status}
              </div>
              <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                {challan.challanNumber}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Date: {new Date(challan.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Customer Delivery & Billing Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>CONSIGNEE / BILLED TO</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{challan.customer?.businessName}</h3>
              <div style={{ fontSize: '0.875rem', color: '#374151', marginTop: '0.25rem' }}>
                <div>Contact Person: <strong>{challan.customer?.name}</strong></div>
                <div>Phone: {challan.customer?.mobile}</div>
                <div>Email: {challan.customer?.email || 'N/A'}</div>
                <div>GSTIN: {challan.customer?.gstNumber || 'Unregistered Retail'}</div>
              </div>
            </div>

            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>DELIVERY DETAILS</div>
              <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                <div><strong>Dispatch Address:</strong> {challan.customer?.address || 'Main Delivery Address'}</div>
                <div><strong>Customer Type:</strong> {challan.customer?.type}</div>
                <div><strong>Issued By:</strong> {challan.createdBy}</div>
                <div><strong>Status:</strong> {challan.status === 'Confirmed' ? 'Inventory Stock Dispatched' : 'Pending Confirmation'}</div>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8125rem' }}>#</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8125rem' }}>Product Description</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8125rem' }}>SKU</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8125rem' }}>Qty</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8125rem' }}>Unit Price ($)</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8125rem' }}>Subtotal ($)</th>
              </tr>
            </thead>
            <tbody>
              {snapshotItems.map((item: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>{idx + 1}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{item.productName || item.name}</td>
                  <td className="font-mono" style={{ padding: '0.75rem 1rem', color: '#475569', fontSize: '0.8125rem' }}>{item.sku}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>{item.quantity}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>${(item.unitPrice || 0).toFixed(2)}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>
                    ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a', fontWeight: 800, fontSize: '0.9375rem' }}>
                <td colSpan={3} style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Grand Totals:</td>
                <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>{challan.totalQuantity} Units</td>
                <td></td>
                <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#1e3a8a', fontSize: '1.1rem' }}>
                  ${challan.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Terms & Authorised Signature */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              <strong style={{ color: '#334155' }}>Terms & Conditions:</strong>
              <ol style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                <li>Goods once dispatched against confirmed sales challan cannot be returned without prior authorisation.</li>
                <li>Please inspect quantities and seal prior to signing receiver receipt.</li>
              </ol>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <div style={{ height: '45px', borderBottom: '1px solid #94a3b8', marginBottom: '0.5rem' }}></div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>Authorised Signatory</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Global Wholesale Distributors</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
