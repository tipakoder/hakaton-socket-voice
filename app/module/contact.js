const {Account, Contact} = require("../main/database/models");
const ApiError = require("../main/apiError");
const {verifyToken} = require("./account");

/**
 * Create contact
 * @param req
 * @return {Promise<void>}
 */
const create = async(req) => {
    const account = await verifyToken(req);

    const phone = req.query.phone;
    let name = req.query.name;

    if(typeof phone === "undefined")
        throw new ApiError(400, "Phone undefined");

    const getAccountByPhone = await Account.findOne(
        {
            where: {
                phone
            }
        }
    );

    if(!getAccountByPhone)
        throw new ApiError(400, "Account with sent phone wasn't found");

    if(typeof name === "undefined")
        name = "";

    const createContact = await Contact.create(
        {
            account_id: account.id,
            target_id: getAccountByPhone.dataValues.id,
            name
        }
    );

    if(!createContact)
        throw new ApiError(500, "Wtf create contact");

    return {
        contact_id: createContact.dataValues.id
    };
}

/**
 * Get list contacts for account
 * @param req
 * @return {Promise<void>}
 */
const getList = async(req) => {
    const account = await verifyToken(req);

    const getListResult = await Contact.findAll(
        {
            where: {
                account_id: account.id
            }
        }
    );

    let request = [];
    if(getListResult)
        for(let result of getListResult) {
            result = result.dataValues;
            result.account = await Account.findByPk(result.target_id);
            delete result.account.password;
            request.push(result);
        }

    return {
        contacts: request
    }
}

module.exports = {
    create,
    getList
}