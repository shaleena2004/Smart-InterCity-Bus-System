 import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { getAllRevenue, addRevenue, updateRevenue, deleteRevenue } from '../api/api';

const emptyForm = { ticketSales: '', source: '', description: '', date: '' };

export default function Revenue() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(emptyForm);
  const [editId,  setEditId]  = useState(null);
  const [toast,   setToast]   = useState(null);

  const load = async () => {
    try { const r = await getAllRevenue(); setItems(r.data); }
    catch (e) { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };

  const openEdit = (item) => {
    setForm({
      ticketSales: item.ticketSales,
      source: item.source,
      description: item.description || '',
      date: item.date ? item.date.slice(0, 10) : '',
    });
    setEditId(item._id);
    setModal(true);
  };

  const handleSubmit = async () => {
    if (!form.ticketSales || !form.source) {
      showToast('Ticket sales and source are required', 'error'); return;
    }
    try {
      if (editId) { await updateRevenue(editId, form); showToast('Revenue updated!'); }
      else        { await addRevenue(form);             showToast('Revenue added!'); }
      setModal(false);
      load();
    } catch (e) {
      showToast(e.response?.data?.error || 'Error', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try { await deleteRevenue(id); showToast('Deleted!'); load(); }
    catch (e) { showToast('Delete failed', 'error'); }
  };

  return (
    <div className="page">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="header">
        <div className="page-title-row">
          <h1 className="page-title">Revenue</h1>
          <span className="badge">{items.length} records</span>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <p>No revenue records yet.<br />Tap + to add one.</p>
        </div>
      ) : (
        <div className="list-container" style={{ paddingTop: 16 }}>
          {items.map(item => (
            <div className="list-item" key={item._id}>
              <div className="list-item-left">
                <span className="list-item-title">{item.source}</span>
                <span className="list-item-sub">
                  {item.description || '—'} · {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
              <div className="list-item-right">
                <span className="list-item-amount">Rs. {item.ticketSales.toLocaleString()}</span>
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
        <Modal title={editId ? 'Edit Revenue' : 'Add Revenue'} onClose={() => setModal(false)}>
          <div className="form-group">
            <label className="form-label">Ticket Sales (Rs.) *</label>
            <input className="form-input" type="number" placeholder="e.g. 50000"
              value={form.ticketSales}
              onChange={e => setForm({ ...form, ticketSales: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Source *</label>
            <input className="form-input" type="text" placeholder="e.g. Colombo Route"
              value={form.source}
              onChange={e => setForm({ ...form, source: e.target.value })} />
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
            {editId ? 'Update Revenue' : 'Add Revenue'}
          </button>
          <button className="btn-cancel" onClick={() => setModal(false)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
