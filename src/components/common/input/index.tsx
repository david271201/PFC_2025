import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  divClassname?: string;
}

import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';

export function formatCurrency(value: number, inCents = false) {
  return formatCurrencyUtil(value, inCents);
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, divClassname, ...props }, ref) => (
    <div className={`flex flex-col gap-1 ${divClassname ?? ''}`}>
      {label && <p className="text-sm font-medium text-grafite">{label}</p>}
      <input
        ref={ref}
        className="rounded border border-gray-300 px-2 text-grafite focus:outline-0 focus:ring focus:ring-verde"
        {...props}
      />
    </div>
  ),
);

export default Input;
