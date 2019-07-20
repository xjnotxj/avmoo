let origin = "http://localhost:3010";
// let db = {
//     host: 'ds247347.mlab.com',
//     port: '47347',
//     dbname: 'avmoo',
//     username: 'xjnotxj',
//     password: 'jcz05633011893'
// };

let db = {
    host: '127.0.0.1',
    port: '27017',
    dbname: 'avmoo',
    username: 'root',
    password: 'root'
};



//     if (process.env.NODE_ENV == "production") {
//     origin = "http://universal.6edigital.com:3010";
//
//     db = {
//         host: '127.0.0.1',
//         port: '27017',
//         dbname: 'YSL_Lips_2',
//         username: '',
//         password: '',
//     };
//     // db = "mongodb://localhost:C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==@localhost:10255/admin?ssl=true"
// } else if (process.env.NODE_ENV == "testing") {
//     origin = "http://universal-dev.6edigital.com:3010";
//
//     db = {
//         host: '127.0.0.1',
//         port: '27017',
//         dbname: 'YSL_Lips_2',
//         username: '',
//         password: '',
//     };
// } else if (process.env.NODE_ENV == "development") {
//     origin = 'http://localhost:3010';
// }


module.exports = {

    // Node.js app
    port: 3000,

    // Database
    db: db,

    //允许上传最大图片
    max_upload_size: '50mb',

    //不分页的允许最大获取量
    no_page_max_get: 10000,

    //avmoo 源地址
    avmoo_origin_url: "https://avmoo.asia/cn",

    //提示跳过
    label_skip: ["合集", "女優ベスト・総集編", "VR専用"],

    //loading 存在本地 路径
    loading_image_save_location: "upload/loading/image",

};
