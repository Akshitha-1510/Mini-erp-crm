import React, { useEffect, useState } from 'react';
import { productService } from '../services/api';
import { Product, StockMovement, User } from '../types';
import { Search, Plus, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit, History, X, SlidersHorizontal } from 'lucide-react';

interface ProductsViewProps {
  user: User;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'logs'>('catalog');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Machinery',
    unitPrice: 100.0,
    currentStock: 10,
    minStockAlert: 5,
    location: 'Main Warehouse'
  });

  // Stock Adjustment Form
  const [adjustForm, setAdjustForm] = useState({
    type: 'IN' as 'IN' | 'OUT',
    quantity: 1,
    reason: ''
  });

  useEffect(() => {
    fetchProducts();
    if (activeTab === 'logs') {
      fetchMovementsLog();
    }
  }, [search, categoryFilter, lowStockOnly, activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getAll({
        search: search || undefined,
        category: categoryFilter || undefined,
        lowStockOnly: lowStockOnly || undefined
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovementsLog = async () => {
    try {
      const res = await productService.getMovementsLog({ search: search || undefined });
      setMovements(res.data);
    } catch (err) {
      console.error('Failed to fetch movement logs', err);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku) {
      alert('Product Name and SKU are required');
      return;
    }

    try {
      await productService.create(productForm);
      setShowAddModal(false);
      resetProductForm();
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating product');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await productService.update(selectedProduct.id, productForm);
      setShowEditModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating product');
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustForm.reason.trim()) {
      alert('Please enter a valid reason for stock movement');
      return;
    }

    try {
      await productService.adjustStock(selectedProduct.id, adjustForm);
      setShowAdjustModal(false);
      setAdjustForm({ type: 'IN', quantity: 1, reason: '' });
      fetchProducts();
      if (activeTab === 'logs') fetchMovementsLog();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Stock adjustment failed');
    }
  };

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location || 'Main Warehouse'
    });
    setShowEditModal(true);
  };

  const openAdjustModal = (p: Product) => {
    setSelectedProduct(p);
    setAdjustForm({ type: 'IN', quantity: 1, reason: '' });
    setShowAdjustModal(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      sku: '',
      category: 'Machinery',
      unitPrice: 100.0,
      currentStock: 10,
      minStockAlert: 5,
      location: 'Main Warehouse'
    });
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Product & Stock Inventory Portal</h1>
          <p className="page-subtitle">Manage product catalog, real-time stock levels, low-stock alerts, and movement audit logs</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(user.role === 'ADMIN' || user.role === 'WAREHOUSE') && (
            <button onClick={() => { resetProductForm(); setShowAddModal(true); }} className="btn btn-primary">
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Tabs for Catalog vs Movement Audit Log */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`btn ${activeTab === 'catalog' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <Package size={16} /> Product Catalog ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <History size={16} /> Stock Movement Audit Logs
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="filter-bar">
        <div className="search-input-group">
          <Search size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by product name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {activeTab === 'catalog' && (
          <>
            <select className="select-field" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Machinery">Machinery</option>
              <option value="Electrical">Electrical</option>
              <option value="Hardware">Hardware</option>
              <option value="Automation">Automation</option>
              <option value="Instruments">Instruments</option>
              <option value="Consumables">Consumables</option>
            </select>

            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`btn ${lowStockOnly ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            >
              <AlertTriangle size={14} /> {lowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock'}
            </button>
          </>
        )}
      </div>

      {/* Product Catalog Table */}
      {activeTab === 'catalog' && (
        <div className="table-container glass-card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Inventory Products...</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Current Stock</th>
                  <th>Min Alert Qty</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No products found matching criteria.</td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLowStock = p.currentStock <= p.minStockAlert;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                          <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {p.sku}</div>
                        </td>
                        <td><span className="badge badge-draft">{p.category}</span></td>
                        <td style={{ fontWeight: 700 }}>${p.unitPrice.toFixed(2)}</td>
                        <td>
                          <span style={{
                            fontSize: '0.9375rem',
                            fontWeight: 800,
                            color: isLowStock ? '#f87171' : '#34d399',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            {p.currentStock} {isLowStock && <AlertTriangle size={14} color="#f87171" />}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.minStockAlert}</td>
                        <td style={{ fontSize: '0.8125rem' }}>{p.location || 'Warehouse'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                            {(user.role === 'ADMIN' || user.role === 'WAREHOUSE') && (
                              <>
                                <button onClick={() => openAdjustModal(p)} className="btn btn-secondary btn-sm" title="Stock Movement Adjust (IN/OUT)">
                                  <SlidersHorizontal size={14} /> Adjust Stock
                                </button>
                                <button onClick={() => openEditModal(p)} className="btn btn-secondary btn-sm" title="Edit Product">
                                  <Edit size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Stock Movement Audit Log Table */}
      {activeTab === 'logs' && (
        <div className="table-container glass-card" style={{ padding: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product</th>
                <th>Movement Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No stock movement logs found.</td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {new Date(m.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{m.product?.name || 'Product'}</div>
                      <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {m.product?.sku}</div>
                    </td>
                    <td>
                      <span className={`badge ${m.type === 'IN' ? 'badge-confirmed' : 'badge-cancelled'}`}>
                        {m.type === 'IN' ? 'STOCK IN' : 'STOCK OUT'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: m.type === 'IN' ? '#34d399' : '#f87171' }}>
                      {m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{m.reason}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{m.createdBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Product to Inventory</h2>
              <button onClick={() => setShowAddModal(false)} className="close-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateProduct}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input type="text" className="input-field input-field-normal" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Code *</label>
                  <input type="text" className="input-field input-field-normal font-mono" required placeholder="e.g. HYD-PUMP-01" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input type="text" className="input-field input-field-normal" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price ($) *</label>
                  <input type="number" step="0.01" className="input-field input-field-normal" required value={productForm.unitPrice} onChange={(e) => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Stock Quantity *</label>
                  <input type="number" className="input-field input-field-normal" required value={productForm.currentStock} onChange={(e) => setProductForm({ ...productForm, currentStock: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Stock Alert Threshold</label>
                  <input type="number" className="input-field input-field-normal" value={productForm.minStockAlert} onChange={(e) => setProductForm({ ...productForm, minStockAlert: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Warehouse Location</label>
                <input type="text" className="input-field input-field-normal" value={productForm.location} onChange={(e) => setProductForm({ ...productForm, location: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Product Details</h2>
              <button onClick={() => setShowEditModal(false)} className="close-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateProduct}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input type="text" className="input-field input-field-normal" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input type="text" className="input-field input-field-normal font-mono" required value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input type="text" className="input-field input-field-normal" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price ($)</label>
                  <input type="number" step="0.01" className="input-field input-field-normal" required value={productForm.unitPrice} onChange={(e) => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Stock Alert Threshold</label>
                  <input type="number" className="input-field input-field-normal" value={productForm.minStockAlert} onChange={(e) => setProductForm({ ...productForm, minStockAlert: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Warehouse Location</label>
                  <input type="text" className="input-field input-field-normal" value={productForm.location} onChange={(e) => setProductForm({ ...productForm, location: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Update Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Manual Stock Movement</h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Product: <strong>{selectedProduct.name}</strong> (Available Stock: {selectedProduct.currentStock})
                </div>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="close-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleStockAdjustment}>
              <div className="form-group">
                <label className="form-label">Movement Type</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="movType" value="IN" checked={adjustForm.type === 'IN'} onChange={() => setAdjustForm({ ...adjustForm, type: 'IN' })} />
                    <span className="badge badge-confirmed">STOCK IN (+)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="movType" value="OUT" checked={adjustForm.type === 'OUT'} onChange={() => setAdjustForm({ ...adjustForm, type: 'OUT' })} />
                    <span className="badge badge-cancelled">STOCK OUT (-)</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input type="number" min={1} className="input-field input-field-normal" required value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) })} />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Justification *</label>
                <input type="text" className="input-field input-field-normal" required placeholder="e.g. Received Purchase Order PO-9912 or Damaged goods return" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAdjustModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-emerald">Confirm Stock Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
