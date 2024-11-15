import express from 'express';
import { cliente, conectarRedis } from './redisClient.js';

const app = express();

// conectar ao Redis
conectarRedis();

// rota para ping
app.get('/ping', async (req, res) => {
    try {
        const resposta = await cliente.ping();
        res.json({ mensagem: "Redis está online", resposta });
    } catch (error) {
        console.error("Erro ao executar ping", error);
        res.status(500).json({ mensagem: "Erro ao conectar ao Redis", error });
    }
});

// iniciar o servidor
const PORTA = process.env.PORTA || 3000;
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
