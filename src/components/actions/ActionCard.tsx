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
        <div className="grid w-full grid-cols-[1fr_1fr_1fr]">
          <span className="text-left font-semibold">{userName}</span>
          <span className="text-left">{action.action}</span>
          <span className="text-left">{formattedDate}</span>
        </div>
        {isOpen ? (
          <ChevronUpIcon className="size-5 stroke-grafite" />
        ) : (
          <ChevronDownIcon className="size-5 stroke-grafite" />
        )}
      </button>
      {isOpen && (
        <div className="flex items-center gap-6">
          <div className="px-8 pb-8 pt-4">
            <p>
              <b>Função do usuário:</b> {userRole}, {action.userOrganization}
            </p>
            <p>
              <b>Nome do usuário:</b> {userName}
            </p>
            <p>
              <b>Data:</b> {formattedDate}
            </p>
            <p>
              <b>Observação:</b> {action.observation || 'Sem Observação'}
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
