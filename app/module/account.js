const bcrypt = require("bcrypt");

const {Account, AccountSession, ChangePasswordRequest} = require("../main/database/models");
const ApiError = require("../main/apiError");

/**
 * Create session by id and current time
 * @param account_id
 * @return {*}
 */
const createSession = async(account_id) => {
    const token = bcrypt.hashSync(`${account_id}.${Date.now()}`, 2);

    const regAccountSession = await AccountSession.create(
        {
            token,
            account_id
        }
    );

    if(!regAccountSession)
        throw new ApiError(500, "Account session registration");

    return token;
}

/**
 * Generate number code
 * @param length
 */
const generatorCode = (length = 6) => {
    const chars = "0123456789";
    let result = "";
    for(let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * (chars.length + 1))];
    }
    return result;
}

/**
 * Registration account
 * @param req
 * @return {Promise<{id, token}>}
 */
const registration = async (req) => {
    const nickname = req.query.nickname;
    const email = req.query.email;
    const password = req.query.password;

    if(typeof nickname === "undefined")
        throw new ApiError(400, "Nickname undefined");

    if(nickname.length < 4)
        throw new ApiError(400, "Nickname less 4 symbols");

    if(await Account.findOne({where: {nickname}}))
        throw new ApiError(400, "Nickname already used");

    if(typeof email === "undefined")
        throw new ApiError(400, "Email undefined");

    if(await Account.findOne({where: {email}}))
        throw new ApiError(400, "Email already used");

    if(!(/(.+)@(\w+)\.(\w+)/.test(email)))
        throw new ApiError(400, "Email incorrect");

    if(typeof password === "undefined")
        throw new ApiError(400, "Password undefined");

    if(password.length < 6)
        throw new ApiError(400, "Password less 6 symbols");

    const password_hash = bcrypt.hashSync(password, 2);

    const accountCreate = await Account.create(
        {
            nickname,
            email,
            password: password_hash
        }
    );

    if(accountCreate) {
        const id = accountCreate.dataValues.id;
        const token = await createSession(id);

        return {
            id,
            token
        }
    }

    throw new ApiError(500, "Something error database");
}

/**
 * Authorization
 * @param req
 * @return {Promise<void>}
 */
const auth = async(req) => {
    const login = req.query.login;
    const password = req.query.password;

    if(typeof login === "undefined")
        throw new ApiError(400, "Login undefined");

    let accountByLogin;
        if(!(accountByLogin = await Account.findOne({where: {nickname: login}}))) {
            if(!(accountByLogin = await Account.findOne({where: {email: login}})))
            throw new ApiError(400, "Account with input login not found");
    }

    if(!bcrypt.compareSync(password, accountByLogin.dataValues.password))
        throw new ApiError(400, "Password incorrect");

    const id = accountByLogin.dataValues.id;
    const token = await createSession(id);

    return {
        id,
        token
    }
}

/**
 * Verify token
 * @param req
 * @return {Promise<void>}
 */
const verifyToken = async(req) => {
    const token = req.headers.token || req.query.token;

    if(!token)
        throw ApiError.forbidden();

    const account = await Account.findOne(
        {
            include: {
                model: AccountSession,
                where: {
                    token
                }
            }
        }
    );

    if(!account)
        throw ApiError.forbidden();

    delete account.dataValues.account_sessions;

    return account.dataValues;
}

/**
 * Change password request
 * @return {Promise<void>}
 */
const changePasswordRequest = async(req) => {
    const login = req.query.login;
    let code = generatorCode(6);

    let accountByLogin;
    if(!(accountByLogin = await Account.findOne({where: {nickname: login}}))) {
        if(!(accountByLogin = await Account.findOne({where: {email: login}})))
            throw new ApiError(400, "Account with input login not found");
    }

    code += accountByLogin.dataValues.id;

    const createRequest = await ChangePasswordRequest.create(
        {
            account_id: accountByLogin.id,
            code
        }
    );

    if(!createRequest)
        throw new ApiError(500, "Something error create request");

    return {
        request_id: createRequest.dataValues.id,
        code,
        message: "т.к. почты нет, код выводим прямо сюда"
    };
}

/**
 * Change password based on request
 * @param req
 * @return {Promise<void>}
 */
const changePassword = async(req) => {
    const code = req.query.code;
    const password = req.query.password;

    const existsRequest = await ChangePasswordRequest.findOne(
        {
            where: {
                code
            }
        }
    );

    if(!existsRequest)
        throw new ApiError(400, "Code is not available");

    const account = await Account.findByPk(existsRequest.dataValues.account_id);

    if(bcrypt.compareSync(password, account.password))
        throw new ApiError(400, "New password compare with old");

    if(!await existsRequest.destroy())
        throw new ApiError(500, "Wtf? Something crashes");

    const updatePassword = await Account.update(
        {
            password: bcrypt.hashSync(password, 2)
        },
        {
            where: {
                id: account.id
            }
        }
    );

    if(!updatePassword)
        throw new ApiError(500, "Wtf? Something crashes #2");

    return {};
}

/**
 * Get list account by filter
 * @param req
 * @return {Promise<void>}
 */
const getList = async(req) => {
    const account = await verifyToken(req);
    let filter = req.body.filter;

    if(typeof filter === "undefined" || !filter) {
        filter = {};
    } else {
        try{
            filter = JSON.parse(filter);
        } catch (e) {
            throw new ApiError(400, "Filter is not JSON");
        }
    }

    const getListResult = await Account.findAll(
        {
            attributes: [
                "id",
                "nickname"
            ],
            where: filter
        }
    );

    if(!getListResult)
        return {
            accounts: []
        };

    return {
        accounts: getListResult
    }
}

module.exports = {
    registration,
    auth,
    verifyToken,
    changePasswordRequest,
    changePassword,
    getList
}