import { useContext } from 'react';
import { AccordionContext } from './AccordionRoot';

export default function AccordionBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen } = useContext(AccordionContext);

  return isOpen ? <div>{children}</div> : null;
}
