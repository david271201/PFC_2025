######### 15 de outubro de 2024 #########

###### LEIA APENAS APÓS EXECUTAR TODOS OS PASSOS DO DOCUMENTO DE INSTALAÇÃO ######

# SisReBEx

Este documento tem por finalidade servir de guia para os desenvolvedores para o primeiro uso do projeto de PFC do IME feito junto à D Sau, apelidado internamente de SisReBEx (Sistema de Regulação de Beneficiários do Exército), após a sua configuração em ambiente local.

## Acessar o projeto

Após rodar o projeto com o comando ```npm run dev```, conforme descrito no documento de instalação, basta ir para localhost:3000 no navegador.

## Login

A primeira tela é a de login.

As diversas credenciais cadastradas se encontram no banco de dados que foi populado na etapa de instalação ou no arquivo prisma/scripts/populate/users.ts.

Os emails seguem o formato "[função]@[om/rm/dsau].com". Por exemplo, o email de login do usuário Chefe Fusex do HCE é dado por: chefefusex@hce.com.
Todas as senhas padrão são "admin".
Recomenda-se olhar o banco de dados para entender com clareza os logins de cada usuário

## Criação e gerenciamento de solicitações

Praticamente o projeto inteiro lida com essa parte de forma muito análoga entre as funções, reaproveitando componentes.

Apenas o OPERADOR FUSEX consegue criar solicitações, com um botão específico no canto direito superior da tela inicial (/solicitacoes). Na rota "/solicitações/criar", basta preencher os campos e criar.

O gerenciamento das solicitações é feito no caminho "/solicitacoes", podendo observar as pendências para aquele usuário e as enviadas (que já passaram por ele).

Recomenda-se fortemente a leitura das seções 3.3 e 3.4 do relatório de PFC para entender com clareza os fluxos e possibilidades para cada tipo de usuário, além da Figura 1 que apresenta o fluxo principal de uma solicitação, desde sua criação até sua aprovação final.

## Visualização de estatísticas

Para o usuário SUBDIRETOR DE SAÚDE, há também a aba de estatísticas, em "/estatisticas". Nela, o subdiretor pode analisar algumas estatísticas que foram alinhadas com a D Sau que são relevantes, além de filtrar por região e/ou organização.