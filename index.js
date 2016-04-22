/**
 * Created by weijianli on 16/4/22.
 */



var path = require("path");
var fs =require('fs');

var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var Transform = require('readable-stream/transform');
var md5File = require('md5-file');
var modifyFilename = require('modify-filename');
// 常量
var PLUGIN_NAME = 'gulp-html-helper';

function htmlTransform(opt){

  Transform.prototype._transform = function transform(buf, enc, cb) {

    var protoString =  buf.toString('utf8');


    var matches = protoString.match(/<(?!a).*(src|href)=['"](?!(http|https):\/\/|\/).+['"].*(>)/gm);



    if(opt.aliasPath){
      var originalPath = Object.keys(opt.aliasPath)[0];
      var aliasPath = opt.aliasPath[originalPath];
      matches = matches.map(function (value, index) {
        return value.replace(originalPath,aliasPath);
      })
    }

    var opMatches = matches.map(function (value,index) {
      var attr;
      if(value.indexOf('href=') != -1){
        attr = value.match(/href=['"].+['"]/gm)[0].split('=')[1].replace(/['"]/g,'');

      }else if(value.indexOf('src=') != -1){
        attr = value.match(/src=['"].+['"]/gm)[0].split('=')[1].replace(/['"]/g,'');
      }


      return value.replace(attr,opt.urlBasePath+path.basename(opStatics(opt,path.resolve(opt.base,attr))));
    });

    var splitStrings = protoString.split(/<(?!a).*(src|href)=['"](?!(http|https):\/\/|\/).+['"].*(>)/);

    var cnt=0;
    var re = splitStrings.reduce(function (previousValue, currentValue, index) {
      if(currentValue == undefined){
        previousValue = '' + previousValue + opMatches[cnt];
        cnt++;
      } else if(currentValue != 'href'&& currentValue != 'src' && currentValue != '>'){
        previousValue = '' + previousValue + currentValue;
      }

      return previousValue;
    });
    cb(null, re);
  };
  return new Transform();
}

var dirPathFlag =false;//
function opStatics(opt,filePath) {

  if(!fs.existsSync(filePath)){
    throw new PluginError(PLUGIN_NAME, filePath+' does not exist!!!');
  }



  var sum =md5File(filePath);
  var distPath = modifyFilename(path.basename(filePath),function (filename, ext) {
    if(opt.md5){
      if(ext == '.css' || ext == '.js'){
        return  path.join( opt.staticPath, filename+'-'+sum+ext);
      }else{
        return path.join( opt.staticPath, sum+ext);
      }
    }else{
      return  path.join( opt.staticPath, filename+ext);
    }
  });


  //copy文件


  if(!dirPathFlag && !fs.existsSync(opt.staticPath)){
    fs.mkdir(path.dirname(distPath), function(err){
      if(!err){
        fs.createReadStream(filePath)
          .pipe(fs.createWriteStream(distPath));
      }
    });
  }else {
    fs.createReadStream(filePath)
      .pipe(fs.createWriteStream(distPath));
  }

  return distPath;
}


/**
 * 插件级别函数 (处理文件)
 * */
function htmlHelper(opt) {
  if (!opt) {
    throw new PluginError(PLUGIN_NAME, 'Missing opt!');
  }else {
    if(!opt.staticPath){
      throw new PluginError(PLUGIN_NAME, 'Missing opt.staticPath!');
    }
    opt.urlBasePath =  opt.urlBasePath || '/';

    if(opt.aliasPath &&( typeof opt.aliasPath !='object' || !/^\{.+:.+}$/.test(JSON.stringify(opt.aliasPath)))){
      throw new PluginError(PLUGIN_NAME, 'urlBasePath must like {"originalPath":"aliasPath"}');
    }
  }


  // 创建一个让每个文件通过的 stream 通道
  var stream = through.obj(function(file, enc, cb) {
    if (file.isBuffer()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Buffers not supported!'));
      return cb();
    }
    if (file.isStream()) {
      // 开始转换
      opt.base = file.base;
      opt.path = file.path;
      file.contents = file.contents.pipe(htmlTransform(opt));
    }

    // 告诉 stream 转换工作完成
    return cb(null, file);

  });

  // 返回文件 stream
  return stream;
}

// 暴露（export）插件的主函数
module.exports = htmlHelper;