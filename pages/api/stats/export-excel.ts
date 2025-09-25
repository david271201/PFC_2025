import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
import { UserType } from '@/permissions/utils';
import * as XLSX from 'xlsx';

interface FilterParams {
  region?: {
    in: string[];
  };
  organization?: {
    in: string[];
  };
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

interface RequestResponse {
  opmeCost: number;
  procedureCost: number;
  ticketCost: number;
  receiver: {
    name: string;
  };
}

interface RequestData {
  id: string;
  createdAt: Date;
  status: string;
  cbhpmCode: string;
  opmeCost: number;
  psaCost: number;
  needsCompanion: boolean;
  pacient: {
    name: string;
    cpf: string;
    rank: string;
  };
  sender: {
    id: string;
    name: string;
    regionId: string;
    region: {
      id: string;
      name: string;
    };
  };
  requestResponses: RequestResponse[];
  custos: {
    descricao: string;
    valor: number;
    createdAt: Date;
    usuario: {
      name: string;
    };
  }[];
}

// Função para formatar valores monetários
function formatCurrency(value: number): string {
  return (value / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

async function getAllRequestsData(prisma: any) {
  return await prisma.request.findMany({
    include: {
      pacient: {
        select: {
          name: true,
          cpf: true,
          rank: true
        }
      },
      sender: {
        select: {
          id: true,
          name: true,
          regionId: true,
          region: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      requestResponses: {
        where: {
          selected: true
        },
        include: {
          receiver: {
            select: {
              name: true
            }
          }
        }
      },
      custos: {
        select: {
          descricao: true,
          valor: true,
          createdAt: true,
          usuario: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

function checkIfMatchesFilters(request: RequestData, filters: FilterParams): boolean {
  // Verificar filtro de região
  if (filters.region && filters.region.in.length > 0) {
    if (!filters.region.in.includes(request.sender.regionId)) {
      return false;
    }
  }

  // Verificar filtro de organização
  if (filters.organization && filters.organization.in.length > 0) {
    if (!filters.organization.in.includes(request.sender.id)) {
      return false;
    }
  }

  // Verificar filtro de data
  if (filters.dateRange) {
    const requestDate = new Date(request.createdAt);
    
    if (filters.dateRange.startDate) {
      const startDate = new Date(filters.dateRange.startDate);
      if (requestDate < startDate) {
        return false;
      }
    }
    
    if (filters.dateRange.endDate) {
      const endDate = new Date(filters.dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (requestDate > endDate) {
        return false;
      }
    }
  }

  return true;
}

function convertRequestToExcelRow(request: RequestData): any {
  const totalOpmeRequest = request.opmeCost || 0;
  const totalPsaRequest = request.psaCost || 0;
  const totalOpmeResponse = request.requestResponses.reduce((sum: number, resp: RequestResponse) => sum + (resp.opmeCost || 0), 0);
  const totalProcedure = request.requestResponses.reduce((sum: number, resp: RequestResponse) => sum + (resp.procedureCost || 0), 0);
  const totalTicket = request.requestResponses.reduce((sum: number, resp: RequestResponse) => sum + (resp.ticketCost || 0), 0);
  const totalCustosAdicionais = request.custos.reduce((sum: number, custo) => sum + (custo.valor || 0), 0);
  const totalGeral = totalOpmeRequest + totalPsaRequest + totalOpmeResponse + totalProcedure + totalTicket + totalCustosAdicionais;

  return {
    'ID Solicitação': request.id,
    'Data Criação': new Date(request.createdAt).toLocaleDateString('pt-BR'),
    'Status': request.status,
    'CBHPM': request.cbhpmCode,
    'Paciente': request.pacient.name,
    'CPF Paciente': request.pacient.cpf,
    'Posto/Graduação': request.pacient.rank,
    'OM Solicitante': request.sender.name,
    'ID Região': request.sender.regionId,
    'Região': request.sender.region.name,
    'OM Destino': request.requestResponses.map((resp: RequestResponse) => resp.receiver.name).join('; '),
    'Necessita Acompanhante': request.needsCompanion ? 'Sim' : 'Não',
    'OPME Solicitação (R$)': (totalOpmeRequest / 100),
    'PSA Solicitação (R$)': (totalPsaRequest / 100),
    'OPME Resposta (R$)': (totalOpmeResponse / 100),
    'Custo Procedimento (R$)': (totalProcedure / 100),
    'Custo Passagem (R$)': (totalTicket / 100),
    'Custos Adicionais (R$)': (totalCustosAdicionais / 100),
    'Custos Adicionais Detalhes': request.custos.map(c => `${c.descricao}: R$ ${(c.valor / 100).toFixed(2)}`).join('; '),
    'Total Geral (R$)': (totalGeral / 100),
    'Total Geral (Centavos)': totalGeral
  };
}

function generateSummaryRow(requests: RequestData[], label: string, additionalInfo: string = ''): any {
  const totalOpmeRequest = requests.reduce((sum: number, r: RequestData) => sum + (r.opmeCost || 0), 0);
  const totalPsaRequest = requests.reduce((sum: number, r: RequestData) => sum + (r.psaCost || 0), 0);
  const totalOpmeResponse = requests.reduce((sum: number, r: RequestData) => sum + r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.opmeCost || 0), 0), 0);
  const totalProcedure = requests.reduce((sum: number, r: RequestData) => sum + r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.procedureCost || 0), 0), 0);
  const totalTicket = requests.reduce((sum: number, r: RequestData) => sum + r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.ticketCost || 0), 0), 0);
  const totalCustosAdicionais = requests.reduce((sum: number, r: RequestData) => sum + r.custos.reduce((s: number, c) => s + (c.valor || 0), 0), 0);
  const totalGeral = totalOpmeRequest + totalPsaRequest + totalOpmeResponse + totalProcedure + totalTicket + totalCustosAdicionais;

  return {
    'ID Solicitação': label,
    'Data Criação': additionalInfo,
    'Status': '',
    'CBHPM': `${new Set(requests.map((r: RequestData) => r.cbhpmCode)).size} códigos diferentes`,
    'Paciente': `${requests.length} solicitações`,
    'CPF Paciente': '',
    'Posto/Graduação': '',
    'OM Solicitante': `${new Set(requests.map((r: RequestData) => r.sender.name)).size} organizações`,
    'ID Região': '',
    'Região': `${new Set(requests.map((r: RequestData) => r.sender.region.name)).size} regiões`,
    'OM Destino': '',
    'Necessita Acompanhante': '',
    'OPME Solicitação (R$)': (totalOpmeRequest / 100),
    'PSA Solicitação (R$)': (totalPsaRequest / 100),
    'OPME Resposta (R$)': (totalOpmeResponse / 100),
    'Custo Procedimento (R$)': (totalProcedure / 100),
    'Custo Passagem (R$)': (totalTicket / 100),
    'Custos Adicionais (R$)': (totalCustosAdicionais / 100),
    'Custos Adicionais Detalhes': '',
    'Total Geral (R$)': (totalGeral / 100),
    'Total Geral (Centavos)': totalGeral
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const session = await auth(req, res);
  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  try {
    const { regions, organizations, startDate, endDate } = req.query;

    const filters: FilterParams = {};
    
    if (regions && typeof regions === 'string') {
      const regionList = atob(regions).split(',').filter(Boolean);
      if (regionList.length > 0) {
        filters.region = { in: regionList };
      }
    }
    
    if (organizations && typeof organizations === 'string') {
      const orgList = atob(organizations).split(',').filter(Boolean);
      if (orgList.length > 0) {
        filters.organization = { in: orgList };
      }
    }
    
    if (startDate || endDate) {
      filters.dateRange = {};
      if (startDate) filters.dateRange.startDate = startDate as string;
      if (endDate) filters.dateRange.endDate = endDate as string;
    }

    // Buscar TODOS os dados das solicitações
    const allRequests = await getAllRequestsData(prisma);

    // Separar dados filtrados
    const filteredRequests = allRequests.filter((request: RequestData) => checkIfMatchesFilters(request, filters));

    // SHEET 1: TODOS OS DADOS
    const allDataRows = allRequests.map((request: RequestData) => convertRequestToExcelRow(request));
    const allDataSummary = generateSummaryRow(allRequests, 'RESUMO GERAL - TODOS OS DADOS', `Total de ${allRequests.length} solicitações na base`);
    const sheet1Data = [allDataSummary, ...allDataRows];

    // SHEET 2: DADOS FILTRADOS
    const filteredDataRows = filteredRequests.map((request: RequestData) => convertRequestToExcelRow(request));
    
    let filterDescription = 'Filtros aplicados: ';
    const filterParts = [];
    if (regions && typeof regions === 'string') filterParts.push(`Regiões: ${atob(regions)}`);
    if (organizations && typeof organizations === 'string') filterParts.push(`Organizações: ${atob(organizations)}`);
    if (startDate || endDate) filterParts.push(`Período: ${startDate || 'Início'} até ${endDate || 'Hoje'}`);
    
    filterDescription += filterParts.length > 0 ? filterParts.join(', ') : 'Nenhum filtro aplicado';
    
    const filteredDataSummary = generateSummaryRow(filteredRequests, 'RESUMO - DADOS FILTRADOS', filterDescription);
    const sheet2Data = [filteredDataSummary, ...filteredDataRows];

    // Criar workbook com duas sheets
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Todos os dados
    const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
    XLSX.utils.book_append_sheet(workbook, ws1, 'Todos os Dados');

    // Sheet 2: Dados filtrados
    const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
    XLSX.utils.book_append_sheet(workbook, ws2, 'Dados Filtrados');

    // Gerar arquivo Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Definir headers da resposta
    const now = new Date();
    const filterInfo = [];
    if (regions) filterInfo.push('regioes');
    if (organizations) filterInfo.push('organizacoes');
    if (startDate || endDate) filterInfo.push('periodo');
    
    const filterSuffix = filterInfo.length > 0 ? `_filtrado_por_${filterInfo.join('_')}` : '_completo';
    const filename = `estatisticas_dsau_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}${filterSuffix}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    res.status(200).send(excelBuffer);

  } catch (error) {
    console.error('Erro ao gerar Excel:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
