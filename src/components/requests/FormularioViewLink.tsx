import React from 'react';
import Link from 'next/link';

interface FormularioViewLinkProps {
  requestId: string;
}

const FormularioViewLink: React.FC<FormularioViewLinkProps> = ({ requestId }) => {
  return (
    <div className="mb-4">
      <Link href={`/formularios-medicos/${requestId}`} className="text-verde hover:text-verdeEscuro underline font-medium">
        Ver formulários médicos
      </Link>
    </div>
  );
};

export default FormularioViewLink;
