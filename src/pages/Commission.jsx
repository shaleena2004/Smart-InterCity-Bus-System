 import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { getAllCommissions, addCommission, updateCommission, deleteCommission } from '../api/api';

const emptyForm = { busCompany: '', amount: '', description: '', date: '' };

export default function Commission() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(emptyForm);
  const [editId,  setEditId]  = useState(null);
  const [toast,   setToast]   = useState(null);

  const load = async () => {
    try { const r = await getAllCommissions(); setItems(r.data); }
    catch (e) { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };

  const openEdit = (item) => {
    setForm({
      busCompany: item.busCompany,
      amount: item.amount,
      description: item.description || '',
      date: item.date ? item.date.slice(0, 10) : '',
    });
    setEditId(item._id);
    setModal(true);
  };

  const handleSubmit = async () => {
    if (!form.busCompany || !form.amount) {
      showToast('Bus company and amount are required', 'error'); return;
    }
    try {
      if (editId) { await updateCommission(editId, form); showToast('Commission updated!'); }
      else        { await addCommission(form);             showToast('Commission added!'); }
      setModal(false);
      load();
    } catch (e) {
      showToast(e.response?.data?.error || 'Error', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try { await deleteCommission(id); showToast('Deleted!'); load(); }
    catch (e) { showToast('Delete failed', 'error'); }
  };

  const totalCommissions = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="page">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="header">
        <div className="page-title-row">
          <h1 className="page-title">Commissions</h1>
          <span className="badge">{items.length} companies</span>
        </div>
      </div>

      {items.length > 0 && (
        <div style={{ padding: '12px 20px 0' }}>
          <div className="list-item" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
            <div className="list-item-left">
              <span className="list-item-title" style={{ color: '#991b1b' }}>Total Commissions</span>
              <span className="list-item-sub">{items.length} bus companies</span>
            </div>
            <div className="list-item-right">
              <span className="list-item-amount" style={{ color: '#dc2626' }}>
                Rs. {totalCommissions.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚌</div>
          <p>No commission records yet.<br />Tap + to add one.</p>
        </div>
      ) : (
        <div className="list-container" style={{ paddingTop: 12 }}>
          {items.map(item => (
            <div className="list-item" key={item._id}>
              <div className="list-item-left">
                <span className="list-item-title">{item.busCompany}</span>
                <span className="list-item-sub">
                  {item.description || '—'} · {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
              <div className="list-item-right">
                <span className="list-item-amount">Rs. {item.amount.toLocaleString()}</span>
                <div className="list-item-actions">
                  <button className="btn-edit"   onClick={() => openEdit(item)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(item._id)}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={openAdd}>+</button>

      {modal && (
        <Modal title={editId ? 'Edit Commission' : 'Add Commission'} onClose={() => setModal(false)}>
          <div className="form-group">
            <label className="form-label">Bus Company *</label>
            <input className="form-input" type="text" placeholder="e.g. Lanka Ashok Leyland"
              value={form.busCompany}
              onChange={e => setForm({ ...form, busCompany: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (Rs.) *</label>
            <input className="form-input" type="number" placeholder="e.g. 15000"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" type="text" placeholder="Optional notes"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <button className="btn-primary" onClick={handleSubmit}>
            {editId ? 'Update Commission' : 'Add Commission'}
          </button>
          <button className="btn-cancel" onClick={() => setModal(false)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
