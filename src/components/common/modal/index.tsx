import Swal, { SweetAlertOptions } from 'sweetalert2';

type SwalPopupProps = SweetAlertOptions & {
  title?: string;
  text?: string;
  icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
  onCancel?: () => void;
  onConfirm?: () => void;
  showCancelButton?: boolean;
};

const modal = ({
  title = 'Confirmação',
  text = 'Tem certeza que deseja confirmar a ação?',
  icon = 'warning',
  onCancel,
  onConfirm,
  showCancelButton = true,
  ...props
}: SwalPopupProps) => {
  Swal.fire({
    title,
    text,
    icon,
    showCancelButton,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    customClass: {
      confirmButton:
        'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
      cancelButton:
        'bg-vermelho text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-vermelhoEscuro',
    },
    ...props,
  }).then((result) => {
    if (result.isConfirmed && onConfirm) {
      onConfirm();
    } else if (result.dismiss === Swal.DismissReason.cancel && onCancel) {
      onCancel();
    }
  });
};

export default modal;
