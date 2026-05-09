'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [doctor, setDoctor] = useState<{ name: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('mcd_doctor');
    if (stored) setDoctor(JSON.parse(stored));
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('mcd_doctor');
    router.push('/login');
  };

  if (pathname === '/login') return null;

  return (
    <nav className="bg-blue-800 text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <span className="font-bold text-xl tracking-tight">MCD Doctor Portal</span>
        <Link
          href="/patients"
          className={`hover:text-blue-200 transition-colors text-sm font-medium ${
            pathname === '/patients' ? 'text-blue-200 border-b-2 border-blue-200 pb-0.5' : ''
          }`}
        >
          Patients
        </Link>
        <Link
          href="/prescriptions"
          className={`hover:text-blue-200 transition-colors text-sm font-medium ${
            pathname === '/prescriptions' ? 'text-blue-200 border-b-2 border-blue-200 pb-0.5' : ''
          }`}
        >
          Prescriptions
        </Link>
      </div>
      {doctor && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200">Dr. {doctor.name}</span>
          <button
            onClick={logout}
            className="text-sm bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
