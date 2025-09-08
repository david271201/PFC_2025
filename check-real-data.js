const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco SQLite
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

console.log('=== VERIFICAÇÃO DADOS REAIS DO BANCO ===\n');
console.log(`Conectando ao banco: ${dbPath}\n`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar com o banco:', err);
    return;
  }
  
  console.log('Conectado ao banco SQLite.\n');
  
  // Verificar requests com OPME
  db.all(`
    SELECT 
      r.id,
      r.opmeCost,
      r.psaCost,
      u.name as userName,
      o.name as orgName,
      reg.name as regionName
    FROM Request r
    LEFT JOIN User u ON r.userId = u.id
    LEFT JOIN Organization o ON u.organizationId = o.id
    LEFT JOIN Region reg ON o.regionId = reg.id
    WHERE r.opmeCost IS NOT NULL AND r.opmeCost > 0
    ORDER BY r.id
  `, (err, requests) => {
    if (err) {
      console.error('Erro ao buscar requests:', err);
      return;
    }
    
    console.log('REQUESTS COM CUSTO OPME:');
    let totalOpmeRequests = 0;
    requests.forEach(req => {
      console.log(`  Request ${req.id}: OPME=${req.opmeCost} (R$ ${(req.opmeCost/1000).toFixed(2)}), PSA=${req.psaCost || 0}, Região=${req.regionName}, Org=${req.orgName}`);
      totalOpmeRequests += req.opmeCost;
    });
    console.log(`  TOTAL OPME REQUESTS: ${totalOpmeRequests} (R$ ${(totalOpmeRequests/1000).toFixed(2)})\n`);
    
    // Verificar responses com OPME
    db.all(`
      SELECT 
        rr.id,
        rr.requestId,
        rr.opmeCost,
        rr.procedureCost,
        rr.ticketCost,
        rr.selected,
        r.id as reqId
      FROM RequestResponse rr
      LEFT JOIN Request r ON rr.requestId = r.id
      WHERE rr.opmeCost IS NOT NULL AND rr.opmeCost > 0
      ORDER BY rr.requestId, rr.id
    `, (err, responses) => {
      if (err) {
        console.error('Erro ao buscar responses:', err);
        return;
      }
      
      console.log('RESPONSES COM CUSTO OPME:');
      let totalOpmeResponses = 0;
      let totalOpmeResponsesSelected = 0;
      responses.forEach(resp => {
        console.log(`  Response ${resp.id} (Request ${resp.requestId}): OPME=${resp.opmeCost} (R$ ${(resp.opmeCost/1000).toFixed(2)}), Selected=${resp.selected ? 'SIM' : 'NÃO'}`);
        totalOpmeResponses += resp.opmeCost;
        if (resp.selected) {
          totalOpmeResponsesSelected += resp.opmeCost;
        }
      });
      console.log(`  TOTAL OPME RESPONSES: ${totalOpmeResponses} (R$ ${(totalOpmeResponses/1000).toFixed(2)})`);
      console.log(`  TOTAL OPME RESPONSES SELECTED: ${totalOpmeResponsesSelected} (R$ ${(totalOpmeResponsesSelected/1000).toFixed(2)})\n`);
      
      // Calcular total como a API faz
      const totalGeral = totalOpmeRequests + totalOpmeResponsesSelected;
      console.log('=== CÁLCULO FINAL (COMO A API) ===');
      console.log(`OPME Requests: ${totalOpmeRequests} (R$ ${(totalOpmeRequests/1000).toFixed(2)})`);
      console.log(`OPME Responses Selected: ${totalOpmeResponsesSelected} (R$ ${(totalOpmeResponsesSelected/1000).toFixed(2)})`);
      console.log(`TOTAL OPME GERAL: ${totalGeral} (R$ ${(totalGeral/1000).toFixed(2)})`);
      
      db.close((err) => {
        if (err) {
          console.error('Erro ao fechar o banco:', err);
        } else {
          console.log('\nConexão com o banco fechada.');
        }
      });
    });
  });
});
