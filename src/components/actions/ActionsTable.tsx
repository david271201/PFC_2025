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

  // Ordenar ações por data, da mais recente para a mais antiga
  const sortedActions = [...actions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <div className="flex w-full flex-col items-center gap-5">
        {sortedActions.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </Card>
  );
}
