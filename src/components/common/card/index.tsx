export default function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-start justify-center gap-10 rounded-lg border-2 border-cinzaClaro bg-white p-8 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
