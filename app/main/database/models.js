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
            allowNull: false,
            unique: true
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

const Chat = connection.define(
    "chat",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            allowNull: false,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        admin_id: {
            type: DataTypes.INTEGER,
            references: {
                model: Account,
                key: "id"
            }
        }
    }
);

Account.hasMany(Chat, {
    foreignKey: {
        name: 'admin_id',
        allowNull: false,
    }
});

const ChatMember = connection.define(
    "chat_member",
    {
        chat_id: {
            type: DataTypes.INTEGER,
            references: {
                model: Chat,
                key: "id"
            }
        },
        account_id: {
            type: DataTypes.INTEGER,
            references: {
                model: Account,
                key: "id"
            }
        },
    }
);

Chat.hasMany(ChatMember, {
    foreignKey: {
        name: 'chat_id',
        allowNull: false,
    }
});

ChatMember.belongsTo(Chat, {
    foreignKey: {
        name: "chat_id",
        allowNull: false
    }
})

Account.hasMany(ChatMember, {
    foreignKey: {
        name: 'account_id',
        allowNull: false,
    }
});

ChatMember.belongsTo(Account, {
    foreignKey: {
        name: 'account_id',
        allowNull: false,
    }
});


module.exports = {
    Account,
    AccountSession,
    Chat,
    ChatMember,
    ChangePasswordRequest
}