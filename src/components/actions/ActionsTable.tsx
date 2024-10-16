import { TActionLogWithUserInfo } from '@/common-types';
import ActionCard from './ActionCard';
import Card from '../common/card';

export default function ActionsTable({
  actions,
  hideCard,
}: {
  actions: TActionLogWithUserInfo[];
  hideCard?: boolean;
}) {
  if (hideCard) {
    return (
      <div className="flex w-full flex-col items-center gap-5">
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <div className="flex w-full flex-col items-center gap-5">
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </Card>
  );
}
