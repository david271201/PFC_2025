import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
import { UserType } from '@/permissions/utils';

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

// Função para converter dados em CSV
function convertToCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escapar aspas e adicionar aspas se contém vírgula ou quebra de linha
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
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

    // Preparar dados para CSV - TODOS os dados com indicação de filtro
    const csvData = allRequests.map((request: RequestData) => {
      const totalOpmeRequest = request.opmeCost || 0;
      const totalPsaRequest = request.psaCost || 0;
      const totalOpmeResponse = request.requestResponses.reduce((sum: number, resp: RequestResponse) => sum + (resp.opmeCost || 0), 0);
      const totalProcedure = request.requestResponses.reduce((sum: number, resp: RequestResponse) => sum + (resp.procedureCost || 0), 0);
      const totalTicket = request.requestResponses.reduce((sum: number, resp: RequestResponse) => sum + (resp.ticketCost || 0), 0);
      const totalCustosAdicionais = request.custos.reduce((sum: number, custo) => sum + (custo.valor || 0), 0);
      const totalGeral = totalOpmeRequest + totalPsaRequest + totalOpmeResponse + totalProcedure + totalTicket + totalCustosAdicionais;

      // Verificar se a solicitação atende aos filtros aplicados
      const atendeFilters = checkIfMatchesFilters(request, filters);

      return {
        'Atende Filtros': atendeFilters ? 'SIM' : 'NÃO',
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
        'OPME Solicitação': formatCurrency(totalOpmeRequest),
        'PSA Solicitação': formatCurrency(totalPsaRequest),
        'OPME Resposta': formatCurrency(totalOpmeResponse),
        'Custo Procedimento': formatCurrency(totalProcedure),
        'Custo Passagem': formatCurrency(totalTicket),
        'Custos Adicionais': formatCurrency(totalCustosAdicionais),
        'Custos Adicionais Detalhes': request.custos.map(c => `${c.descricao}: ${formatCurrency(c.valor)}`).join('; '),
        'Total Geral': formatCurrency(totalGeral),
        'Total Geral (Centavos)': totalGeral
      };
    });

    // Separar dados filtrados vs todos os dados
    const filteredRequests = allRequests.filter((request: RequestData) => checkIfMatchesFilters(request, filters));
    
    // Gerar estatísticas resumo - TODOS OS DADOS
    const resumoTodosOsDados = {
      'Tipo Dado': 'RESUMO - TODOS OS DADOS',
      'Atende Filtros': '',
      'ID Solicitação': '',
      'Data Criação': `Total de ${allRequests.length} solicitações na base`,
      'Status': '',
      'CBHPM': `${new Set(allRequests.map((r: RequestData) => r.cbhpmCode)).size} códigos diferentes`,
      'Paciente': `${allRequests.length} pacientes`,
      'CPF Paciente': '',
      'Posto/Graduação': '',
      'OM Solicitante': `${new Set(allRequests.map((r: RequestData) => r.sender.name)).size} organizações`,
      'ID Região': '',
      'Região': `${new Set(allRequests.map((r: RequestData) => r.sender.region.name)).size} regiões`,
      'OM Destino': '',
      'Necessita Acompanhante': '',
      'OPME Solicitação': formatCurrency(allRequests.reduce((sum: number, r: RequestData) => sum + (r.opmeCost || 0), 0)),
      'PSA Solicitação': formatCurrency(allRequests.reduce((sum: number, r: RequestData) => sum + (r.psaCost || 0), 0)),
      'OPME Resposta': formatCurrency(allRequests.reduce((sum: number, r: RequestData) => sum + r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.opmeCost || 0), 0), 0)),
      'Custo Procedimento': formatCurrency(allRequests.reduce((sum: number, r: RequestData) => sum + r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.procedureCost || 0), 0), 0)),
      'Custo Passagem': formatCurrency(allRequests.reduce((sum: number, r: RequestData) => sum + r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.ticketCost || 0), 0), 0)),
      'Custos Adicionais': formatCurrency(allRequests.reduce((sum: number, r: RequestData) => sum + r.custos.reduce((s: number, c) => s + (c.valor || 0), 0), 0)),
      'Custos Adicionais Detalhes': '',
      'Total Geral': formatCurrency(allRequests.reduce((sum: number, r: RequestData) => {
        const totalOpmeRequest = r.opmeCost || 0;
        const totalPsaRequest = r.psaCost || 0;
        const totalOpmeResponse = r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.opmeCost || 0), 0);
        const totalProcedure = r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.procedureCost || 0), 0);
        const totalTicket = r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.ticketCost || 0), 0);
        const totalCustosAdicionais = r.custos.reduce((s: number, c) => s + (c.valor || 0), 0);
        return sum + totalOpmeRequest + totalPsaRequest + totalOpmeResponse + totalProcedure + totalTicket + totalCustosAdicionais;
      }, 0)),
      'Total Geral (Centavos)': ''
    };

    // Gerar estatísticas resumo - APENAS DADOS FILTRADOS
    const resumoFiltrados = {
      'Tipo Dado': 'RESUMO - DADOS FILTRADOS',
      'Atende Filtros': '',
      'ID Solicitação': '',
      'Data Criação': `Período: ${startDate || 'Início'} até ${endDate || 'Hoje'}`,
      'Status': '',
      'CBHPM': `${new Set(filteredRequests.map((r: RequestData) => r.cbhpmCode)).size} códigos filtrados`,
      'Paciente': `${filteredRequests.length} solicitações filtradas`,
      'CPF Paciente': '',
      'Posto/Graduação': '',
      'OM Solicitante': `${new Set(filteredRequests.map((r: RequestData) => r.sender.name)).size} organizações filtradas`,
      'ID Região': '',
      'Região': `${new Set(filteredRequests.map((r: RequestData) => r.sender.region.name)).size} regiões filtradas`,
      'OM Destino': '',
      'Necessita Acompanhante': '',
      'OPME Solicitação': formatCurrency(filteredRequests.reduce((sum: number, r: RequestData) => sum + (r.opmeCost || 0), 0)),
      'PSA Solicitação': formatCurrency(filteredRequests.reduce((sum: number, r: RequestData) => sum + (r.psaCost || 0), 0)),
      'OPME Resposta': formatCurrency(filteredRequests.reduce((sum: number, r: RequestData) => sum + r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.opmeCost || 0), 0), 0)),
      'Custo Procedimento': formatCurrency(filteredRequests.reduce((sum: number, r: RequestData) => sum + r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.procedureCost || 0), 0), 0)),
      'Custo Passagem': formatCurrency(filteredRequests.reduce((sum: number, r: RequestData) => sum + r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.ticketCost || 0), 0), 0)),
      'Custos Adicionais': formatCurrency(filteredRequests.reduce((sum: number, r: RequestData) => sum + r.custos.reduce((s: number, c) => s + (c.valor || 0), 0), 0)),
      'Custos Adicionais Detalhes': '',
      'Total Geral': formatCurrency(filteredRequests.reduce((sum: number, r: RequestData) => {
        const totalOpmeRequest = r.opmeCost || 0;
        const totalPsaRequest = r.psaCost || 0;
        const totalOpmeResponse = r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.opmeCost || 0), 0);
        const totalProcedure = r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.procedureCost || 0), 0);
        const totalTicket = r.requestResponses.reduce((s: number, resp: RequestResponse) => s + (resp.ticketCost || 0), 0);
        const totalCustosAdicionais = r.custos.reduce((s: number, c) => s + (c.valor || 0), 0);
        return sum + totalOpmeRequest + totalPsaRequest + totalOpmeResponse + totalProcedure + totalTicket + totalCustosAdicionais;
      }, 0)),
      'Total Geral (Centavos)': ''
    };

    // Adicionar linhas de resumo no início
    const allData = [resumoTodosOsDados, resumoFiltrados, ...csvData];

    const headers = [
      'Tipo Dado',
      'Atende Filtros',
      'ID Solicitação',
      'Data Criação', 
      'Status',
      'CBHPM',
      'Paciente',
      'CPF Paciente',
      'Posto/Graduação',
      'OM Solicitante',
      'ID Região',
      'Região',
      'OM Destino',
      'Necessita Acompanhante',
      'OPME Solicitação',
      'PSA Solicitação',
      'OPME Resposta',
      'Custo Procedimento',
      'Custo Passagem',
      'Custos Adicionais',
      'Custos Adicionais Detalhes',
      'Total Geral',
      'Total Geral (Centavos)'
    ];

    // Adicionar campo identificador
    allData.forEach((item, index) => {
      if (index === 0) {
        item['Tipo Dado'] = 'RESUMO - TODOS OS DADOS';
      } else if (index === 1) {
        item['Tipo Dado'] = 'RESUMO - DADOS FILTRADOS';
      } else {
        item['Tipo Dado'] = 'DADOS DETALHADOS';
      }
    });

    const csv = convertToCSV(allData, headers);

    // Definir headers da resposta
    const now = new Date();
    const filterInfo = [];
    if (regions) filterInfo.push('regioes');
    if (organizations) filterInfo.push('organizacoes');
    if (startDate || endDate) filterInfo.push('periodo');
    
    const filterSuffix = filterInfo.length > 0 ? `_filtrado_por_${filterInfo.join('_')}` : '_todos_os_dados';
    const filename = `estatisticas_completas_dsau_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}${filterSuffix}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Adicionar BOM para Excel reconhecer UTF-8
    const bom = '\uFEFF';
    res.status(200).send(bom + csv);

  } catch (error) {
    console.error('Erro ao gerar CSV:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
