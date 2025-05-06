import { useRouter } from 'next/router';

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
    <tr
      className="hover:bg-gray-100"
      onClick={() =>
        router.push(
          isResponse
            ? `/solicitacoes/recebidas/${request.id}`
            : `/solicitacoes/${request.id}`,
        )
      }
      style={{ cursor: 'pointer' }}
    >
      <td className="whitespace-nowrap border-x-0 border-t-0 p-4 px-6 align-middle text-xs">
        {request.status.replaceAll('_', ' ').replace(/\d/g, '')}
      </td>
      <td className="whitespace-nowrap border-x-0 border-t-0 p-4 px-6 align-middle text-xs">
        {request.pacientCpf}
      </td>
      <td className="whitespace-nowrap border-x-0 border-t-0 p-4 px-6 align-middle text-xs">
        {request.sender.name}
      </td>
      <td
        className={`whitespace-nowrap border-x-0 border-t-0 p-4 px-6 align-middle text-xs ${getColorForDays(daysSinceCreation)}`}
      >
        {daysSinceCreation} dias
      </td>
      <td className="whitespace-nowrap border-x-0 border-t-0 p-4 px-6 align-middle text-xs">
        {new Date(request.updatedAt).toLocaleDateString()}
      </td>
    </tr>
  );
}

export default TableRow;
