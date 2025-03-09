export default function SpinLoading({
  size = 4,
  showText,
}: {
  size?: number;
  showText?: boolean;
}) {
  if (showText) {
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        style={{
          height: `${size / 4}rem`,
          width: `${size / 4}rem`,
        }}
        className="animate-spin rounded-full border-2 border-cinzaClaro border-t-verde bg-transparent"
      />
      <span className="text-sm text-grafite">Carregando...</span>
    </div>;
  }

  return (
    <div
      style={{
        height: `${size / 4}rem`,
        width: `${size / 4}rem`,
      }}
      className="animate-spin rounded-full border-2 border-cinzaClaro border-t-verde bg-transparent"
    />
  );
}
