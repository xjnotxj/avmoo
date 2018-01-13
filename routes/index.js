var express = require('express');
var router = express.Router();

var request = require('request');
var cheerio = require('cheerio');
var config = require('../config');
var models = require('../models');

var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var util = require('../util');
var rimraf = require('rimraf');
var request = require('request');

const download = require('image-downloader')

var swig = require('swig');

//access options requset


/* GET home page. */

router.get('/', function (req, res, next) {

    const search = new models.Search();
    search.keyword = req.query.keyword;

    if (_.isEmpty(search.keyword)) {
        // return returnValue(res, -3);
        return getFinishCount(res, search.keyword)
    }

    search.save(function (err, doc) {
        if (err) {

            //字段格式
            if (err.name == "CastError") {
                return returnValue(res, -4);
            }

            //判重
            if (err.code === 11000) {
                return getFinishCount(res, search.keyword)
            }

            console.log(err);
            return returnValue(res, -2);
        }

        return getFinishCount(res, search.keyword)

    });


});


function getFinishCount(res, keyword) {
    //获取条数
    models.Search.count({finish: true},
        function (err, count) {
            if (err) {
                console.log(err);
                return returnValue(res, -2);
            }

            //检查是否finish
            models.Search.findOne({keyword: keyword}).exec(async function (err, doc) {
                if (err) {
                    return returnValue(res, -2);
                }


                return res.render('index', {
                    title: '主题阅读',
                    keyword: keyword,
                    archived_number: count,
                    isFinish: doc && doc.finish ? 1 : 0
                });

            });


        }
    );
}


router.get('/search/search', function (req, res, next) {

    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const size = parseInt(req.query.size) >= 0 ? parseInt(req.query.size) : 1; // 0为获取全部

    //container search
    const search = req.query.search;
    //container order
    const sort = req.query.sort;
    const sort_order = parseInt(req.query.sort_order) > 0 ? 1 : -1;

    //search default
    const condition = {finish: true};
    if (!_.isEmpty(search)) {
        condition.keyword = {$regex: new RegExp(search, "i")};
    }

    //sort default
    let sort_condition = {createdAt: -1};
    if (!_.isEmpty(sort)) {
        sort_condition = Object.assign({[sort]: sort_order}, sort_condition);
    }

    async.parallel({
        list: function (callback) {
            models.Search.aggregate(
                [
                    {"$match": condition},
                    {"$sort": sort_condition},
                    {"$skip": (page - 1) * size},
                    size !== 0 ? {"$limit": size} : {"$limit": config.no_page_max_get},
                ],
                function (err, docs) {
                    if (err) {
                        console.log(err);
                        return returnValue(res, -2);
                    }

                    return callback(null, docs);


                }
            );
        },
        total: function (callback) {
            models.Search.aggregate(
                [
                    {"$match": condition},
                ],
                function (err, docs) {
                    if (err) {
                        console.log(err);
                        return returnValue(res, -2);
                    }

                    return callback(null, _.size(docs));

                }
            );
        }
    }, function (err, results) {
        if (err) {
            console.log(err);
            return returnValue(res, -2);
        }
        return returnValue(res, 1, null, results);
    });


});

router.post('/search/finish', function (req, res, next) {

    let search = {};
    search.keyword = req.query.keyword;
    search.type = parseInt(req.body.type) > 0 ? true : false;

    if (_.isEmpty(search.keyword)) {
        return returnValue(res, -3);
    }

    models.Search.findOneAndUpdate({keyword: search.keyword}, {'$set': {finish: search.type}}).exec(function (err, re) {
        if (err) {

            //字段格式
            if (err.name == "CastError") {
                return returnValue(res, -4);
            }

            // console.log(err);
            return returnValue(res, -2);
        }

        //id是否存在
        if (!re) {
            return returnValue(res, -6);
        } else {
            return returnValue(res, 1, null, search);
        }

    });


});

router.get('/search/archived', function (req, res, next) {

    models.Search.find({finish: true}).sort({'updatedAt': -1}).exec(function (err, docs) {
        if (err) {

            //字段格式
            if (err.name == "CastError") {
                return returnValue(res, -4);
            }

            console.log(err);
            return returnValue(res, -2);
        }


        for (let i = 0; i < docs.length; ++i) {
            // console.log(moment(docs[i].updatedAt).format('YYYY-MM-DD HH:mm:ss'));
            docs[i]._doc.updatedAt = moment(docs[i].updatedAt).format('YYYY-MM-DD HH:mm:ss');
        }

        return res.render('archived', {
            title: '主题阅读 - archived',
            data: docs,
        });

    });


});

