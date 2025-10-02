import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@@/auth';
import prisma from '@@/prisma/prismaClient';
import { UserType } from '@/permissions/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await auth(req, res);
  
  if (!session?.user) {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  if (req.method === 'GET') {
    try {
      const { 
        startDate, 
        endDate, 
        regionIds = '', 
        organizationIds = '' 
      } = req.query;

      // Parse dos filtros
      const selectedRegions = regionIds && regionIds !== '' 
        ? (regionIds as string).split(',').filter(id => id.trim() !== '')
        : [];
      
      const selectedOrganizations = organizationIds && organizationIds !== ''
        ? (organizationIds as string).split(',').filter(id => id.trim() !== '')
        : [];

      // Construir filtros de data
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate as string);
      }
      if (endDate) {
        const endDateTime = new Date(endDate as string);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.lte = endDateTime;
      }

      // Construir filtros para organizações
      const organizationFilter: any = {};
      if (selectedRegions.length > 0) {
        organizationFilter.regionId = { in: selectedRegions };
      }
      if (selectedOrganizations.length > 0) {
        organizationFilter.id = { in: selectedOrganizations };
      }

      const whereClause: any = {};
      if (Object.keys(dateFilter).length > 0) {
        whereClause.createdAt = dateFilter;
      }
      if (Object.keys(organizationFilter).length > 0) {
        whereClause.sender = organizationFilter;
      }

      // Buscar solicitações com seus custos
      const requests = await prisma.request.findMany({
        where: whereClause,
        include: {
          sender: {
            include: {
              region: true
            }
          },
          requestResponses: {
            where: {
              selected: true // Apenas respostas selecionadas
            },
            include: {
              receiver: {
                include: {
                  region: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Processar dados para estatísticas
      const custosPorRM: Record<string, any> = {};
      const custosPorOM: Record<string, any> = {};
      
      let totalGeralOPME = 0;
      let totalGeralPSA = 0;
      let totalGeralProcedure = 0;
      let totalGeralTicket = 0;
      let quantidadeTotal = 0;

      requests.forEach(request => {
        const regionId = request.sender.regionId;
        const regionName = request.sender.region.name;
        const orgId = request.sender.id;
        const orgName = request.sender.name;

        // Custos da solicitação principal
        const opmeCostRequest = request.opmeCost || 0;
        const psaCostRequest = request.psaCost || 0;

        // Custos das respostas selecionadas
        let opmeCostResponse = 0;
        let procedureCostResponse = 0;
        let ticketCostResponse = 0;

        request.requestResponses.forEach(response => {
          opmeCostResponse += response.opmeCost || 0;
          procedureCostResponse += response.procedureCost || 0;
          ticketCostResponse += response.ticketCost || 0;
        });

        // Total por solicitação (removendo custos de passagem)
        const totalSolicitacao = opmeCostRequest + psaCostRequest + opmeCostResponse + procedureCostResponse;

        // Atualizar totais gerais (removendo custos de passagem)
        totalGeralOPME += opmeCostRequest + opmeCostResponse;
        totalGeralPSA += psaCostRequest;
        totalGeralProcedure += procedureCostResponse;
        quantidadeTotal++;

        // Agrupar por RM
        if (!custosPorRM[regionId]) {
          custosPorRM[regionId] = {
            id: regionId,
            name: regionName,
            totalOPME: 0,
            totalPSA: 0,
            totalProcedure: 0,
            totalTicket: 0,
            totalGeral: 0,
            quantidadeSolicitacoes: 0,
            custoMedio: 0,
            detalhes: []
          };
        }

        custosPorRM[regionId].totalOPME += opmeCostRequest + opmeCostResponse;
        custosPorRM[regionId].totalPSA += psaCostRequest;
        custosPorRM[regionId].totalProcedure += procedureCostResponse;
        custosPorRM[regionId].totalTicket += ticketCostResponse;
        custosPorRM[regionId].totalGeral += totalSolicitacao;
        custosPorRM[regionId].quantidadeSolicitacoes++;

        // Agrupar por OM
        if (!custosPorOM[orgId]) {
          custosPorOM[orgId] = {
            id: orgId,
            name: orgName,
            regionName: regionName,
            totalOPME: 0,
            totalPSA: 0,
            totalProcedure: 0,
            totalTicket: 0,
            totalGeral: 0,
            quantidadeSolicitacoes: 0,
            custoMedio: 0,
            detalhes: []
          };
        }

        custosPorOM[orgId].totalOPME += opmeCostRequest + opmeCostResponse;
        custosPorOM[orgId].totalPSA += psaCostRequest;
        custosPorOM[orgId].totalProcedure += procedureCostResponse;
        custosPorOM[orgId].totalTicket += ticketCostResponse;
        custosPorOM[orgId].totalGeral += totalSolicitacao;
        custosPorOM[orgId].quantidadeSolicitacoes++;

        // Adicionar detalhes da solicitação
        const detalhe = {
          requestId: request.id,
          cbhpmCode: request.cbhpmCode,
          opmeCostRequest,
          psaCostRequest,
          opmeCostResponse,
          procedureCostResponse,
          ticketCostResponse,
          totalSolicitacao,
          createdAt: request.createdAt
        };

        custosPorRM[regionId].detalhes.push(detalhe);
        custosPorOM[orgId].detalhes.push(detalhe);
      });

      // Calcular custos médios
      Object.values(custosPorRM).forEach((rm: any) => {
        rm.custoMedio = rm.quantidadeSolicitacoes > 0 ? rm.totalGeral / rm.quantidadeSolicitacoes : 0;
      });

      Object.values(custosPorOM).forEach((om: any) => {
        om.custoMedio = om.quantidadeSolicitacoes > 0 ? om.totalGeral / om.quantidadeSolicitacoes : 0;
      });

      // Converter para arrays e ordenar
      const custosPorRMArray = Object.values(custosPorRM)
        .sort((a: any, b: any) => b.custoMedio - a.custoMedio);

      const custosPorOMArray = Object.values(custosPorOM)
        .sort((a: any, b: any) => b.custoMedio - a.custoMedio);

      // Calcular totais e médias gerais
      const totalGeralSolicitacoes = totalGeralOPME + totalGeralPSA + totalGeralProcedure + totalGeralTicket;
      const custoMedioGeral = quantidadeTotal > 0 ? totalGeralSolicitacoes / quantidadeTotal : 0;

      return res.status(200).json({
        custosPorRM: custosPorRMArray,
        custosPorOM: custosPorOMArray,
        resumoGeral: {
          totalOPME: totalGeralOPME,
          totalPSA: totalGeralPSA,
          totalProcedure: totalGeralProcedure,
          totalTicket: totalGeralTicket,
          totalGeral: totalGeralSolicitacoes,
          quantidadeSolicitacoes: quantidadeTotal,
          custoMedio: custoMedioGeral
        },
        periodo: {
          inicio: startDate || null,
          fim: endDate || null
        },
        filtros: {
          regioes: selectedRegions,
          organizacoes: selectedOrganizations
        }
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas de custos das solicitações:', error);
      return res.status(500).json({ 
        message: 'Erro ao buscar estatísticas de custos das solicitações',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
