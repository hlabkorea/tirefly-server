const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join('..', 'tirefly-server', 'views', 'files'));
    },
    filename: (req, file, cb) => {
		const extname = path.extname(file.originalname);
        cb(null, path.basename(file.originalname, extname) + "-" + Date.now()  + extname);
    }
});

const visionStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join('..', 'tirefly-server', 'views', 'files', 'vision'));
    },
    filename: (req, file, cb) => {
        const extname = path.extname(file.originalname);
        cb(null, path.basename(file.originalname, extname) + "-" + Date.now()  + extname);
    }
});

const onlyUploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join('..', 'tirefly-server', 'views', 'files'));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({storage: storage});
const onlyUpload = multer({storage: onlyUploadStorage});
const memoryUpload = multer({
    storage: multer.memoryStorage()
});
const visionUpload = multer({storage: visionStorage});

module.exports.upload = upload;
module.exports.onlyUpload = onlyUpload;
module.exports.memoryUpload = memoryUpload;
module.exports.visionUpload = visionUpload;