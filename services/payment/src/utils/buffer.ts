import DataUriParser from "datauri/parser.js";

import path from 'path';

const getBuffer = (file: any) => {
    const parser = new DataUriParser();
    const extension = path.extname(file.originalname).toString();
    return parser.format(extension, file.buffer);
}

export default getBuffer;