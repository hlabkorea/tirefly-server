const {validationResult} = require('express-validator');

function getError(req, res){
    const errors = validationResult(req);
    if(!errors.isEmpty())
        res.status(400).json({status: 400, data: errors.array(), message: "fail"});
    return errors;
}

module.exports = {getError};