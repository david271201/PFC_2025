import { Role } from '@prisma/client';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';

export default function CancelButton({ requestId }: { requestId: string }) {
  const router = useRouter();

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: 'Cancelar solicitação?',
      text: 'Você tem certeza que deseja cancelar esta solicitação?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, cancelar!',
      cancelButtonText: 'Não'
    });

    if (result.isConfirmed) {
      const formData = new FormData();
      formData.append('cancelation', 'true');

      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        router.reload();
      }
    }
  };

  return (
    <button
      onClick={handleCancel}
      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
    >
      Cancelar
    </button>
  );
}
