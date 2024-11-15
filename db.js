import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Conexão inicial sem especificar o banco de dados
const sequelize = new Sequelize('crypto', process.env.DB_USUARIO, process.env.DB_SENHA, {
    host: process.env.DB_HOST,
    port: 3307,
    dialect: 'mariadb',
    dialectOptions: {
        allowPublicKeyRetrieval: true, // Permitir a recuperação da chave pública
    }
});

// Função para criar o banco de dados se ele não existir
async function createDatabase() {
    const databaseName = process.env.DB_NOME;
    try {
        await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
        console.log(`Banco de dados '${databaseName}' verificado/criado com sucesso.`);
    } catch (error) {
        console.error(`Erro ao criar/verificar o banco de dados '${databaseName}':`, error);
    }
}

// Chamar a função para criar o banco de dados e depois sincronizar os modelos
createDatabase().then(() => {
    // Reconfigurar a conexão para usar o banco de dados recém-criado
    sequelize.config.database = process.env.DB_NOME;
    sequelize.sync()
        .then(() => {
            console.log('Modelos sincronizados com sucesso.');
        })
        .catch(error => {
            console.error('Erro ao sincronizar os modelos:', error);
        });
});

export default sequelize;
