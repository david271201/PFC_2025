# 🩺 Sistema de Gerenciamento de Pacientes - Guia de Uso

## 🚀 Acesso ao Sistema

### **Login**
- **URL**: `http://localhost:3001`
- **Usuário**: `subdiretor@teste.com`
- **Senha**: `123456`

### **Página de Pacientes**
- **URL Direta**: `http://localhost:3001/admin/pacients`
- **Menu**: Clicar em "Pacientes" no menu superior (verde)

---

## 📋 Funcionalidades Disponíveis

### **1. Visualização de Pacientes**
- ✅ Lista todos os pacientes cadastrados
- ✅ Mostra: Nome, CPF (formatado), Prec CP, Posto/Graduação, Tipo, Nº Solicitações
- ✅ **3 pacientes de exemplo** já cadastrados:
  - Fulano da Silva (Aspirante a Oficial)
  - Ciclano de Souza (Primeiro Tenente)  
  - Beltrano de Oliveira (Tenente-Coronel)

### **2. Busca e Filtros**
- 🔍 **Campo de Busca**: Digite nome, CPF, Prec CP ou posto/graduação
- 🏷️ **Filtro Tipo**: Selecione "Titular", "Dependente" ou "Todos"
- 📄 **Itens por página**: Escolha 10, 25, 50 ou 100 registros

### **3. Ordenação**
Clique nos cabeçalhos das colunas para ordenar por:
- 📝 Nome (A-Z / Z-A)
- 🆔 CPF
- 🎖️ Posto/Graduação
- 📊 Número de Solicitações

### **4. Criar Novo Paciente**
1. Clique no botão **"Novo Paciente"** (azul)
2. Preencha os campos obrigatórios (*):
   - **Nome**: Nome completo
   - **CPF**: Será formatado automaticamente (000.000.000-00)
   - **Prec CP**: Código único
   - **Posto/Graduação**: Exemplo: "Soldado", "Cabo", "Sargento"
   - **É dependente**: Marque se for dependente
3. Clique **"Criar"**

### **5. Editar Paciente**
1. Clique em **"Editar"** na linha do paciente
2. Modifique os campos necessários
   - ⚠️ **CPF não pode ser alterado**
3. Clique **"Atualizar"**

### **6. Excluir Paciente**
1. Clique em **"Excluir"** na linha do paciente
2. Confirme a exclusão
   - ⚠️ **Não é possível excluir** pacientes com solicitações associadas

---

## ⚠️ Validações e Regras

### **Campos Obrigatórios**
- ✅ Nome (não pode estar vazio)
- ✅ CPF (deve ter exatamente 11 dígitos)
- ✅ Prec CP (não pode estar vazio)
- ✅ Posto/Graduação (não pode estar vazio)

### **Regras de Unicidade**
- 🔒 **CPF**: Deve ser único no sistema
- 🔒 **Prec CP**: Deve ser único no sistema

### **Proteções**
- 🛡️ Pacientes com solicitações não podem ser excluídos
- 🛡️ CPF não pode ser alterado após criação
- 🛡️ Apenas usuários SUBDIRETOR_SAUDE têm acesso

---

## 🎨 Interface

### **Cores e Status**
- 🟢 **Verde**: Titular
- 🔵 **Azul**: Dependente
- 🔴 **Vermelho**: Botões de exclusão
- 🟡 **Amarelo**: Avisos e validações

### **Paginação**
- Navegue pelas páginas na parte inferior
- Veja total de registros
- Escolha quantos itens mostrar por página

### **Responsivo**
- ✅ Funciona em desktop, tablet e mobile
- ✅ Tabela rolável horizontalmente em telas pequenas

---

## 🔧 Solução de Problemas

### **Erro "Usuário não autenticado"**
- Faça login novamente em: `http://localhost:3001`

### **Página não carrega**
- Verifique se o servidor está rodando na porta 3001
- Confirme se está logado como SUBDIRETOR_SAUDE

### **Erro ao criar paciente**
- Verifique se CPF tem 11 dígitos
- Confirme se CPF/Prec CP não existem no sistema
- Preencha todos os campos obrigatórios

### **Não consegue excluir**
- Verifique se paciente não tem solicitações associadas
- Apenas pacientes sem histórico podem ser removidos

---

## 📊 Dados de Teste

### **Pacientes Existentes**
```
1. Fulano da Silva
   CPF: 123.456.789-01
   Prec CP: 123456789
   Posto: Aspirante a Oficial
   Tipo: Titular

2. Ciclano de Souza
   CPF: 123.456.789-02
   Prec CP: 123456780
   Posto: Primeiro Tenente
   Tipo: Titular

3. Beltrano de Oliveira
   CPF: 123.456.789-03
   Prec CP: 123456781
   Posto: Tenente-Coronel
   Tipo: Titular
```

### **Exemplos para Teste**
```
Nome: José da Silva Santos
CPF: 98765432100
Prec CP: CP987654
Posto: Cabo
Dependente: Não

Nome: Maria Santos Silva (Dependente)
CPF: 11122233344
Prec CP: CP112233
Posto: Dependente
Dependente: Sim
```

---

## ✅ Sistema Pronto para Uso!

🎯 **O sistema de pacientes está totalmente funcional e substituiu com sucesso o antigo sistema de clientes, seguindo o padrão estabelecido pela página de organizações.**
