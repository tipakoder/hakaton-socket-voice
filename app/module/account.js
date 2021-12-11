const bcrypt = require("bcrypt");

const {Account, AccountSession} = require("../main/database/models");
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
    if(
        !(accountByLogin = await Account.findOne({where: {nickname: login}})) ||
        !(accountByLogin = await Account.findOne({where: {email: login}}))
    )
        throw new ApiError(400, "Account with input login not found");

    if(!bcrypt.compareSync(password, accountByLogin.dataValues.password))
        throw new ApiError(400, "Password incorrect");

    const id = accountByLogin.dataValues.id;
    const token = await createSession(id);

    return {
        id,
        token
    }
}

module.exports = {
    registration,
    auth
}