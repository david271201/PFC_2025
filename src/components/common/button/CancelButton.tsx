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
      try {
        const formData = new FormData();
        formData.append('cancel', 'true');

        const response = await fetch(`/api/requests/${requestId}/status`, {
          method: 'PATCH',
          body: formData,
        });

        if (response.ok) {
          await Swal.fire({
            title: 'Sucesso!',
            text: 'Solicitação cancelada com sucesso.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
          });
          router.reload();
        } else {
          const errorData = await response.json();
          await Swal.fire({
            title: 'Erro!',
            text: errorData.message || 'Erro ao cancelar a solicitação.',
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        }
      } catch (error) {
        await Swal.fire({
          title: 'Erro!',
          text: 'Erro de conexão ao cancelar a solicitação.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
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
