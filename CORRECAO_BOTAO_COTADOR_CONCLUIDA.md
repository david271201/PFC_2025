# CORREÇÃO: Botão "Devolver para Correção" para COTADOR - CONCLUÍDA

## 🎯 PROBLEMA IDENTIFICADO
O botão "Devolver para correção" não aparecia para usuários com role COTADOR na página `/solicitacoes/recebidas/[requestResponseId]`.

## 🔍 CAUSA RAIZ
No arquivo `/pages/solicitacoes/recebidas/[requestResponseId].tsx`, linha 372, havia uma exclusão explícita para o role COTADOR:

```tsx
{isStatusForRole(requestResponse?.status, role) &&
  role !== Role.COTADOR && (  // ← Esta linha excluía COTADOR
    <form>
      {/* Formulário com botão "Devolver para correção" */}
    </form>
  )}
```

## ✅ SOLUÇÃO IMPLEMENTADA
**Arquivo modificado:** `/pages/solicitacoes/recebidas/[requestResponseId].tsx`

**Mudança:** Removida a exclusão explícita do role COTADOR
```tsx
// ANTES:
{isStatusForRole(requestResponse?.status, role) &&
  role !== Role.COTADOR && (

// DEPOIS:
{isStatusForRole(requestResponse?.status, role) && (
```

## 🔧 VALIDAÇÃO TÉCNICA

### 1. Permissões do COTADOR
✅ O role COTADOR possui a permissão `requests:update` necessária:
```typescript
// /src/permissions/roles/cotador.ts
const permissionsArray: Permission[] = [
  'files:download',
  'requests:create',
  'requests:read',
  'requests:update', // ← Permissão necessária presente
];
```

### 2. Status Transitions
✅ O COTADOR tem permissão para agir no status `AGUARDANDO_COTACAO`:
```typescript
// /src/permissions/utils.ts
[RequestStatus.AGUARDANDO_COTACAO]: {
  nextStatus: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_3,
  previousStatus: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_2,
  requiredRole: Role.COTADOR, // ← COTADOR é o role responsável
},
```

### 3. Função isStatusForRole
✅ A função `isStatusForRole` retorna `true` para COTADOR quando status = `AGUARDANDO_COTACAO`

### 4. API de Correção
✅ A API `/api/requests/[requestId]/correction.ts` já permite correções do COTADOR:
- Verifica se `currentTransition.requiredRole === role` (✅ COTADOR para AGUARDANDO_COTACAO)
- Verifica permissão `requests:update` (✅ COTADOR possui)

## 🎯 COMPORTAMENTO ESPERADO

### Para usuários COTADOR:
1. **Status `AGUARDANDO_COTACAO`** → Botão "Devolver para correção" **APARECE**
2. **Outros status** → Botão "Devolver para correção" **NÃO APARECE** (comportamento correto)

### Para outros roles:
- Comportamento inalterado, funciona conforme `isStatusForRole()`

## 📝 ARQUIVOS IMPACTADOS
- ✅ `/pages/solicitacoes/recebidas/[requestResponseId].tsx` - Removida exclusão do COTADOR
- ✅ `/src/permissions/roles/cotador.ts` - Já possui permissão necessária
- ✅ `/src/permissions/utils.ts` - Status transitions já corretos
- ✅ `/pages/api/requests/[requestId]/correction.ts` - API já funcional

## 🚀 STATUS
**✅ CORREÇÃO CONCLUÍDA E TESTADA**

O botão "Devolver para correção" agora aparece corretamente para usuários COTADOR quando o status da solicitação for `AGUARDANDO_COTACAO`.

---
*Correção implementada em: 28 de setembro de 2025*
*Desenvolvedor: Sistema de IA GitHub Copilot*
