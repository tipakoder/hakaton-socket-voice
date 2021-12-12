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
        phone: {
            type: DataTypes.STRING,
            allowNull: true
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
                key: "id"
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

const ChangePasswordRequest = connection.define(
    "change_password_request",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        account_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Account,
                key: "id"
            }
        },
        code: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }
);

Account.hasMany(ChangePasswordRequest, {
    foreignKey: {
        name: 'account_id',
        allowNull: false,
    }
});

ChangePasswordRequest.belongsTo(Account, {
    foreignKey: {
        name: "account_id",
        allowNull: false
    }
});

const Contact = connection.define(
    "contact",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        account_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Account,
                key: "id"
            }
        },
        target_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Account,
                key: "id"
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true
        },
    }
)

Account.hasMany(
    Contact,
    {
        foreignKey: {
            name: 'account_id',
            allowNull: false,
        }
    }
);

Contact.belongsTo(
    Account,
    {
        foreignKey: {
            name: 'account_id',
            allowNull: false,
        }
    }
);

Account.hasMany(
    Contact,
    {
        foreignKey: {
            name: 'target_id',
            allowNull: false,
        }
    }
);

Contact.belongsTo(
    Account,
    {
        foreignKey: {
            name: 'target_id',
            allowNull: false,
        }
    }
);

module.exports = {
    Account,
    AccountSession,
    ChangePasswordRequest,
    Contact
}