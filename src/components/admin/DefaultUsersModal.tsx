import { useState } from 'react';
import { Role } from '@prisma/client';

// Tipos para as senhas dos usuários padrão
interface UserPasswordInfo {
  name: string;
  role: Role;
  email: string;
  password: string;
}

interface DefaultUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPasswords: UserPasswordInfo[];
  organizationName: string;
}

const DefaultUsersModal: React.FC<DefaultUsersModalProps> = ({
  isOpen,
  onClose,
  userPasswords,
  organizationName
}) => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Função para copiar os dados para a área de transferência
  const handleCopyToClipboard = () => {
    const textToCopy = userPasswords.map(user => 
      `${user.name}\nEmail: ${user.email}\nSenha: admin\nPerfil: ${user.role}\n\n`
    ).join('');

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopySuccess('Informações copiadas para a área de transferência!');
        setTimeout(() => setCopySuccess(null), 3000);
      })
      .catch(err => {
        console.error('Falha ao copiar texto: ', err);
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Usuários Criados para {organizationName}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Os seguintes usuários foram criados automaticamente para esta organização.
              Todos os usuários receberam a senha padrão <strong>"admin"</strong>.
            </p>
            
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 rounded mb-4">
              <p className="text-sm font-medium">
                Importante: É recomendável que os usuários alterem suas senhas após o primeiro acesso.
              </p>
            </div>

            {copySuccess && (
              <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">
                {copySuccess}
              </div>
            )}
            
            <button
              onClick={handleCopyToClipboard}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mb-4"
            >
              Copiar Todas as Informações
            </button>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg mb-4 max-h-[50vh] overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPasswords.map((user, index) => (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-md p-3 bg-white shadow-sm"
                >
                  <h3 className="font-semibold text-gray-800">{user.name}</h3>
                  <p className="text-sm text-gray-600">Perfil: <span className="font-medium">{user.role}</span></p>
                  <p className="text-sm text-gray-600">Email: <span className="font-medium">{user.email}</span></p>
                  <p className="text-sm text-gray-600">
                    Senha: <span className="font-medium bg-yellow-100 px-1 py-0.5 rounded">admin</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultUsersModal;