let fetchWebPage = function (origin_url, number) {
    return new Promise(function (resolve, reject) {

        request(origin_url, function (error, response, html) {
            if (!error && response.statusCode == 200) {
                let $ = cheerio.load(html);

                //global
                let SkipTip = "";

                //title
                let title_arr = $("h3").text().split(" ");
                let title = "";
                for (let i = 1; i < title_arr.length; ++i) {
                    title += title_arr[i] + " ";
                }
                // console.log("title:" + title);

                //cover
                let cover = $(".screencap").children("a").attr("href");
                // console.log("cover:" + cover);

                let actor = []
                $("#avatar-waterfall").children("a").each(function (i, element) {
                    let a = {}
                    a.link = $(this).attr("href").trim();
                    a.name = $(this).find("span").text().trim();
                    a.icon = $(this).find("img").attr("src").trim();
                    actor.push(a);
                });

                //info
                let info = $(".info");

                let mark = info.children().first().children().last().text().trim();
                // console.log("mark:" + mark);

                info.children().eq(1).find(".header").remove();
                let time = info.children().eq(1).text().trim();
                // console.log("time:" + time);

                let label = [];
                info.children().last().children().each(function (i, element) {
                    label.push($(this).find("a").text().trim());
                });
                // console.log("label:" + label.join(" "));
                //判断是否建议跳过
                for (let l of label) {
                    if (_.indexOf(config.label_skip, l) >= 0) {
                        SkipTip = "可跳过";
                    }
                }

                //image
                let sample = $("#sample-waterfall");
                let image = [];
                sample.children().each(function (i, element) {
                    image.push($(this).attr("href"));
                });
                // console.log("image:" + image.join("\r\n"));

                //check isLike or isPity
                models.Avmoo.findOne({"mark": mark}).exec(function (err, re) {

                    if (err) {
                        return reject();
                    }

                    models.Avmoo.count({"pity": true}).exec(function (err, pity_count) {

                        if (err) {
                            return reject();
                        }

                        models.Avmoo.count({"like": true}).exec(function (err, like_count) {

                            if (err) {
                                return reject();
                            }

                            let isLikeOrIsPity = "";
                            if (re) {
                                if (re.like) {
                                    isLikeOrIsPity = "like"
                                } else if (re.pity) {
                                    isLikeOrIsPity = "pity"
                                }
                            }

                            resolve({

                                origin_url: origin_url,

                                title: 'avmoo',
                                title_2: title,
                                number: number,
                                cover: cover,
                                actor: actor,
                                mark: mark,
                                time: time,
                                label: label.join(" "),
                                image: image,

                                isLikeOrIsPity: isLikeOrIsPity,
                                like_count: like_count,
                                pity_count: pity_count,

                                SkipTip: SkipTip,
                            })

                        });

                    });

                });


            } else {

                resolve({
                    number: number,
                })


            }
        });
    })
};


var downloadImage = function (uri, dest, callback) {
    request.head(uri, function (err, res, body) {
        // console.log('content-type:', res.headers['content-type']);
        // console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(dest)).on('close', callback);
    });
};


