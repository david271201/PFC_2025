export default function CountRanking({
  ranking,
  entity,
  isPrinting,
}: {
  ranking: {
    id: string;
    name: string;
    _count: {
      sentRequests: number;
    };
  }[];
  entity: string;
  isPrinting: boolean;
}) {
  return (
    <table
      className={`w-full ${isPrinting ? 'max-w-[600px]' : ''} border-collapse items-center border border-gray-400`}
    >
      <thead className="border-b bg-cinzaClaro">
        <tr>
          <th className="whitespace-nowrap px-6 py-3 text-left align-middle text-xs font-bold uppercase">
            {entity}
          </th>
          <th className="whitespace-nowrap px-6 py-3 text-left align-middle text-xs font-bold uppercase">
            # Solicitações
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-cinzaClaro">
        {ranking.map((item) => (
          <tr key={item.id} className="hover:bg-gray-100">
            <th className="line-clamp-1 overflow-hidden whitespace-nowrap border-x-0 border-t-0 p-4 px-6 text-left align-middle text-xs">
              {item.name}
            </th>
            <th className="whitespace-nowrap border-x-0 border-t-0 p-4 px-6 text-left align-middle text-xs">
              {item._count.sentRequests}
            </th>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
