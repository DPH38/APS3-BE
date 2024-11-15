# APS3 - EXER 1

Este projeto consiste em um sistema de monitoramento de criptomoedas utilizando Node.js, Express, Sequelize, Redis e MariaDB. O sistema permite buscar cotações de criptomoedas e armazenar os dados em um banco de dados MariaDB e em um cache Redis.

## Estrutura do Projeto

- `app.js`: Arquivo principal que configura e inicia o servidor Express.
- `cripto.js`: Modelo Sequelize para a tabela de criptomoedas.
- `db.js`: Configuração e conexão com o banco de dados MariaDB.
- `redisClient.js`: Configuração e conexão com o Redis.
- `.env`: Arquivo de configuração com variáveis de ambiente.

## Dependências

- Node.js
- Express
- Sequelize
- MariaDB
- Redis
- Axios
- Dotenv

## Configuração do Banco de Dados

### Criar o Banco de Dados no MariaDB

Caso o código falhe ao criar o banco de dados automaticamente, você pode criar o banco de dados manualmente pelo terminal:

1. Acesse o terminal do MariaDB:

    ```sh
    mysql -u root -p
    ```

2. Crie o banco de dados:

    ```sql
    CREATE DATABASE crypto;
    ```

3. Saia do terminal do MariaDB:

    ```sql
    EXIT;
    ```

## Principais Módulos e Funções

### `app.js`

- Configura e inicia o servidor Express.
- Define as rotas para buscar cotações de criptomoedas e armazenar os dados.

#### Rotas

1. **`GET /coins`**
    - **Função**: Solicita a lista de todas as criptomoedas disponíveis na API CoinGecko.
    - **Funcionamento**: Faz uma requisição à API CoinGecko para obter a lista de criptomoedas e salva a lista em um arquivo `coins.json`.
    - **Código**:

    ```js
    app.get('/coins', async (req, res) => {
        const options = {
            method: 'GET',
            url: 'https://api.coingecko.com/api/v3/coins/list',
            headers: { accept: 'application/json', 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
        };

        try {
            const response = await axios.request(options);
            const data = response.data;
            fs.writeFileSync('coins.json', JSON.stringify(data, null, 2));
            res.json(data);
        } catch (err) {
            console.error("Erro ao fazer a requisição:", err);
            res.status(500).json({ mensagem: "Erro ao obter a lista de moedas", error: err.message });
        }
    });
    ```

2. **`GET /price/:name`**
    - **Função**: Solicita a cotação de uma criptomoeda específica pelo nome.
    - **Funcionamento**: Verifica se a cotação está em cache no Redis. Se não estiver, faz uma requisição à API CoinGecko para obter a cotação e armazena os dados no Redis e no banco de dados MariaDB.
    - **Código**:

    ```js
    app.get('/price/:name', async (req, res) => {
        const { name } = req.params;

        if (!fs.existsSync('coins.json')) {
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

        let coins;
        try {
            const coinsData = fs.readFileSync('coins.json');
            coins = JSON.parse(coinsData);
        } catch (err) {
            console.error("Erro ao ler o arquivo coins.json:", err);
            return res.status(500).json({ mensagem: "Erro ao ler o arquivo de moedas", error: err.message });
        }

        const coin = coins.find(coin => coin.name.toLowerCase() === name.toLowerCase());
        if (!coin) {
            return res.status(404).json({ mensagem: "Nome inexistente" });
        }

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
            await cliente.setEx(name, 300, JSON.stringify(data));
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
    ```

3. **`GET /ping`**
    - **Função**: Verifica a conectividade com o Redis.
    - **Funcionamento**: Faz um ping no Redis para verificar se está online.
    - **Código**:

    ```js
    app.get('/ping', async (req, res) => {
        try {
            const resposta = await cliente.ping();
            res.json({ mensagem: "Redis está online", resposta });
        } catch (error) {
            console.error("Erro ao executar ping", error);
            res.status(500).json({ mensagem: "Erro ao conectar ao Redis", error });
        }
    });
    ```

#### Inicialização do Servidor

- **Código**:

```js
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});

### `cripto.js`

- Define o modelo Sequelize para a tabela de criptomoedas.
- Campos: `moeda`, `sigla`, `preco`, `dataConsulta`.

### `db.js`

- Configura a conexão com o banco de dados MariaDB.
- Função `createDatabase`: Cria o banco de dados se ele não existir.

### `redisClient.js`

- Configura a conexão com o Redis.
- Função `conectarRedis`: Conecta ao Redis.

## Executando o Projeto

1. Instale as dependências:

    ```sh
    npm install
    ```

2. Configure as variáveis de ambiente no arquivo `.env`.

3. Inicie o servidor:

    ```sh
    node app.js
    ```

4. Acesse o servidor no navegador:

    ```sh
    http://localhost:3000
    ```

## Observações

- Certifique-se de que o Redis e o MariaDB estejam em execução.
- Verifique as variáveis de ambiente no arquivo `.env` para garantir que estão corretas.
