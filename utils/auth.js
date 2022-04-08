const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const auth = {
    login: async (email, password, secretKey) => {
        const user = await User.findOne({ email });
        if (!user) return { error: 'User or password incorrect' };
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return { error: 'User or password incorrect' };

        const token = await jwt.sign({ _id: user._id, name: user.name, date: user.date }, secretKey, { expiresIn: '1h' });

        return {message: 'Login success', token};
    },
    checkHeaders: (req, res, next) => {
        const token = req.header('Authorization');
        if (!token){
         req.user = { auth: false };
         return next();
        }
        const jwtToken = token.split(' ')[1];
        if (!jwtToken) {
            req.user = {auth: false};
            return res.status(401).send({ error: 'You must be logged in' });
        }
        try {
            const decoded = jwt.verify(jwtToken, process.env.SECRET_KEY_JWT);
            req.user = {auth: true, _id: decoded._id, name: decoded.name, date: decoded.date};
            return next();
        } catch (err) {
            req.user = {auth: false};
            return res.status(401).send({ error: 'You must be logged in - invalid secret key' });
        }
    }
};

module.exports = auth;