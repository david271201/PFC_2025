@echo off
echo =====================================
echo    Iniciando Sistema PFC 2025 DSAU
echo =====================================
echo.

REM Mudar para o diretório do projeto
cd /d "%~dp0"

REM Verificar se o Node.js está instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js nao esta instalado!
    echo Por favor, instale o Node.js antes de continuar.
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo Primeira execucao detectada. Configurando ambiente...
    echo Instalando dependencias... (pode demorar alguns minutos)
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERRO: Falha ao instalar dependencias.
        pause
        exit /b 1
    )
    echo Dependencias instaladas com sucesso!
)

REM Verificar banco de dados
if not exist "prisma\dev.db" (
    echo Configurando banco de dados...
    call npx prisma migrate dev --name initial
    if %ERRORLEVEL% NEQ 0 (
        echo ERRO: Falha ao configurar banco de dados.
        pause
        exit /b 1
    )
)

echo.
echo Iniciando aplicacao...
echo Aguarde, o navegador sera aberto automaticamente em alguns segundos.
echo.

REM Iniciar o servidor Next.js
start "" cmd /c "npm run dev"

REM Aguardar o servidor iniciar
echo Aguardando servidor iniciar...
timeout /t 5 /nobreak > nul

REM Abrir navegador padrão
echo Abrindo navegador...
start http://localhost:3000

echo.
echo =====================================
echo    Sistema PFC 2025 DSAU iniciado!
echo =====================================
echo.
echo Para acessar o sistema: http://localhost:3000
echo Para encerrar o sistema, feche esta janela e a janela do servidor.
echo.

pause
