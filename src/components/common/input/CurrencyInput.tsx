import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  inCents?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder = '0,00',
  inCents = false,
}) => {
  // Converte valor de centavos para reais se necessário
  const realValue = inCents ? value / 100 : value;
  
  // Mantém o valor de exibição como string para facilitar a edição
  const [displayValue, setDisplayValue] = useState<string>(
    realValue === 0 ? '' : realValue.toString().replace('.', ',')
  );

  // Atualiza o valor de exibição quando o valor da prop mudar (efeito externo)
  useEffect(() => {
    const valueToDisplay = inCents ? value / 100 : value;
    setDisplayValue(valueToDisplay === 0 ? '' : valueToDisplay.toString().replace('.', ','));
  }, [value, inCents]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permitir apenas números e uma vírgula
    const cleanValue = inputValue.replace(/[^\d,]/g, '');
    
    // Garantir que haja apenas uma vírgula
    const parts = cleanValue.split(',');
    const formattedValue = parts.length > 1 
      ? `${parts[0]},${parts.slice(1).join('')}`
      : cleanValue;
    
    // Atualizar o valor de exibição
    setDisplayValue(formattedValue);
    
    // Converte para número
    const numericValue = formattedValue ? parseFloat(formattedValue.replace(',', '.')) : 0;
    
    // Se o valor deve ser armazenado em centavos, multiplica por 100
    onChange(inCents ? Math.round(numericValue * 100) : numericValue);
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-grafite mb-1">{label}</label>}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className="text-gray-500">R$</span>
        </div>
        <input
          type="text"
          inputMode="decimal"
          className="w-full rounded border border-gray-300 px-2 pl-10 py-2 text-grafite focus:outline-0 focus:ring focus:ring-verde"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default CurrencyInput;