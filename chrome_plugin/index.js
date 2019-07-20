// 压缩 js ：https://www.css-js.com/
$(document).ready(function() {
  var title_ele = $(".container h3").clone();

  //title
  let title_arr = title_ele.text().split(" ");
  let title = "";
  for (let i = 1; i < title_arr.length; ++i) {
    title += title_arr[i] + " ";
  }
  var title_hide = title;

  var append_location = null;

  // 判断接下来的内容插入什么位置
  if ($("#sample-waterfall").length > 0) {
    append_location = $("#sample-waterfall");
  } else if ($("#avatar-waterfall").length > 0) {
    append_location = $("#avatar-waterfall");
  } else {
    append_location = $("#movie-share");
  }

  // add image view
  var image_list = $("#sample-waterfall").find(".sample-box");
  if (image_list && image_list.length > 0) {
    append_location.append(`<div id="waterfall" > </div>`);
    $.each(image_list, function() {
      var image_url = $(this).attr("href");
      // console.log(image_url)
      var myImage = new Image();
      myImage.src = image_url;
      myImage = $(myImage);
      // myImage.addClass("movie-box");
      myImage.attr("alt", "loading");
      myImage.css("width", "39%");
      myImage.css("border", "1px solid white");
      myImage.css("margin", "2px");
      // var temp_image_box = $(`<div class="item"></div>`);
      // temp_image_box.append(myImage)
      // $("#waterfall").append(temp_image_box);
      $("#waterfall").append(myImage);
    });
  }

  //ignore
  var genre_list = $(".genre");
  var ignore_list = ["合集", "女優ベスト・総集編", "VR専用"];
  var ignore_flag = false;
  if (genre_list.length > 0) {
    $.each(genre_list, function() {
      var genre_text = $(this)
        .find("a")
        .text()
        .trim();

      // console.log(genre_text);
      if (ignore_list.indexOf(genre_text) > -1) {
        ignore_flag = true;
        return;
      }
    });
  }

  if (ignore_flag) {
    $("h3").css("border", "3px darkgray dashed");
    $("h3").css("padding", "5px");
    $("h3").css("background-color", "#a9a9a994");
    //   console.log("ignore");
  } else {
    $("h3").css("border", "3px green dashed");
    $("h3").css("padding", "5px");
    $("h3").css("background-color", "#0080003d");
  }

  // add iframe
  var outer_link = $(".hidden-xs")
    .find("a")
    .attr("href");
  console.log("outer_link", outer_link);
  // add h3 separator
  append_location.append(title_ele);
  append_location.append(
    `<iframe security="restricted" sandbox="allow-scripts allow-same-origin allow-popups" style="
        width: 75%; 
        height: 1820px;
    " src="${outer_link}" name="frame" id="frame"></iframe>`
  );

  //############# operator

  var domain = "http://localhost:3333";

  // add btn
  append_location.append(`<div style="
    box-shadow: 1px 1px 2px 1px;
    padding:10px;
    position: fixed;
    left: 88%;
    top: 63%;
  " id="myOperator" ></div>`);
  $("#myOperator").html(`
    <button style="display: none" id="cancel" class="btn btn-default btn-lg" type="button">
                        cancel
                    </button>
                    <hr/>
      <button id="like" class="btn btn-danger btn-lg" type="button">
          <span class="glyphicon glyphicon-star" aria-hidden="true"></span> Like it !
      </button>
      <a class="btn-md" id="like_number" target="_blank" href="${domain}/hide/avmoo/like_archived">like_archived
          <span id="like_count_badge" class="badge"></span>
      </a>
      <br/>
      <br/>
      <button id="pity" class="btn btn-warning btn-lg" type="button">
          <span class="glyphicon glyphicon-star-empty" aria-hidden="true"></span> Pity it !
      </button>
      <a class="btn-md" id="pity_number" target="_blank" href="${domain}/hide/avmoo/pity_archived">pity_archived
          <span id="pity_count_badge" class="badge"></span>
      </a>
  `);

  var isLikeOrIsPity = $("#isLikeOrIsPity").val();
  //判断是否isLike or isPity
  if (isLikeOrIsPity) {
    $("#cancel").show();
    $("#cancel").text("cancel " + isLikeOrIsPity);
    $("#like").hide();
    $("#pity").hide();
  }

  //like
  $("#like").click(function() {
    sendAddAjax("like");
  });
  //pity
  $("#pity").click(function() {
    sendAddAjax("pity");
  });

  //like
  $("#cancel").click(function() {
    sendDelAjax("like");
  });

  // ####### get param

  //number
  let url_temp = window.location.href.split("/");
  var number_hide = url_temp[url_temp.length - 1];

  //cover
  var cover_hide = $(".screencap")
    .children("a")
    .attr("href");

  // mark
  let mark = $(".info")
    .children()
    .first()
    .children()
    .last()
    .text()
    .trim();
  var mark_hide = mark;

  //time
  let time = $(".info")
    .children()
    .eq(1)
    .text()
    .trim();
  var time_hide = time;

  // label
  let label = [];
  $(".info")
    .children()
    .last()
    .children()
    .each(function(i, element) {
      label.push(
        $(this)
          .find("a")
          .text()
          .trim()
      );
    });
  var label_hide = label.join(" ");

  //actor
  let actor = [];
  $("#avatar-waterfall")
    .children("a")
    .each(function(i, element) {
      let a = {};
      a.link = $(this)
        .attr("href")
        .trim();
      a.name = $(this)
        .find("span")
        .text()
        .trim();
      a.icon = $(this)
        .find("img")
        .attr("src")
        .trim();
      actor.push(a.name);
    });
  var actor_hide = actor.join(" ");

  // isLikeOrIsPity
  var isLikeOrIsPity = false;

  console.log("number_hide", number_hide);
  console.log("title_hide", title_hide);
  console.log("cover_hide", cover_hide);
  console.log("mark_hide", mark_hide);
  console.log("time_hide", time_hide);
  console.log("label_hide", label_hide);
  console.log("actor_hide", actor_hide);

  $.ajax({
    url: domain + "/hide/avmoo/get?mark=" + mark_hide,
    method: "GET"
  })
    .done(function(data) {
      if (data.code == 0) {
        isLikeOrIsPity = data.isLikeOrIsPity;
        console.log("isLikeOrIsPity", isLikeOrIsPity);
        //判断是否isLike or isPity
        if (isLikeOrIsPity) {
          $("#cancel").show();
          $("#cancel").text("cancel " + isLikeOrIsPity);
          $("#like").hide();
          $("#pity").hide();
        }
        // show like_count and pity_count
        $("#like_count_badge").text(data.like_count);
        $("#pity_count_badge").text(data.pity_count);
      } else {
        alert("get status by mark error");
      }
    })
    .fail(function(err) {
      console.log(err);
      alert("ajax error");
    });

  console.log("number_hide:" + number_hide);

  function sendAddAjax(param) {
    let isLikeOrIsPity = "";

    var data = {
      number: number_hide,
      title: title_hide,
      cover: cover_hide,
      mark: mark_hide,
      time: time_hide,
      label: label_hide,
      actor: actor_hide
    };

    if (param == "like") {
      isLikeOrIsPity = "like";
      data.like = true;
    } else if (param == "pity") {
      isLikeOrIsPity = "pity";
      data.pity = true;
    } else {
      return false;
    }

    $.ajax({
      url: domain + "/hide/avmoo/add",
      method: "POST",
      data: data
    })
      .done(function(data) {
        if (data.code == 1 || data.code == -5) {
          $("#cancel").show();
          $("#cancel").text("cancel " + isLikeOrIsPity);
          $("#like").hide();
          $("#pity").hide();
        } else {
          alert("operate error");
        }
      })
      .fail(function(err) {
        console.log(err);
        alert("ajax error");
      });
  }

  function sendDelAjax(param) {
    var data = {
      mark: mark_hide
    };

    $.ajax({
      url: domain + "/hide/avmoo/del",
      method: "POST",
      data: data
    })
      .done(function(data) {
        if (data.code == 1) {
          $("#cancel").hide();
          $("#like").show();
          $("#pity").show();
        } else {
          alert("operate error");
        }
      })
      .fail(function(err) {
        console.log(err);
        alert("ajax error");
      });
  }
});
