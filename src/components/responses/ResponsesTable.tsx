import { TRequestResponseWithReceiver } from '@/common-types';
import ResponseCard from './ResponseCard';
import Card from '../common/card';

export default function ResponsesTable({
  responses,
}: {
  responses: TRequestResponseWithReceiver[];
}) {
  return (
    <Card>
      <div className="flex w-full flex-col items-center gap-5">
        {responses.map((response) => (
          <ResponseCard key={response.id} response={response} />
        ))}
      </div>
    </Card>
  );
}
