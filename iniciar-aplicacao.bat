@echo off
echo ===================================================
echo      Iniciando Sistema PFC 2025
echo ===================================================
echo.

REM Verifica se as dependências estão instaladas
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Erro ao instalar dependencias.
        pause
        exit /b 1
    )
    echo Dependencias instaladas com sucesso!
) else (
    echo Dependencias ja instaladas.
)

echo.
echo Verificando o banco de dados...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao gerar cliente Prisma.
    pause
    exit /b 1
)

echo.
echo Iniciando o servidor de desenvolvimento...
echo O navegador sera aberto automaticamente em alguns segundos.
echo Por favor, aguarde...
echo.
echo Para encerrar o servidor, pressione CTRL+C nesta janela.
echo.

REM Inicia o servidor e aguarda 5 segundos para abrir o navegador
start "" cmd /c "npm run dev"

REM Aguarda 5 segundos para garantir que o servidor tenha tempo de iniciar
timeout /t 5 /nobreak > nul

REM Abre o navegador na página inicial
start http://localhost:3000

echo.
echo Se o navegador nao abrir automaticamente, acesse: http://localhost:3000
echo.

REM Mantém o prompt aberto
cmd /k "echo Servidor em execucao. Pressione CTRL+C para encerrar."
