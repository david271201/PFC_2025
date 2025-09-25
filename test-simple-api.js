// Teste simples para debugar problema da página de pacientes
fetch('http://localhost:3000/api/admin/pacients?page=1&limit=10')
  .then(response => {
    console.log('Status:', response.status);
    console.log('Headers:', [...response.headers.entries()]);
    return response.text();
  })
  .then(text => {
    console.log('Response text:', text);
    try {
      const data = JSON.parse(text);
      console.log('Dados parseados:', data);
      console.log('Número de pacientes:', data.pacients?.length || 0);
      if (data.pacients) {
        console.log('Pacientes:', data.pacients.map(p => `${p.name} (${p.cpf})`));
      }
    } catch (e) {
      console.log('Erro ao fazer parse do JSON:', e);
    }
  })
  .catch(error => {
    console.error('Erro na requisição:', error);
  });
