/* eslint-disable react/jsx-no-constructed-context-values */
import { createContext, useState } from 'react';

export const AccordionContext = createContext<{
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export default function AccordionRoot({
  startOpen = false,
  children,
}: {
  startOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(startOpen);

  return (
    <AccordionContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="flex flex-col gap-2">{children}</div>
    </AccordionContext.Provider>
  );
}
