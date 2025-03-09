import { forwardRef } from 'react';

type SelectOption = {
  label: string;
  value: string;
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
  divClassname?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, label, divClassname, ...props }, ref) => (
    <div className={`flex flex-col gap-1 ${divClassname ?? ''}`}>
      {label && <p className="font-medium text-grafite">{label}</p>}
      <select
        ref={ref}
        className="rounded border border-gray-300 px-2 text-grafite focus:outline-0 focus:ring focus:ring-verde"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
);

export default Select;
