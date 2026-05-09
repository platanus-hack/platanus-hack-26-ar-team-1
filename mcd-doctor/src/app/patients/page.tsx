'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Doctor = { id: string; name: string; email: string };
type Patient = {
  id: string;
  name: string;
  phone_number: string;
  drug_name: string;
  status: string;
  created_at: string;
};
type Form = { name: string; phone_number: string; drug_name: string };

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  non_responsive: 'bg-red-100 text-red-800',
};

export default function PatientsPage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState<Form>({ name: '', phone_number: '', drug_name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('mcd_doctor');
    if (!stored) { router.push('/login'); return; }
    const doc: Doctor = JSON.parse(stored);
    setDoctor(doc);
    fetchPatients(doc.id);
  }, []);

  const fetchPatients = async (doctorId: string) => {
    setLoading(true);
    const res = await fetch(`/api/patients?doctor_id=${doctorId}`);
    const data = await res.json();
    setPatients(data.patients ?? []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', phone_number: '', drug_name: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    setForm({ name: p.name, phone_number: p.phone_number, drug_name: p.drug_name });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (p: Patient) => {
    if (!confirm(`Delete patient "${p.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/patients/${p.id}`, { method: 'DELETE' });
    if (res.ok) setPatients((prev) => prev.filter((x) => x.id !== p.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url = editing ? `/api/patients/${editing.id}` : '/api/patients';
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? form : { ...form, doctor_id: doctor!.id };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Something went wrong');
    } else {
      setShowModal(false);
      fetchPatients(doctor!.id);
    }
    setSaving(false);
  };

  const field = (key: keyof Form, label: string, placeholder?: string) => (
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
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <button
          onClick={openCreate}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Patient
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : patients.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-lg border">
          No patients yet. Click <strong>+ Add Patient</strong> to get started.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Phone', 'Drug', 'Status', 'Created', ''].map((h) => (
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
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">{p.phone_number}</td>
                  <td className="px-6 py-4 text-gray-700">{p.drug_name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        STATUS_STYLE[p.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-blue-700 hover:underline text-sm font-medium mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
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
              {editing ? 'Edit Patient' : 'Add Patient'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {field('name', 'Full Name', 'Jane Smith')}
              {field('phone_number', 'Phone Number', '5491112345678 (no + or spaces)')}
              {field('drug_name', 'Drug Name', 'e.g. Metformin')}
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
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
