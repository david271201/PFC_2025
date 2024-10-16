import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useContext } from 'react';
import { AccordionContext } from './AccordionRoot';

export default function AccordionHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, setIsOpen } = useContext(AccordionContext);

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className="flex w-full items-center justify-between border-b-2 border-cinzaClaro py-1"
    >
      {children}
      {isOpen ? (
        <ChevronUpIcon className="size-5 stroke-grafite" />
      ) : (
        <ChevronDownIcon className="size-5 stroke-grafite" />
      )}
    </button>
  );
}
