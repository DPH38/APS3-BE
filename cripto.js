

import { DataTypes } from "sequelize";
import sequelize from './db.js';

const Crypto = sequelize.define('Crypto', {
    moeda: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sigla: {
        type: DataTypes.STRING,
        allowNull: false
    },
    preco: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    dataConsulta: {
        type: DataTypes.DATE,
        allowNull: false
    }
},
    {
        timestamps: true // Adiciona automaticamente os campos createdAt e updatedAt
});

export default Crypto;