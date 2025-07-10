import { Chart as ChartJS, registerables } from 'chart.js';

// Registra todos os componentes necessários do ChartJS
ChartJS.register(...registerables);

export default ChartJS;
