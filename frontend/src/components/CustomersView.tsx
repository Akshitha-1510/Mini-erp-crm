import React, { useEffect, useState } from 'react';
import { customerService } from '../services/api';
import { Customer, User } from '../types';
import { Search, Plus, UserPlus, Phone, Mail, Building, FileText, Calendar, Edit, Eye, X, MessageSquarePlus, Clock } from 'lucide-react';

interface CustomersViewProps {
  user: User;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ user }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    type: 'Wholesale' as Customer['type'],
    status: 'Lead' as Customer['status'],
    address: '',
    followUpDate: '',
    notes: ''
  });

  // Note form state inside detail modal
  const [newNoteText, setNewNoteText] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [newStatus, setNewStatus] = useState<Customer['status'] | ''>('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, typeFilter]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerService.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined
      });
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.businessName) {
      alert('Name, Mobile, and Business Name are required');
      return;
    }

    try {
      await customerService.create(formData);
      setShowAddModal(false);
      resetForm();
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating customer');
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      await customerService.update(selectedCustomer.id, formData);
      setShowEditModal(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating customer');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNoteText.trim()) return;

    setSubmittingNote(true);
    try {
      await customerService.addNote(selectedCustomer.id, {
        note: newNoteText,
        newFollowUpDate: newFollowUpDate || undefined,
        newStatus: newStatus || undefined
      });
      setNewNoteText('');
      setNewFollowUpDate('');
      setNewStatus('');
      
      // Refresh selected customer details
      const refreshed = await customerService.getById(selectedCustomer.id);
      setSelectedCustomer(refreshed);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const openDetailModal = async (cust: Customer) => {
    try {
      const fullCust = await customerService.getById(cust.id);
      setSelectedCustomer(fullCust);
      setShowDetailModal(true);
    } catch (e) {
      setSelectedCustomer(cust);
      setShowDetailModal(true);
    }
  };

  const openEditModal = (cust: Customer) => {
    setSelectedCustomer(cust);
    setFormData({
      name: cust.name,
      mobile: cust.mobile,
      email: cust.email || '',
      businessName: cust.businessName,
      gstNumber: cust.gstNumber || '',
      type: cust.type,
      status: cust.status,
      address: cust.address || '',
      followUpDate: cust.followUpDate || '',
      notes: cust.notes || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      type: 'Wholesale',
      status: 'Lead',
      address: '',
      followUpDate: '',
      notes: ''
    });
  };

  const getStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'Lead': return 'badge-lead';
      case 'Active': return 'badge-active';
      case 'Inactive': return 'badge-inactive';
      default: return 'badge-lead';
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer CRM Portal</h1>
          <p className="page-subtitle">Manage wholesale leads, active accounts, follow-ups, and customer profiles</p>
        </div>

        {(user.role === 'ADMIN' || user.role === 'SALES') && (
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn btn-primary">
            <UserPlus size={16} /> Add New Customer
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
            placeholder="Search by customer name, business, mobile, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="select-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Lead">Lead</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select className="select-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Customer Types</option>
          <option value="Retail">Retail</option>
          <option value="Wholesale">Wholesale</option>
          <option value="Distributor">Distributor</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="table-container glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Customer records...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer & Business</th>
                <th>Contact Info</th>
                <th>Type</th>
                <th>Status</th>
                <th>Follow-up Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No customers found matching search criteria.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.businessName}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Contact: {c.name}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
                        <Phone size={14} color="var(--text-muted)" /> {c.mobile}
                      </div>
                      {c.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Mail size={12} color="var(--text-muted)" /> {c.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-draft">{c.type}</span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(c.status)}`}>{c.status}</span>
                    </td>
                    <td>
                      {c.followUpDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#fbbf24' }}>
                          <Calendar size={14} /> {c.followUpDate}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None set</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                        <button onClick={() => openDetailModal(c)} className="btn btn-secondary btn-sm" title="View Customer Details & Notes">
                          <Eye size={14} />
                        </button>
                        {(user.role === 'ADMIN' || user.role === 'SALES') && (
                          <button onClick={() => openEditModal(c)} className="btn btn-secondary btn-sm" title="Edit Customer">
                            <Edit size={14} />
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Customer Account</h2>
              <button onClick={() => setShowAddModal(false)} className="close-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Contact Person Name *</label>
                  <input type="text" className="input-field input-field-normal" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Business / Company Name *</label>
                  <input type="text" className="input-field input-field-normal" required value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input type="text" className="input-field input-field-normal" required value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="input-field input-field-normal" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number (Optional)</label>
                  <input type="text" className="input-field input-field-normal" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Type</label>
                  <select className="select-field" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pipeline Status</label>
                  <select className="select-field" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input type="date" className="input-field input-field-normal" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" className="input-field input-field-normal" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Notes</label>
                <textarea className="input-field input-field-normal" rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Customer Account</h2>
              <button onClick={() => setShowEditModal(false)} className="close-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateCustomer}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Contact Person Name</label>
                  <input type="text" className="input-field input-field-normal" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input type="text" className="input-field input-field-normal" required value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input type="text" className="input-field input-field-normal" required value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="input-field input-field-normal" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input type="text" className="input-field input-field-normal" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Type</label>
                  <select className="select-field" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pipeline Status</label>
                  <select className="select-field" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input type="date" className="input-field input-field-normal" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Update Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail & Notes Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedCustomer.businessName}</h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Contact: {selectedCustomer.name} • GST: {selectedCustomer.gstNumber || 'N/A'}
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="close-btn"><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(31, 41, 55, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>ACCOUNT OVERVIEW</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  <div><strong>Mobile:</strong> {selectedCustomer.mobile}</div>
                  <div><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
                  <div><strong>Type:</strong> <span className="badge badge-draft">{selectedCustomer.type}</span></div>
                  <div><strong>Status:</strong> <span className={`badge ${getStatusBadge(selectedCustomer.status)}`}>{selectedCustomer.status}</span></div>
                  <div><strong>Next Follow-up:</strong> {selectedCustomer.followUpDate || 'None Scheduled'}</div>
                  <div><strong>Address:</strong> {selectedCustomer.address || 'N/A'}</div>
                </div>
              </div>

              {/* Add Follow-up Note Form */}
              <div style={{ background: 'rgba(31, 41, 55, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>LOG NEW CRM FOLLOW-UP NOTE</div>
                <form onSubmit={handleAddNote}>
                  <textarea
                    className="input-field input-field-normal"
                    rows={2}
                    placeholder="Enter call notes, requirements, or interaction details..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    required
                  ></textarea>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="date"
                      className="input-field input-field-normal"
                      title="Update Next Follow-Up Date"
                      value={newFollowUpDate}
                      onChange={(e) => setNewFollowUpDate(e.target.value)}
                    />

                    <select
                      className="select-field"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                    >
                      <option value="">Keep Status</option>
                      <option value="Lead">Set Lead</option>
                      <option value="Active">Set Active</option>
                      <option value="Inactive">Set Inactive</option>
                    </select>

                    <button type="submit" className="btn btn-primary btn-sm" disabled={submittingNote}>
                      <MessageSquarePlus size={14} /> Add
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Follow-up Notes Timeline */}
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.5rem' }}>Follow-up Timeline Log</h3>
              <div className="timeline">
                {(!selectedCustomer.noteLogs || selectedCustomer.noteLogs.length === 0) ? (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No follow-up notes logged yet.</div>
                ) : (
                  selectedCustomer.noteLogs.map((nl) => (
                    <div key={nl.id} className="timeline-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <span>Logged by <strong>{nl.createdBy}</strong></span>
                        <span>{new Date(nl.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem' }}>{nl.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
