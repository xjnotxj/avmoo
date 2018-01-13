const fs = require('fs');
// const gm = require('gm');
const path = require('path');
const config = require('../config');
const _ = require('underscore');
const mongoose = require('mongoose');

//递归创建目录 异步方法
module.exports.mkdirs = function (dirname, callback) {
    fs.exists(dirname, function (exists) {
        if (exists) {
            callback();
        } else {
            //console.log(path.dirname(dirname));
            module.exports.mkdirs(path.dirname(dirname), function () {
                fs.mkdir(dirname, callback);
            });
        }
    });
}

//递归创建目录 同步方法
module.exports.mkdirsSync = function (dirname) {
    //console.log(dirname);
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (module.exports.mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
//
// //识别是否是base64图片,如果是，保存为图片（包含缩略图）
// module.exports.field2SaveImage = function (filed, filename, image_save_location) {
//
//     return new Promise((resolve, reject) => {
//
//         //检验格式
//         if (filed.indexOf('data:image/') < 0) {
//             return reject(new Error("field is not base64"));
//         }
//
//         //取出后缀名
//         const image_type = filed.split("data:image/")[1].split(";base64")[0];
//         if (!image_type) {
//             return reject(new Error("no filename extension"));
//         }
//
//         const filepath = path.join(image_save_location, filename + "." + image_type);
//         const filepath_thumbnail = path.join(image_save_location, filename + "_thumbnail." + image_type);
//         const fileurl = image_save_location + '/' + filename + "_thumbnail." + image_type;
//
//         //判断并创建目录
//         if (!fs.existsSync(image_save_location)) {
//             if (module.exports.mkdirsSync(image_save_location, null) == false) {
//                 return reject(new Error("create image folder fail"));
//             }
//         }
//
//         //过滤data:URL
//         const base64Data = filed.replace(/^data:image\/\w+;base64,/, "");
//         const dataBuffer = new Buffer(base64Data, 'base64');
//         try {
//             fs.writeFileSync(filepath, dataBuffer);
//         } catch (e) {
//             return reject(new Error(e));
//         }
//
//         //生成缩略图
//         gm(filepath)
//             .resize(240, 240)
//             .noProfile() // resize and remove EXIF profile data
//             .write(filepath_thumbnail, function (err) {
//                 if (err)   return reject(new Error(err));
//             });
//
//         return resolve(fileurl);
//
//     });
//
// }

module.exports.toObjectId = function (id) {
    if (_.isEmpty(id)) {
        return null;
    }
    const stringId = id.toString().toLowerCase();
    if (!mongoose.Types.ObjectId.isValid(stringId)) {
        return null;
    }
    const result = new mongoose.Types.ObjectId(stringId);
    if (result.toString() !== stringId) {
        return null;
    }
    return result;
}

module.exports.getSingleObject = function (value) {

    let doc_key = null;
    let doc_value = null;
    for (let va in value) {
        if (va) {
            doc_key = va;
            doc_value = value[va];
            break;
        }
    }

    return {key: doc_key, value: doc_value}

}


