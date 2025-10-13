/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const pacients = [
  {
    cpf: '12345678901',
    name: 'Fulano da Silva',
    precCp: '123456789',
    rank: 'Soldado',
    isDependent: false,
    dataNascimento: new Date('1990-05-15'),
    sexo: 'Masculino',
  },
  {
    cpf: '12345678902',
    name: 'Ciclano de Souza',
    precCp: '123456780',
    rank: 'Cabo',
    isDependent: false,
    dataNascimento: new Date('1985-08-22'),
    sexo: 'Masculino',
  },
  {
    cpf: '12345678903',
    name: 'Beltrana de Oliveira',
    precCp: '123456781',
    rank: 'Primeiro Sargento',
    isDependent: false,
    dataNascimento: new Date('1980-12-10'),
    sexo: 'Feminino',
  },
];

export default async function populatePacients(prisma: PrismaClient) {
  try {
    await Promise.all(
      pacients.map((pacient) => prisma.pacient.create({ data: pacient })),
    );
    console.log('Tabela Pacient populada');
  } catch (error) {
    console.log('Erro ao popular tabela Pacient', error);
  }
}
