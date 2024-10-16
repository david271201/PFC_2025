import { TRequestResponseWithReceiver } from '@/common-types';
import { useState } from 'react';
import { RequestStatus } from '@prisma/client';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { terminalStatuses } from '@/permissions/utils';
import RequestResponseInfo from '../requests/RequestResponseInfo';
import ActionsTable from '../actions/ActionsTable';

const getStatus = (responseStatus: RequestStatus) => {
  if (terminalStatuses.includes(responseStatus)) {
    return responseStatus.replaceAll('_', ' ');
  }

  return 'AGUARDANDO RESPOSTA';
};

export default function ResponseCard({
  response,
}: {
  response: TRequestResponseWithReceiver;
}) {
  const status = getStatus(response.status);
  const [isOpen, setIsOpen] = useState(status !== 'AGUARDANDO RESPOSTA');

  const getBgColor = () => {
    if (response.selected) {
      return 'bg-verdeClaro hover:bg-verde/70';
    }

    if (response.status === RequestStatus.REPROVADO_DSAU) {
      return 'bg-red-300 hover:bg-red-400';
    }

    return 'bg-white hover:bg-gray-100';
  };

  return (
    <div className="flex w-full flex-col justify-center gap-2 rounded-lg border-2 border-cinzaClaro">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={status === 'AGUARDANDO RESPOSTA'}
        className={`flex w-full items-center justify-between rounded px-8 py-2 text-sm text-grafite ${getBgColor()} ${isOpen ? 'border-b-2 border-cinzaClaro' : ''}`}
      >
        <span className="font-semibold">{response.receiver.name}</span>
        <span>
          {response.selected ? 'ESCOLHIDO' : getStatus(response.status)}
        </span>
        <span>{new Date(response.updatedAt).toLocaleDateString()}</span>
        {isOpen ? (
          <ChevronUpIcon className="size-5 stroke-grafite" />
        ) : (
          <ChevronDownIcon
            className={`${status === 'AGUARDANDO RESPOSTA' ? 'invisible' : ''}  size-5 stroke-grafite`}
          />
        )}
      </button>
      {isOpen && (
        <div className="flex flex-col gap-4 px-8 pb-8 pt-4">
          <RequestResponseInfo requestResponse={response} />
          <ActionsTable actions={response.actions} hideCard />
        </div>
      )}
    </div>
  );
}
