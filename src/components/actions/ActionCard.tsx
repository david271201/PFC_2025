import { TActionLogWithUserInfo } from '@/common-types';
import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

export default function ActionCard({
  action,
}: {
  action: TActionLogWithUserInfo;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownloadFile = (filePath: string) => {
    const link = document.createElement('a');
    link.href = `/api/download?filePath=${filePath}`;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const userName =
    action.userName?.replace(/_/g, ' ') || 'Usuário Desconhecido';

  const userRole = action.userRole || 'N/A';

  const formattedDate = action.createdAt
    ? new Date(action.createdAt).toLocaleString('pt-BR') // Format to Brazilian locale
    : 'Data Desconhecida';

  return (
    <div className="flex w-full flex-col justify-center gap-2 rounded-lg border-2 border-cinzaClaro">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded px-8 py-2 text-sm text-grafite hover:bg-gray-100 ${isOpen ? 'border-b-2 border-cinzaClaro' : ''}`}
      >
        <div className="grid w-full grid-cols-[2fr_3fr_2fr]">
          <div className="text-left">
            <span className="font-semibold">{userRole}</span>
            <span className="text-sm text-gray-500 block">{action.userOrganization || 'N/A'}</span>
          </div>
          <span className={`text-left ${
            action.action.toLowerCase().includes('favorável') ? 'text-green-600' : 
            action.action.toLowerCase().includes('desfavorável') ? 'text-red-600' : 
            'text-blue-600'
          } font-medium`}>{action.action}</span>
          <span className="text-left text-gray-500">{formattedDate}</span>
        </div>
        {isOpen ? (
          <ChevronUpIcon className="size-5 stroke-grafite" />
        ) : (
          <ChevronDownIcon className="size-5 stroke-grafite" />
        )}
      </button>
      {isOpen && (
        <div className="flex items-center gap-6">
          <div className="px-8 pb-8 pt-4 w-full">
            <div className="mb-4 border-b border-cinzaClaro pb-2">
              <p className="mb-1">
                <span className="font-semibold">Função do usuário:</span>{' '}
                <span className="text-verde">{userRole}</span>
              </p>
              <p className="mb-1">
                <span className="font-semibold">Organização:</span>{' '}
                <span className="text-verde">{action.userOrganization || 'N/A'}</span>
              </p>
              <p>
                <span className="font-semibold">Nome do usuário:</span>{' '}
                <span className="text-verde">{userName}</span>
              </p>
            </div>
            <div className="mb-4">
              <p className="mb-2">
                <span className="font-semibold">Parecer:</span>{' '}
                <span className={`font-medium ${action.action.toLowerCase().includes('favorável') ? 'text-green-600' : action.action.toLowerCase().includes('desfavorável') ? 'text-red-600' : 'text-blue-600'}`}>
                  {action.action}
                </span>
              </p>
              {action.observation && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="font-semibold mb-2">Justificativa:</p>
                  <p className="whitespace-pre-wrap text-gray-700">{action.observation}</p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Data do parecer:</span>{' '}
              {formattedDate}
            </p>
          </div>
          {action.files && action.files.length > 0 && (
            <div className="flex items-center gap-2">
              {action.files.map((file) => (
                <button
                  key={file}
                  type="button"
                  onClick={() => handleDownloadFile(file)}
                  className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-400 bg-cinzaClaro/50 p-4 hover:bg-cinzaClaro"
                >
                  <DocumentIcon className="size-6 w-full stroke-gray-400" />
                  <span className="text-sm font-medium text-grafite">
                    {file.substring(file.lastIndexOf('/') + 1)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
