// Este script pode ser adicionado à página HTML através do console do navegador
// para ajudar a depurar o problema de redirecionamento

(function() {
  // Função para obter o ID da solicitação corretamente
  function getCorrectRequestId() {
    // Verifica se estamos na página de solicitações recebidas
    const isRecebidasPage = window.location.pathname.includes('/solicitacoes/recebidas/');
    
    if (isRecebidasPage) {
      // Busca o elemento que contém o ID da solicitação na página
      const solicitacaoTitleElement = document.querySelector('h1');
      
      if (solicitacaoTitleElement) {
        const titleText = solicitacaoTitleElement.textContent || '';
        const matches = titleText.match(/Solicitação ([0-9a-f-]+)/i);
        
        if (matches && matches[1]) {
          console.log('ID da solicitação encontrado no título:', matches[1]);
          return matches[1];
        }
      }
      
      // Tenta buscar nos dados da página (pode não funcionar dependendo do estado do React)
      const reactInstanceKey = Object.keys(document.querySelector('div[class*="action-button-container"]') || {})
        .find(key => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$'));
      
      if (reactInstanceKey) {
        const reactInstance = document.querySelector('div[class*="action-button-container"]')[reactInstanceKey];
        console.log('Instância React encontrada:', reactInstance);
      }
    }
    
    return null;
  }
  
  // Tenta obter o ID correto
  const correctId = getCorrectRequestId();
  
  console.log('Depuração de redirecionamento:');
  console.log('URL atual:', window.location.href);
  console.log('pathname:', window.location.pathname);
  console.log('search params:', window.location.search);
  console.log('ID correto encontrado:', correctId);
  
  // Corrige o botão de redirecionamento se necessário
  const botaoPreencher = document.querySelector('button:contains("Preencher Formulário")');
  if (botaoPreencher && correctId) {
    console.log('Botão de preenchimento encontrado, ajustando comportamento...');
    botaoPreencher.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Redirecionando para o formulário com ID correto:', correctId);
      window.location.href = `/cadastro-med/cadastro?requestId=${correctId}`;
      
      return false;
    }, true);
  }
})();
