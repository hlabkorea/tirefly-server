const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join('..', 'motif-server', 'views', 'files'));
    },
    filename: (req, file, cb) => {
		const extname = path.extname(file.originalname);
        cb(null, path.basename(file.originalname, extname) + "-" + Date.now()  + extname);
    }
});

const upload = multer({storage: storage});

module.exports = {upload};
