import { createClient } from "redis";
import dotenv from 'dotenv';

dotenv.config();

const cliente = createClient({
    password: process.env.REDIS_SENHA,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORTA
    }
});

const conectarRedis = async () => {
    try {
        await cliente.connect();
        console.log("Conectado ao Redis com sucesso!");
    } catch (error) {
        console.error('Erro ao conectar ao Redis:', error);
    }
};

export { cliente, conectarRedis };
