 import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { getAllSalaries, addSalary, updateSalary, deleteSalary } from '../api/api';

const emptyForm = { staffName: '', role: '', amount: '', date: '' };

export default function Salary() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(emptyForm);
  const [editId,  setEditId]  = useState(null);
  const [toast,   setToast]   = useState(null);

  const load = async () => {
    try { const r = await getAllSalaries(); setItems(r.data); }
    catch (e) { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };

  const openEdit = (item) => {
    setForm({
      staffName: item.staffName,
      role: item.role,
      amount: item.amount,
      date: item.date ? item.date.slice(0, 10) : '',
    });
    setEditId(item._id);
    setModal(true);
  };

  const handleSubmit = async () => {
    if (!form.staffName || !form.role || !form.amount) {
      showToast('Staff name, role and amount are required', 'error'); return;
    }
    try {
      if (editId) { await updateSalary(editId, form); showToast('Salary updated!'); }
      else        { await addSalary(form);             showToast('Salary added!'); }
      setModal(false);
      load();
    } catch (e) {
      showToast(e.response?.data?.error || 'Error', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try { await deleteSalary(id); showToast('Deleted!'); load(); }
    catch (e) { showToast('Delete failed', 'error'); }
  };

  const totalSalaries = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="page">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="header">
        <div className="page-title-row">
          <h1 className="page-title">Payroll</h1>
          <span className="badge">{items.length} staff</span>
        </div>
      </div>

      {items.length > 0 && (
        <div style={{ padding: '12px 20px 0' }}>
          <div className="list-item" style={{ background: '#fefce8', borderColor: '#fde68a' }}>
            <div className="list-item-left">
              <span className="list-item-title" style={{ color: '#92400e' }}>Total Payroll</span>
              <span className="list-item-sub">{items.length} staff members</span>
            </div>
            <div className="list-item-right">
              <span className="list-item-amount" style={{ color: '#b45309' }}>
                Rs. {totalSalaries.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <p>No salary records yet.<br />Tap + to add one.</p>
        </div>
      ) : (
        <div className="list-container" style={{ paddingTop: 12 }}>
          {items.map(item => (
            <div className="list-item" key={item._id}>
              <div className="list-item-left">
                <span className="list-item-title">{item.staffName}</span>
                <span className="list-item-sub">
                  {item.role} · {new Date(item.date).toLocaleDateString()}
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
        <Modal title={editId ? 'Edit Salary' : 'Add Salary'} onClose={() => setModal(false)}>
          <div className="form-group">
            <label className="form-label">Staff Name *</label>
            <input className="form-input" type="text" placeholder="e.g. Kamal Perera"
              value={form.staffName}
              onChange={e => setForm({ ...form, staffName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Role *</label>
            <input className="form-input" type="text" placeholder="e.g. Driver, Conductor"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (Rs.) *</label>
            <input className="form-input" type="number" placeholder="e.g. 35000"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <button className="btn-primary" onClick={handleSubmit}>
            {editId ? 'Update Salary' : 'Add Salary'}
          </button>
          <button className="btn-cancel" onClick={() => setModal(false)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
