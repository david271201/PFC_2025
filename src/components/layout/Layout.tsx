import Topbar from './Topbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full bg-white">
      <Topbar />
      {children}
    </div>
  );
}
