/* eslint-disable no-console */
import fs from 'fs';
import Papa from 'papaparse';

// mudar de acordo com as colunas do csv
type FileColumns = {
  'ID do Procedimento': string;
  'Descrição do Procedimento': string;
};

// colocar caminho do arquivo aqui
const filePath = 'CBHPM 2020.csv';
// colocar também a versão do cbhpm aqui
const version = '2020';

function parseFile() {
  const file = fs.readFileSync(filePath, 'utf-8');
  Papa.parse<FileColumns>(file, {
    header: true,
    complete: (results) => {
      const data = results.data.map((row) => ({
        id: row['ID do Procedimento'],
        description: row['Descrição do Procedimento'],
        version,
      }));

      fs.writeFileSync(
        'src/data/cbhpm/codes.ts',
        `export const cbhpmInfo = ${JSON.stringify(data, null, 2)}`,
      );

      console.log('Lista CBHPM gerada com sucesso em src/data/cbhpm/codes.ts');
    },
  });
}

parseFile();
