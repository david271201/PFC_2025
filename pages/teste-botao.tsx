import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/components/common/button';
import modal from '@/components/common/modal';
import Swal from 'sweetalert2';
import { Role } from '@prisma/client';

type TestFormData = {
  observation: string;
};

export default function TesteBotaoCorrecao() {
  const { register, handleSubmit } = useForm<TestFormData>();
  const [role] = useState<Role>(Role.CHEFE_DIV_MEDICINA);

  const submitCorrection = async (data: TestFormData) => {
    console.log("🔍 submitCorrection chamado com:", data);
    
    Swal.fire({
      title: "Sucesso",
      icon: "success",
      text: "Função de correção funcionando corretamente!",
      customClass: {
        confirmButton:
          "bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro",
      },
    });
  };

  const confirmCorrection = (data: TestFormData) => {
    console.log("🔍 confirmCorrection chamado com:", data);
    
    modal({
      title: "Devolver para correção",
      text: role === Role.OPERADOR_FUSEX
        ? "Deseja devolver esta solicitação para correção? Isto irá retornar a solicitação para o operador responsável."
        : "Deseja devolver este pedido para correção?",
      icon: "warning",
      onConfirm: () => submitCorrection(data),
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teste do Botão "Devolver para correção"</h1>
      
      <form className="space-y-4">
        <div>
          <label className="block mb-2">Observação:</label>
          <textarea
            {...register("observation")}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Digite uma observação..."
            rows={3}
          />
        </div>
        
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={handleSubmit(confirmCorrection)}
            color="danger"
          >
            Devolver para correção
          </Button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Informações de Debug:</h2>
        <ul className="text-sm">
          <li>Role atual: {role}</li>
          <li>Função confirmCorrection: {typeof confirmCorrection}</li>
          <li>Função submitCorrection: {typeof submitCorrection}</li>
        </ul>
      </div>
    </div>
  );
}
