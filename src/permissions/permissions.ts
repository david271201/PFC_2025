export const permissions = [
  /* PERMISSOES PARA ARQUIVOS */
  'files:download', // Download de arquivo
  /* PERMISSOES PARA ORGANIZAÇÕES */
  'organizations:read', // Leitura de organização  /* PERMISSOES PARA PACIENTES */
  'pacients:create', // Criação de paciente
  'pacients:read', // Leitura de paciente
  'pacients:update', // Atualização de paciente
  'pacients:delete', // Deleção de paciente
  /* PERMISSOES PARA SOLICITACOES */
  'requests:create', // Criação de solicitação
  'requests:read', // Leitura de solicitação
  'requests:update', // Atualização de solicitação
  'requests:delete', // Deleção de solicitação
  'responses:select', // Seleção da OMS para evacuar
  /* PERMISSOES PARA ESTATÍSTICAS */
  'stats:read', // Leitura de estatísticas
  /* PERMISSOES PARA USUÁRIOS */
  'users:read', // Leitura de usuários
  'responses:update', // ediçao de respostas
] as const;

export type Permission = (typeof permissions)[number];
