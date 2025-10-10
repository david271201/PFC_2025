import React from 'react';

interface TokenSequencialDisplayProps {
  token?: string;
  className?: string;
}

export default function TokenSequencialDisplay({ 
  token, 
  className = "" 
}: TokenSequencialDisplayProps) {
  if (!token) {
    return null;
  }

  return (
    <div className={`bg-verde/10 border border-verde/20 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 bg-verde text-white rounded-full text-sm font-bold">
          🎫
        </div>
        <div>
          <p className="text-sm font-medium text-grafite">Token Sequencial</p>
          <p className="text-lg font-bold text-verde font-mono">{token}</p>
          <p className="text-xs text-gray-500">
            Gerado na aprovação da Seção Regional de Saúde
          </p>
        </div>
      </div>
    </div>
  );
}