router.get('/hide/avmoo/loading', async function (req, res, next) {


    // const options = {
    //     url: "https://jp.netcdn.space/digital/video/125ud00790r/125ud00790rjp-17.jpg",
    //     dest: config.loading_image_save_location,
    // }
    //
    // download.image(options)
    //     .then(({filename, image}) => {
    //         console.log("ok");
    //     }).catch((err) => {
    //     console.log(" fail");
    // })


    // return res.render('avmoo_loading', {
    //     title: 'avmoo - loading',
    //     finish: 3,
    //     size: 10,
    //     rate: 3 / 10 * 100,
    // });

    let number = req.query.number;
    let size = parseInt(req.query.size) > 0 ? parseInt(req.query.size) : 1;

    if (_.isEmpty(number)) {
        return returnValue(res, -3);
    }

    const bulk = models.AvmooLoading.collection.initializeUnorderedBulkOp();

    let obj_array = [];
    for (let i = 0; i < size; i++) {
        let obj = {};
        obj.number = number;

        let origin_url = config.avmoo_origin_url + '/movie/' + number;
        let result = null;
        try {
            result = await fetchWebPage(origin_url, number);
            if (!result) {
                return returnValue(res, -1);
            }
        } catch (err) {
            return returnValue(res, -1);
        }
        obj.result = result;

        obj_array.push(obj);

        //number++
        number = parseInt(number, 36);
        number = (number + 1).toString(36);

    }


    //to each number
    async.eachLimit(obj_array, 2 ,function (obj, callback_2) {

            //图片存本地
            async.parallel([
                    function (call) {

                        if (obj.result.cover) {

                            // //cover
                            // const options = {
                            //     url: obj.result.cover,
                            //     dest: config.loading_image_save_location,
                            // }

                            // console.log("save cover start"  );
                            let dest = config.loading_image_save_location + "/" + _.last(obj.result.cover.split("/"));

                            downloadImage(obj.result.cover, dest, function (err) {
                                if (err) {
                                    console.log("save cover fail " + obj.result.cover + " : " + dest);
                                    return call(err);
                                }
                                console.log("save cover success " + obj.result.cover + " : " + dest);
                                obj.result.cover = "/" + dest;
                                // console.log("save cover end"  );
                                return call();
                            });

                            // download.image(options)
                            //     .then(({filename, image}) => {
                            //         obj.result.cover = "/" + filename;
                            //         // console.log("save cover end"  );
                            //         return call();
                            //     }).catch((err) => {
                            //     console.log("save cover fail " + options.url);
                            //     return call(err);
                            // })

                        } else {
                            return call();
                        }
                    },
                    function (call) {

                        let image_array = [];
                        //image
                        async.eachLimit(obj.result.image,2 , function (o, callback) {

                            if (o) {

                                // const options = {
                                //     url: o,
                                //     dest: config.loading_image_save_location,
                                // }
                                //
                                // // console.log("save image"  );
                                //
                                // download.image(options)
                                //     .then(({filename, image}) => {
                                //         image_array.push("/" + filename);
                                //         // console.log("save cover end"  );
                                //         return callback();
                                //     }).catch((err) => {
                                //     console.log("save image fail " + o);
                                //     return callback(err);
                                // })

                                let dest = config.loading_image_save_location + "/" + _.last(o.split("/"));

                                downloadImage(o, dest, function (err) {
                                    if (err) {
                                        return callback(err);
                                        console.log("save image fail " + o + " : " + dest);
                                    }
                                    console.log("save image success " + o + " : " + dest);
                                    image_array.push("/" + dest);
                                    // console.log("save cover end"  );
                                    return callback();

                                });

                            } else {
                                console.log("no image  " + o );
                                return callback();
                            }

                        }, function (err) {
                            if (err) {
                                console.log("  fail  1   !!!");
                                return call(err);
                            }
                            console.log("  success  1   !!!");
                            //排序image_array
                            image_array = _.sortBy(image_array, function (name) {
                                return parseInt(name.split("-")[1]);
                            });
                            obj.result.image = image_array;
                            return call();
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        console.log("  fail    2     !!!");
                        return callback_2(err);
                    }
                    console.log("  success    2     !!!" + obj.number);

                    //存数据库
                    bulk.find({number: obj.number}).upsert().update({$set: {content: obj.result}});
                    return callback_2();
                });

        },
        function (err) {
            if (err) {
                console.log("  fail    3     !!!");
                console.log(err);
                return returnValue(res, -1);
            }

            console.log("bulk.execute start")

            //存入数据库
            bulk.execute(function (err, re) {
                if (err) {
                    return res.status(500).send(err);
                }

                console.log("bulk.execute end")

                // return res.status(500).send(re);

                return res.render('avmoo_loading', {
                    title: 'avmoo - loading',
                    finish: (re.nUpserted + re.nMatched),
                    size: size,
                    rate: ( re.nUpserted + re.nMatched ) / size * 100,
                });
            });

        }
    );


});

function downloadIMG(url) {

    return new Promise(function (resolve, reject) {

        const options = {
            url: url,
            dest: config.loading_image_save_location,
        }

        download.image(options)
            .then(({filename, image}) => {
                resolve(filename)
            }).catch((err) => {
            reject(err)
        })

    });
}

function saveAvmooLoading(bulk, result) {

    return new Promise(function (resolve, reject) {
        const avmooLoading = new models.AvmooLoading();
        avmooLoading.content = result;
        bulk.insert(avmooLoading);
        avmooLoading.save(function (err, doc) {
            if (err) {
                reject()
            }
            resolve()
        });
    });

}

router.get('/hide/avmoo/clearLoading', function (req, res, next) {

    //移除图片文件

    rimraf(path.join(__dirname, "..", config.loading_image_save_location), function (err) {
        if (err) {
            console.log(err);
            return returnValue(res, -1);
        }

        //重建文件夹
        util.mkdirsSync(config.loading_image_save_location);

        models.AvmooLoading.remove({}).exec(function (err, re) {
            if (err) {

                //字段格式
                if (err.name == "CastError") {
                    return returnValue(res, -4);
                }

                console.log(err);
                return returnValue(res, -2);
            }

            if (re.result.ok) {
                return returnValue(res, 1, null, re.result.n);
            } else {
                return returnValue(res, -6);
            }

        });

    });


});

router.get('/hide/avmoo', function (req, res, next) {


    const number = req.query.number;

    if (_.isEmpty(number)) {
        return returnValue(res, -6);
    }

    //检查数据库有没有
    models.AvmooLoading.findOne({number: number}).exec(async function (err, doc) {
        if (err) {
            return returnValue(res, -2);
        }

        if (doc) {
            return res.render('avmoo', Object.assign({cache: 1}, doc.content));
            // return res.status(500).send(doc.content);
        } else {

            let origin_url = config.avmoo_origin_url + '/movie/' + number;

            try {
                let result = await
                    fetchWebPage(origin_url, number);

                return res.render('avmoo', result);

            } catch (err) {

                console.log(err);
                return returnValue(res, -2);
            }

        }

    });


});


router.post('/hide/avmoo/add', function (req, res, next) {

    const avmoo = new models.Avmoo();
    avmoo.number = req.body.number;
    avmoo.title = req.body.title;
    avmoo.mark = req.body.mark;
    avmoo.cover = req.body.cover;
    avmoo.time = req.body.time;

    avmoo.like = req.body.like;
    avmoo.pity = req.body.pity;

    //actor
    let temp_actor = [];
    if (req.body.actor) {
        // avmoo.actor = JSON.parse(req.body.actor);
        let t = req.body.actor.split(" ");
        for (let i = 0; i < _.size(t); i++) {
            let obj = {};
            obj.name = t[i];
            temp_actor.push(obj);
        }
    }
    avmoo.actor = temp_actor;


    //label
    let temp_label = [];
    if (req.body.label) {
        // avmoo.label = JSON.parse(req.body.label);
        let t = req.body.label.split(" ");
        for (let i = 0; i < _.size(t); i++) {
            let obj = {};
            obj.name = t[i];
            temp_label.push(obj);
        }
    }
    avmoo.label = temp_label;


    avmoo.save(function (err, avmoo) {
        if (err) {

            //字段格式
            if (err.name == "CastError") {
                return returnValue(res, -4);
            }

            //判重
            if (err.code === 11000) {
                return returnValue(res, -5);
            }

            console.log(err);
            return returnValue(res, -2);
        }
        return returnValue(res, 1, null, avmoo);
    });


});


router.post('/hide/avmoo/del', function (req, res, next) {

    let ids = req.body.mark;

    if (_.isEmpty(ids)) {
        return returnValue(res, -3);
    }

    if (ids.indexOf(",") >= 0) {
        ids = ids.split(",");
    } else {
        let t = [];
        t.push(ids);
        ids = t;
    }

    if (ids.length <= 0) {
        return returnValue(res, -3);
    }

    models.Avmoo.remove({"mark": {$in: ids}}).exec(function (err, re) {
        if (err) {

            //字段格式
            if (err.name == "CastError") {
                return returnValue(res, -4);
            }

            console.log(err);
            return returnValue(res, -2);
        }

        if (re.result.ok && re.result.n > 0) {
            return returnValue(res, 1, null, re.result.n);
        } else {
            return returnValue(res, -6);
        }

    });

});


router.get('/hide/avmoo/like_archived', function (req, res, next) {

    models.Avmoo.find({like: true}).sort({'updatedAt': -1}).exec(function (err, docs) {
        if (err) {

            //字段格式
            if (err.name == "CastError") {
                return returnValue(res, -4);
            }

            console.log(err);
            return returnValue(res, -2);
        }

        for (let i = 0; i < docs.length; ++i) {
            // console.log(moment(docs[i].updatedAt).format('YYYY-MM-DD HH:mm:ss'));
            docs[i]._doc.updatedAt = moment(docs[i].updatedAt).format('YYYY-MM-DD HH:mm:ss');
            if (docs[i].label && docs[i].label.length > 0) {
                let label_s = "";
                for (let j = 0; j < docs[i].label.length; ++j) {
                    label_s += docs[i].label[j].name + " ";
                }
                docs[i]._doc.label = label_s;
            }
            if (docs[i].actor && docs[i].actor.length > 0) {
                let actor_s = "";
                for (let j = 0; j < docs[i].actor.length; ++j) {
                    actor_s += docs[i].actor[j].name + " ";
                }
                docs[i]._doc.actor = actor_s;
            }
        }

        return res.render('avmoo_archived', {
            title: 'avmoo - like archived',
            data: docs,
            data_count: _.size(docs),
        });

    });


});

router.get('/hide/avmoo/pity_archived', function (req, res, next) {

    models.Avmoo.find({pity: true}).sort({'updatedAt': -1}).exec(function (err, docs) {
        if (err) {

            //字段格式
            if (err.name == "CastError") {
                return returnValue(res, -4);
            }

            console.log(err);
            return returnValue(res, -2);
        }


        for (let i = 0; i < docs.length; ++i) {
            // console.log(moment(docs[i].updatedAt).format('YYYY-MM-DD HH:mm:ss'));
            docs[i]._doc.updatedAt = moment(docs[i].updatedAt).format('YYYY-MM-DD HH:mm:ss');
            if (docs[i].label && docs[i].label.length > 0) {
                let label_s = "";
                for (let j = 0; j < docs[i].label.length; ++j) {
                    label_s += docs[i].label[j].name + " ";
                }
                docs[i]._doc.label = label_s;
            }
            if (docs[i].actor && docs[i].actor.length > 0) {
                let actor_s = "";
                for (let j = 0; j < docs[i].actor.length; ++j) {
                    actor_s += docs[i].actor[j].name + " ";
                }
                docs[i]._doc.actor = actor_s;
            }
        }

        return res.render('avmoo_archived', {
            title: 'avmoo - pity archived',
            data: docs,
            data_count: _.size(docs),
        });

    });


});

router.get('/hide/avmoo/actor_archived', function (req, res, next) {

    let actor = req.query.actor;

    if (_.isEmpty(actor)) {
        return returnValue(res, -3);
    }

    models.Avmoo.find({"actor.name": actor}).sort({'updatedAt': -1}).exec(function (err, docs) {
        if (err) {

            //字段格式
            if (err.name == "CastError") {
                return returnValue(res, -4);
            }

            console.log(err);
            return returnValue(res, -2);
        }


        for (let i = 0; i < docs.length; ++i) {
            // console.log(moment(docs[i].updatedAt).format('YYYY-MM-DD HH:mm:ss'));
            docs[i]._doc.updatedAt = moment(docs[i].updatedAt).format('YYYY-MM-DD HH:mm:ss');
            if (docs[i].label && docs[i].label.length > 0) {
                let label_s = "";
                for (let j = 0; j < docs[i].label.length; ++j) {
                    label_s += docs[i].label[j].name + " ";
                }
                docs[i]._doc.label = label_s;
            }
            if (docs[i].actor && docs[i].actor.length > 0) {
                let actor_s = "";
                for (let j = 0; j < docs[i].actor.length; ++j) {
                    actor_s += docs[i].actor[j].name + " ";
                }
                docs[i]._doc.actor = actor_s;
            }

        }

        return res.render('avmoo_archived', {
            title: 'avmoo - actor archived',
            data: docs,
            data_count: _.size(docs),
        });

    });


});


var returnValue = function (res, code, message, value) {

    if (!message) {
        if (code == 1) {
            message = "ok"
        } else if (code == -1) {
            message = "server errer"
        } else if (code == -2) {
            message = "database errer"
        } else if (code == -3) {
            message = "params is empty"
        } else if (code == -4) {
            message = "params is invalid"
        } else if (code == -5) {
            message = "data is exist"
        } else if (code == -6) {
            message = "data is not exist"
        }
    }

    if (code == -1 && code == -2) {
        return res.status(500).send({code: code, message: message, value: value});
    }
    else {
        return res.status(200).send({code: code, message: message, value: value});
    }

};

module.exports = router;
