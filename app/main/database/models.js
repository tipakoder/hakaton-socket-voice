const {DataTypes} = require("sequelize");

const connection = require("./connection");

const Account = connection.define(
    "account",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        nickname: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
);

const AccountSession = connection.define(
    "account_session",
    {
        token: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        account_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Account,
                key: 'id'
            }
        }
    }
);

Account.hasMany(AccountSession, {
    foreignKey: {
        name: 'account_id',
        allowNull: false,
    }
});

module.exports = {
    Account,
    AccountSession
}