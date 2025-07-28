import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { UserType } from '@/permissions/utils';
import CancelButton from '../button/CancelButton';

function TableRow({
  request,
  isResponse = false,
}: {
  request: {
    id: string;
    status: string;
    pacientCpf: string;
    sender: { name: string };
    updatedAt: Date;
    createdAt: Date;
  };
  isResponse?: boolean;
}) {
  const { data: session } = useSession();
  const role = session?.user ? (session.user as UserType).role : undefined;
  const router = useRouter();

  const daysSinceCreation = Math.floor(
    (new Date().getTime() - new Date(request.updatedAt).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const getColorForDays = (days: number) => {
    if (days <= 5) return 'text-green-500';
    if (days <= 10) return 'text-yellow-500';
    if (days > 10) return 'text-red-500';
    return 'text-black';
  };

  return (
    <tr className="hover:bg-gray-100">
      <td className="whitespace-nowrap border-x-0 border-t-0 p-4 px-6 align-middle text-xs flex items-center gap-2">
        <div onClick={() => router.push(isResponse ? `/solicitacoes/recebidas/${request.id}` : `/solicitacoes/${request.id}`)} 
             style={{ cursor: 'pointer' }}>
          {request.status.replaceAll('_', ' ').replace(/\d/g, '')}
        </div>
        {role === Role.OPERADOR_FUSEX && !isResponse && (
          <CancelButton requestId={request.id} />
        )}
      </td>
      <td onClick={() => router.push(isResponse ? `/solicitacoes/recebidas/${request.id}` : `/solicitacoes/${request.id}`)}
          style={{ cursor: 'pointer' }}
          className="whitespace-nowrap border-x-0 border-t-0 p-4 px-6 align-middle text-xs">
        {request.pacientCpf}
      </td>
      <td onClick={() => router.push(isResponse ? `/solicitacoes/recebidas/${request.id}` : `/solicitacoes/${request.id}`)}
          style={{ cursor: 'pointer' }}
          className="whitespace-nowrap border-x-0 border-t-0 p-4 px-6 align-middle text-xs">
        {request.sender.name}
      </td>
      <td onClick={() => router.push(isResponse ? `/solicitacoes/recebidas/${request.id}` : `/solicitacoes/${request.id}`)}
          style={{ cursor: 'pointer' }}
          className="whitespace-nowrap border-x-0 border-t-0 p-4 px-6 align-middle text-xs">
        <span className={getColorForDays(daysSinceCreation)}>
          {daysSinceCreation} dias
        </span>
      </td>
      <td onClick={() => router.push(isResponse ? `/solicitacoes/recebidas/${request.id}` : `/solicitacoes/${request.id}`)}
          style={{ cursor: 'pointer' }}
          className="whitespace-nowrap border-x-0 border-t-0 p-4 px-6 align-middle text-xs">
        {new Date(request.updatedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>
    </tr>
  );
}

export default TableRow;
