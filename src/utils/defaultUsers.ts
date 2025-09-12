/**
 * Utilitário para criar usuários padrão ao cadastrar uma nova organização
 */

import { Role } from '@prisma/client';
import { hash } from 'bcrypt';

// Interface para usuários padrão
interface DefaultUser {
  role: Role;
  nameSuffix: string;
  email?: string; // Se não for fornecido, será gerado automaticamente
  password?: string; // Se não for fornecido, será gerado automaticamente
}

/**
 * Lista de usuários padrão que serão criados para cada organização
 */
export const DEFAULT_ORGANIZATION_USERS: DefaultUser[] = [
  { role: Role.OPERADOR_FUSEX, nameSuffix: "Operador Fusex" },
  { role: Role.CHEFE_FUSEX, nameSuffix: "Chefe Fusex" },
  { role: Role.HOMOLOGADOR, nameSuffix: "Homologador" },
  { role: Role.AUDITOR, nameSuffix: "Auditor" },
  { role: Role.CHEFE_AUDITORIA, nameSuffix: "Chefe Auditoria" },
  { role: Role.ESPECIALISTA, nameSuffix: "Especialista" },
  { role: Role.CHEFE_DIV_MEDICINA, nameSuffix: "Chefe Div Medicina" },
  { role: Role.COTADOR, nameSuffix: "Cotador" },
  { role: Role.CHEM, nameSuffix: "CHEM" }
];

/**
 * Retorna a senha padrão para os usuários
 * @returns string - Senha padrão "admin"
 */
export function generatePassword(): string {
  // Retorna a senha padrão "admin"
  return "admin";
}

/**
 * Gera um CPF temporário único baseado no timestamp
 * Nota: Este é apenas um CPF temporário para fins de sistema. 
 * Em produção, este deveria ser um CPF válido.
 */
export function generateTempCPF(): string {
  const timestamp = new Date().getTime().toString();
  // Pega os últimos 11 caracteres ou preenche com zeros à esquerda
  return timestamp.slice(-11).padStart(11, '0');
}

/**
 * Gera dados para os usuários padrão de uma organização
 * @param organizationId ID da organização
 * @param organizationName Nome da organização
 * @param regionId ID da região
 * @returns Array de objetos com os dados dos usuários
 */
export async function generateDefaultUsers(organizationId: string, organizationName: string) {
  // Normaliza o nome da organização para usar em emails e nomes de usuário
  const normalizedOrgName = organizationName
    .toLowerCase()
    .replace(/\s+/g, '')  // Remove espaços
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
  
  const usersData: {
    email: string;
    cpf: string;
    password: string;
    name: string;
    role: Role;
    organizationId: string;
  }[] = [];
  
  // Senha padrão "admin" para todos os usuários
  const defaultPassword = "admin";
  
  for (const defaultUser of DEFAULT_ORGANIZATION_USERS) {
    // Gera um CPF temporário
    const tempCPF = generateTempCPF();
    
    // Hash da senha
    const hashedPassword = await hash(defaultPassword, 10);
    
    // Gera o nome do usuário
    const userName = `${organizationName} - ${defaultUser.nameSuffix}`;
    
    // Gera o email no formato solicitado: perfil@organizacao.com
    // Transforma OPERADOR_FUSEX para operador_fusex, etc.
    const emailPrefix = defaultUser.role.toLowerCase();
    const email = defaultUser.email || `${emailPrefix}@${normalizedOrgName}.com`;
    
    // Cria o objeto de usuário
    usersData.push({
      email,
      cpf: tempCPF,
      password: hashedPassword,
      name: userName,
      role: defaultUser.role,
      organizationId
    });
  }
  
  return {
    usersData,
    // Também retornamos as senhas em texto plano para exibir ao administrador
    plainPasswords: DEFAULT_ORGANIZATION_USERS.map((user, index) => ({
      name: `${organizationName} - ${user.nameSuffix}`,
      role: user.role,
      email: usersData[index].email,
      password: defaultPassword  // Usando a senha padrão "admin"
    }))
  };
}
