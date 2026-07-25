import React, { useEffect, useState } from 'react';
import { challanService, customerService, productService } from '../services/api';
import { Challan, Customer, Product, User } from '../types';
import { Search, Plus, FileText, CheckCircle2, XCircle, Printer, Eye, Trash2, X, AlertCircle } from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';

interface ChallansViewProps {
  user: User;
}

interface NewLineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export const ChallansView: React.FC<ChallansViewProps> = ({ user }) => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // New Challan Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [initialStatus, setInitialStatus] = useState<'Draft' | 'Confirmed'>('Draft');
  const [lineItems, setLineItems] = useState<NewLineItem[]>([
    { productId: '', quantity: 1, unitPrice: 0 }
  ]);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchChallans();
    fetchDependencies();
  }, [search, statusFilter]);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await challanService.getAll({
        search: search || undefined,
        status: statusFilter || undefined
      });
      setChallans(res.data);
    } catch (err) {
      console.error('Failed to fetch challans', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        customerService.getAll({ limit: 100 }),
        productService.getAll({ limit: 100 })
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    } catch (e) {
      console.error('Error loading dropdown dependencies', e);
    }
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    const updated = [...lineItems];
    updated[index].productId = productId;
    updated[index].unitPrice = prod ? prod.unitPrice : 0;
    setLineItems(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...lineItems];
    updated[index].quantity = Math.max(1, quantity);
    setLineItems(updated);
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedCustomerId) {
      setFormError('Please select a customer.');
      return;
    }

    const invalidItems = lineItems.filter(i => !i.productId || i.quantity <= 0);
    if (invalidItems.length > 0) {
      setFormError('Please select a product and valid quantity for all line items.');
      return;
    }

    setCreating(true);

    try {
      await challanService.create({
        customerId: selectedCustomerId,
        status: initialStatus,
        items: lineItems
      });

      setShowCreateModal(false);
      resetForm();
      fetchChallans();
      fetchDependencies(); // refresh stock levels
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error creating Sales Challan.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (challanId: string, status: 'Confirmed' | 'Cancelled') => {
    try {
      await challanService.updateStatus(challanId, status);
      fetchChallans();
      fetchDependencies();
      if (selectedChallan && selectedChallan.id === challanId) {
        const updated = await challanService.getById(challanId);
        setSelectedChallan(updated);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to update challan status to ${status}`);
    }
  };

  const openInvoiceModal = async (ch: Challan) => {
    try {
      const detailed = await challanService.getById(ch.id);
      setSelectedChallan(detailed);
      setShowInvoiceModal(true);
    } catch (e) {
      setSelectedChallan(ch);
      setShowInvoiceModal(true);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setInitialStatus('Draft');
    setLineItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
    setFormError('');
  };

  // Calculate Running Totals for New Form
  const calculatedTotalQuantity = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const calculatedTotalAmount = lineItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challan & Invoicing Portal</h1>
          <p className="page-subtitle">Generate wholesale delivery challans, enforce transactional stock control, and export invoices</p>
        </div>

        {(user.role === 'ADMIN' || user.role === 'SALES') && (
          <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="btn btn-primary">
            <Plus size={16} /> Create Sales Challan
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-group">
          <Search size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by Challan number (e.g. CH-2026...), customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="select-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Challans Table */}
      <div className="table-container glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Sales Challans...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Challan #</th>
                <th>Customer Name</th>
                <th>Items & Total Qty</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No Sales Challans found.</td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch.id}>
                    <td className="font-mono" style={{ fontWeight: 800, color: 'var(--accent-blue)' }}>
                      {ch.challanNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{ch.customer?.businessName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Contact: {ch.customer?.name}</div>
                    </td>
                    <td>
                      <div>{ch.items?.length || 0} Products</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Qty: {ch.totalQuantity}</div>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '0.9375rem' }}>
                      ${ch.totalAmount.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${ch.status === 'Confirmed' ? 'badge-confirmed' : ch.status === 'Draft' ? 'badge-draft' : 'badge-cancelled'}`}>
                        {ch.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                        <button onClick={() => openInvoiceModal(ch)} className="btn btn-secondary btn-sm" title="View & Print Challan / Invoice">
                          <Printer size={14} /> View / Export
                        </button>
                        {ch.status === 'Draft' && (user.role === 'ADMIN' || user.role === 'SALES' || user.role === 'WAREHOUSE') && (
                          <button onClick={() => handleUpdateStatus(ch.id, 'Confirmed')} className="btn btn-emerald btn-sm" title="Confirm Challan & Deduct Stock">
                            <CheckCircle2 size={14} /> Confirm
                          </button>
                        )}
                        {ch.status !== 'Cancelled' && (user.role === 'ADMIN' || user.role === 'SALES') && (
                          <button onClick={() => handleUpdateStatus(ch.id, 'Cancelled')} className="btn btn-secondary btn-sm" style={{ color: '#f87171' }} title="Cancel Challan">
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Multi-Item Challan Creation Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Create Sales Challan Document</h2>
              <button onClick={() => setShowCreateModal(false)} className="close-btn"><X size={20} /></button>
            </div>

            {formError && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateChallan}>
              <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Select Customer Account *</label>
                  <select
                    className="select-field"
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.businessName} ({c.name} - {c.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Document Status</label>
                  <select
                    className="select-field"
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value as any)}
                  >
                    <option value="Draft">Draft (Do not deduct stock yet)</option>
                    <option value="Confirmed">Confirmed (Deduct inventory stock immediately)</option>
                  </select>
                </div>
              </div>

              {/* Line Items Table */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Line Items (Products & Quantities)</h3>
                  <button type="button" onClick={handleAddLineItem} className="btn btn-secondary btn-sm">
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                <div style={{ background: 'rgba(31, 41, 55, 0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {lineItems.map((item, index) => {
                    const selectedProd = products.find(p => p.id === item.productId);
                    const isStockShortage = selectedProd && initialStatus === 'Confirmed' && item.quantity > selectedProd.currentStock;

                    return (
                      <div key={index} style={{
                        display: 'grid',
                        gridTemplateColumns: '3fr 1.5fr 1.5fr 1.5fr 40px',
                        gap: '0.75rem',
                        alignItems: 'center',
                        marginBottom: '0.75rem'
                      }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Product</label>
                          <select
                            className="select-field"
                            style={{ width: '100%' }}
                            value={item.productId}
                            onChange={(e) => handleProductChange(index, e.target.value)}
                          >
                            <option value="">-- Choose Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (SKU: {p.sku} | Stock: {p.currentStock})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Quantity</label>
                          <input
                            type="number"
                            min={1}
                            className="input-field input-field-normal"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                          />
                          {isStockShortage && (
                            <span style={{ fontSize: '0.65rem', color: '#f87171', display: 'block' }}>Shortage!</span>
                          )}
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Unit Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="input-field input-field-normal"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              updated[index].unitPrice = parseFloat(e.target.value);
                              setLineItems(updated);
                            }}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Subtotal</label>
                          <div className="font-mono" style={{ fontWeight: 700, paddingTop: '0.5rem' }}>
                            ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                          </div>
                        </div>

                        <div style={{ paddingTop: '1.25rem' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                            disabled={lineItems.length === 1}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', fontWeight: 800 }}>
                    <span>Total Quantity: {calculatedTotalQuantity}</span>
                    <span>Total Amount: ${calculatedTotalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Generating Challan...' : 'Generate Sales Challan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice & Challan Printable Export Modal */}
      {showInvoiceModal && selectedChallan && (
        <InvoiceModal
          challan={selectedChallan}
          onClose={() => setShowInvoiceModal(false)}
          onConfirmStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};
