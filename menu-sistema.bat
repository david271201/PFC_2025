@echo off
color 0A
title Sistema PFC 2025 - Menu de Inicialização
cls

:MENU
echo =====================================================
echo            SISTEMA PFC 2025 - DSAU
echo =====================================================
echo.
echo  [1] Iniciar aplicacao (modo desenvolvimento)
echo  [2] Atualizar dependencias (npm install)
echo  [3] Verificar banco de dados (prisma migrate)
echo  [4] Compilar para producao (npm run build)
echo  [5] Iniciar em modo producao
echo  [6] Sair
echo.
echo =====================================================
set /p opcao=Escolha uma opcao: 

if "%opcao%"=="1" goto INICIAR_DEV
if "%opcao%"=="2" goto ATUALIZAR_DEPS
if "%opcao%"=="3" goto VERIFICAR_DB
if "%opcao%"=="4" goto COMPILAR_PROD
if "%opcao%"=="5" goto INICIAR_PROD
if "%opcao%"=="6" goto SAIR
goto MENU

:INICIAR_DEV
cls
echo =====================================================
echo         INICIANDO APLICACAO (DESENVOLVIMENTO)
echo =====================================================
echo.
echo Verificando dependencias...

if not exist "node_modules" (
    echo Dependencias nao encontradas. Instalando...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Erro ao instalar dependencias.
        pause
        goto MENU
    )
    echo Dependencias instaladas com sucesso!
)

echo.
echo Iniciando o servidor de desenvolvimento...
echo O navegador sera aberto automaticamente em alguns segundos.
echo Para encerrar o servidor, pressione CTRL+C nesta janela.
echo.

REM Inicia o servidor e aguarda para abrir o navegador
start "" cmd /c "npm run dev"
timeout /t 5 /nobreak > nul
start http://localhost:3000

echo.
echo Se o navegador nao abrir automaticamente, acesse: http://localhost:3000
echo.
echo Pressione qualquer tecla para voltar ao menu...
pause > nul
goto MENU

:ATUALIZAR_DEPS
cls
echo =====================================================
echo              ATUALIZANDO DEPENDENCIAS
echo =====================================================
echo.
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao atualizar dependencias.
) else (
    echo Dependencias atualizadas com sucesso!
)
echo.
pause
goto MENU

:VERIFICAR_DB
cls
echo =====================================================
echo             VERIFICANDO BANCO DE DADOS
echo =====================================================
echo.
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao gerar cliente Prisma.
    pause
    goto MENU
)

echo.
echo [1] Verificar estado das migrations
echo [2] Aplicar migrations pendentes (migrate dev)
echo [3] Resetar banco de dados (migrate reset)
echo [4] Voltar ao menu principal
echo.
set /p db_opcao=Escolha uma opcao: 

if "%db_opcao%"=="1" (
    call npx prisma migrate status
) else if "%db_opcao%"=="2" (
    call npx prisma migrate dev
) else if "%db_opcao%"=="3" (
    echo AVISO: Esta operacao ira apagar todos os dados do banco. Continuar? (S/N)
    set /p confirmar=
    if /i "%confirmar%"=="S" (
        call npx prisma migrate reset --force
    )
) else if "%db_opcao%"=="4" (
    goto MENU
)
echo.
pause
goto MENU

:COMPILAR_PROD
cls
echo =====================================================
echo            COMPILANDO PARA PRODUCAO
echo =====================================================
echo.
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao compilar para producao.
) else (
    echo Aplicacao compilada com sucesso!
)
echo.
pause
goto MENU

:INICIAR_PROD
cls
echo =====================================================
echo          INICIANDO APLICACAO (PRODUCAO)
echo =====================================================
echo.
echo Verificando se a aplicacao foi compilada...
if not exist ".next" (
    echo Aplicacao nao compilada. Compilando agora...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo Erro ao compilar para producao.
        pause
        goto MENU
    )
)

echo.
echo Iniciando o servidor em modo producao...
echo O navegador sera aberto automaticamente em alguns segundos.
echo Para encerrar o servidor, pressione CTRL+C nesta janela.
echo.

REM Inicia o servidor de produção
start "" cmd /c "npm run start"
timeout /t 3 /nobreak > nul
start http://localhost:3000

echo.
echo Se o navegador nao abrir automaticamente, acesse: http://localhost:3000
echo.
echo Pressione qualquer tecla para voltar ao menu...
pause > nul
goto MENU

:SAIR
cls
echo Encerrando...
timeout /t 1 /nobreak > nul
exit
