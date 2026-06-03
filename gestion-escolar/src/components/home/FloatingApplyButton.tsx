// src/components/home/FloatingApplyButton.tsx
import { Link } from 'react-router-dom';

export const FloatingApplyButton = () => {
  return (
    <Link to="/solicitud-admision" className="fab-top-right">
      <span>Aplicar Ahora</span>
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </Link>
  );
};