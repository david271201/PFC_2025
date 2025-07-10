import { UserType } from '@/permissions/utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Role } from '@prisma/client';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Topbar() {
  const { data: session } = useSession();
  const user = session?.user as UserType | undefined;
  const router = useRouter();
  const { pathname } = router;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <div className="flex h-12 w-full items-center justify-between border-b border-b-cinzaClaro bg-verde px-4 py-2">
      <div className="flex items-center gap-6">
        <Image src="/logo-dsau.gif" width={28} height={28} alt="Logo" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/solicitacoes')}
            className={`rounded print:hidden ${pathname === '/solicitacoes' ? 'bg-verdeEscuro' : ''} px-2 py-1 text-white hover:bg-verdeEscuro`}
          >
            Solicitações
          </button>
          {/* Botão Estatísticas - apenas para papéis específicos */}
          {user?.role === Role.SUBDIRETOR_SAUDE && (
            <button
              type="button"
              onClick={() => router.push('/estatisticas')}
              className={`rounded print:hidden ${pathname.includes('/estatisticas') ? 'bg-verdeEscuro' : ''} px-2 py-1 text-white hover:bg-verdeEscuro`}
            >
              Estatísticas
            </button>
          )}
          
          {/* Botão Insights - disponível para todos os usuários autenticados */}
          <button
            type="button"
            onClick={() => router.push('/insights')}
            className={`rounded print:hidden ${pathname.includes('/insights') ? 'bg-verdeEscuro' : ''} px-2 py-1 text-white hover:bg-verdeEscuro`}
          >
            Insights
          </button>
        </div>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={toggleDropdown}
          className="flex items-center gap-1 rounded px-4 py-2 text-white hover:bg-verdeEscuro"
        >
          <span className="text-sm">{user?.name || 'Usuário'}</span>
          <ChevronDownIcon className="size-4 stroke-white stroke-[3]" />
        </button>
        {isDropdownOpen && (
          <div className="absolute right-0 mt-1 w-max max-w-[300px] rounded border border-gray-200 bg-white p-2 shadow-lg">
            <p className="font-bold">{user?.name || 'Usuário Desconhecido'}</p>
            <p>
              <span className="font-bold">Email:</span>{' '}
              {user?.email || 'Email Desconhecido'}
            </p>
            <p>
              <span className="font-bold">Função:</span>{' '}
              {user?.role ? user.role.replaceAll('_', ' ') : '-'}
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => signOut()}
                className="mt-2 w-full rounded bg-red-500 py-2 text-white hover:bg-red-600"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
