const bcrypt = require('bcryptjs');

// Using async/await (modern approach)
const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (err) {
        throw err;  // Handling errors properly
    }
};

// Same as using comparePassword directly from bcryptjs, which returns a promise.
const comparePassword = (password, hashed) => {
    return bcrypt.compare(password, hashed);
};

module.exports = {
    hashPassword,
    comparePassword
};
