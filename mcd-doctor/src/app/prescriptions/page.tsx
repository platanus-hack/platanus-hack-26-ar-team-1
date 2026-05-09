'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Doctor = { id: string; name: string; email: string };
type Patient = { id: string; name: string };
type Prescription = {
  id: string;
  patient_id: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  notes: string | null;
  created_at: string;
  patients: { name: string; phone_number: string } | null;
};
type Form = {
  patient_id: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  notes: string;
};

export default function PrescriptionsPage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Prescription | null>(null);
  const [form, setForm] = useState<Form>({
    patient_id: '',
    drug_name: '',
    dosage: '',
    frequency: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('mcd_doctor');
    if (!stored) { router.push('/login'); return; }
    const doc: Doctor = JSON.parse(stored);
    setDoctor(doc);
    fetchData(doc.id);
  }, []);

  const fetchData = async (doctorId: string) => {
    setLoading(true);
    const [presRes, patRes] = await Promise.all([
      fetch(`/api/prescriptions?doctor_id=${doctorId}`),
      fetch(`/api/patients?doctor_id=${doctorId}`),
    ]);
    const [presData, patData] = await Promise.all([presRes.json(), patRes.json()]);
    setPrescriptions(presData.prescriptions ?? []);
    setPatients(patData.patients ?? []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ patient_id: '', drug_name: '', dosage: '', frequency: '', notes: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (rx: Prescription) => {
    setEditing(rx);
    setForm({
      patient_id: rx.patient_id,
      drug_name: rx.drug_name,
      dosage: rx.dosage,
      frequency: rx.frequency,
      notes: rx.notes ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (rx: Prescription) => {
    const name = rx.patients?.name ?? 'this patient';
    if (!confirm(`Delete prescription for ${name}?`)) return;
    const res = await fetch(`/api/prescriptions/${rx.id}`, { method: 'DELETE' });
    if (res.ok) setPrescriptions((prev) => prev.filter((x) => x.id !== rx.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url = editing ? `/api/prescriptions/${editing.id}` : '/api/prescriptions';
    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, notes: form.notes || null }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Something went wrong');
    } else {
      setShowModal(false);
      fetchData(doctor!.id);
    }
    setSaving(false);
  };

  const textInput = (
    key: keyof Omit<Form, 'patient_id' | 'notes'>,
    label: string,
    placeholder?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={form[key]}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
        <button
          onClick={openCreate}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Prescription
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-lg border">
          No prescriptions yet. Click <strong>+ Add Prescription</strong> to get started.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Patient', 'Drug', 'Dosage', 'Frequency', 'Notes', 'Created', ''].map((h) => (
                  <th
                    key={h}
                    className={`px-6 py-3 text-sm font-semibold text-gray-600 ${h === '' ? 'text-right' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prescriptions.map((rx) => (
                <tr key={rx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{rx.patients?.name ?? '—'}</div>
                    <div className="text-xs text-gray-400 font-mono">{rx.patients?.phone_number ?? ''}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{rx.drug_name}</td>
                  <td className="px-6 py-4 text-gray-600">{rx.dosage}</td>
                  <td className="px-6 py-4 text-gray-600">{rx.frequency}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm max-w-[180px] truncate">
                    {rx.notes ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(rx.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(rx)}
                      className="text-blue-700 hover:underline text-sm font-medium mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rx)}
                      className="text-red-600 hover:underline text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-5">
              {editing ? 'Edit Prescription' : 'Add Prescription'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, patient_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              {textInput('drug_name', 'Drug Name', 'e.g. Metformin')}
              <div className="grid grid-cols-2 gap-3">
                {textInput('dosage', 'Dosage', 'e.g. 500mg')}
                {textInput('frequency', 'Frequency', 'e.g. twice daily')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
