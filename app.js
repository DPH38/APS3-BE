import express from "express";
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import { cliente, conectarRedis } from './redisClient.js';
import Crypto from './cripto.js'; // Importe o modelo Crypto

dotenv.config();
const app = express();
const PORTA = process.env.PORTA || 3000;

// Conectar ao Redis
conectarRedis();

// Rota para solicitar a lista de opções
app.get('/coins', async (req, res) => {
    const options = {
        method: 'GET',
        url: 'https://api.coingecko.com/api/v3/coins/list',
        headers: { accept: 'application/json', 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
    };

    try {
        const response = await axios.request(options);
        const data = response.data;

        // Salvar a lista em JSON
        fs.writeFileSync('coins.json', JSON.stringify(data, null, 2));

        res.json(data);
    } catch (err) {
        console.error("Erro ao fazer a requisição:", err);
        res.status(500).json({ mensagem: "Erro ao obter a lista de moedas", error: err.message });
    }
});

// Rota para requisitar a cotação por nome
app.get('/price/:name', async (req, res) => {
    const { name } = req.params;

    // Verificar se o arquivo coins.json existe
    if (!fs.existsSync('coins.json')) {
        // Chamar a rota /coins para salvar o arquivo
        try {
            const options = {
                method: 'GET',
                url: 'http://localhost:3000/coins',
                headers: { accept: 'application/json' }
            };
            await axios.request(options);
        } catch (err) {
            console.error("Erro ao obter a lista de moedas:", err);
            return res.status(500).json({ mensagem: "Erro ao obter a lista de moedas", error: err.message });
        }
    }

    // Ler o arquivo coins.json
    let coins;
    try {
        const coinsData = fs.readFileSync('coins.json');
        coins = JSON.parse(coinsData);
    } catch (err) {
        console.error("Erro ao ler o arquivo coins.json:", err);
        return res.status(500).json({ mensagem: "Erro ao ler o arquivo de moedas", error: err.message });
    }

    // Verificar se o nome existe no arquivo coins.json
    const coin = coins.find(coin => coin.name.toLowerCase() === name.toLowerCase());
    if (!coin) {
        return res.status(404).json({ mensagem: "Nome inexistente" });
    }

    // Verificar o cache no Redis
    try {
        const cachedPrice = await cliente.get(name);
        if (cachedPrice) {
            return res.json({ source: 'redis', data: JSON.parse(cachedPrice) });
        }
    } catch (err) {
        console.error("Erro ao verificar o cache no Redis:", err);
    }

    const options = {
        method: 'GET',
        url: 'https://api.coingecko.com/api/v3/simple/price',
        headers: { accept: 'application/json', 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY },
        params: {
            ids: coin.id,
            vs_currencies: 'usd'
        }
    };

    try {
        const response = await axios.request(options);
        const data = response.data;

        // Armazenar no Redis por 5 minutos
        await cliente.setEx(name, 300, JSON.stringify(data));

        // Armazenar no banco de dados
        await Crypto.create({
            moeda: coin.name,
            sigla: coin.symbol,
            preco: data[coin.id].usd,
            dataConsulta: new Date()
        });

        res.json({ source: 'api', data });
    } catch (err) {
        console.error("Erro ao fazer a requisição:", err);
        res.status(500).json({ mensagem: "Erro ao obter a cotação", error: err.message });
    }
});

// Iniciar o servidor
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});