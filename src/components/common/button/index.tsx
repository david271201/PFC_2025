import SpinLoading from '../loading/SpinLoading';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  color?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
  isLoading?: boolean;
}

const colors = {
  primary: 'bg-verde text-white hover:bg-verdeEscuro',
  secondary: 'bg-cinzaClaro text-grafite hover:bg-verdeClaro',
  danger: 'bg-vermelho text-white hover:bg-vermelhoEscuro',
};

const sizes = {
  sm: 'text-sm',
  md: '',
};

export default function Button({
  children,
  color = 'primary',
  size = 'md',
  className,
  isLoading,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`flex items-center justify-center gap-2 rounded p-2 text-center transition-all duration-100 ease-in-out hover:scale-105 ${colors[color]} ${sizes[size]} ${className ?? ''}`}
      {...props}
    >
      {children}
      {isLoading && <SpinLoading />}
    </button>
  );
}
