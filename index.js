/**
 * Created by weijianli on 16/4/22.
 */

var path = require("path");
var fs =require('fs');
var execFun = require('child_process').exec;
var through = require('through2');
var gutil = require('gulp-util');
var gulp = require('gulp');
var PluginError = gutil.PluginError;
var Transform = require('readable-stream/transform');
var md5File = require('md5-file');
var modifyFilename = require('modify-filename');
// 常量
var PLUGIN_NAME = 'gulp-html-helper';

function htmlTransform(opt){

  Transform.prototype._transform = function transform(buf, enc, cb) {
    var opt = this.opt_;
    var protoString =  buf.toString('utf8');

    var matches = protoString.match(/<(img|link|script).*(src|href)=['"](?!((http|https):\/\/|\/)).+['"].*(>)/gmi);

    if(opt.aliasPath){
      var originalPath = Object.keys(opt.aliasPath)[0];
      var aliasPath = opt.aliasPath[originalPath];
      matches = matches.map(function (value, index) {
        return value.replace(originalPath,aliasPath);
      })
      opt.rootPathIMG = opt.rootPathIMG.replace(originalPath,aliasPath);
      opt.rootPathCSS = opt.rootPathCSS.replace(originalPath,aliasPath);
      opt.rootPathJS = opt.rootPathJS.replace(originalPath,aliasPath);
    }

    var opMatches = matches.map(function (value,index) {
      var attr;
      if(value.indexOf('href=') != -1){
        attr = value.match(/href=['"].+['"]/gm)[0].split('=')[1].replace(/['"]/g,'');
    
      }else if(value.indexOf('src=') != -1){
        attr = value.match(/src=['"].+['"]/gm)[0].split('=')[1].replace(/['"]/g,'');
      }
      var re = value.replace(attr,opt.urlBasePath+ opStatics(opt,path.resolve(opt.base,attr)).replace(path.join(opt.staticPath,'/'),''));
      return re;
    });

    var splitStrings = protoString.split(/<(img|link|script).*(src|href)=['"](?!(http|https):\/\/|\/).+['"].*(>)/gmi);
    //console.log(splitStrings);
    var cnt=0;
    var re = splitStrings.reduce(function (previousValue, currentValue, index) {
      if(currentValue == undefined){
        previousValue = '' + previousValue + opMatches[cnt];
        cnt++;
      } else if(!/^href$/i.test(currentValue) && !/^src$/i.test(currentValue) && !/^>$/i.test(currentValue) && !/^link$/i.test(currentValue) && !/^script$/i.test(currentValue) && !/^img$/i.test(currentValue)){
        previousValue = '' + previousValue + currentValue;
      }
    
      return previousValue;
    });
    cb(null, re);
  };
  var reT = new Transform();
  reT.opt_ = opt;
  return reT;
}

function opStatics(opt,filePath) {

  if(!fs.existsSync(filePath)){
    throw new PluginError(PLUGIN_NAME, filePath+' does not exist!!!');
  }



  var sum =md5File(filePath);
  var tmpPath;
  if(/\.(js|jsx)$/i.test(filePath)){
    tmpPath = filePath.replace(path.join(opt.rootPathJS,'/'),'');
  }else if(/\.(css)$/i.test(filePath)){
    tmpPath = filePath.replace(path.join(opt.rootPathCSS,'/'),'');
  }else if(/\.(jpg|png|gif|jpeg|bmp)$/i.test(filePath)){
    tmpPath = filePath.replace(path.join(opt.rootPathIMG,'/'),'');
  }else {
    tmpPath = filePath.replace(path.join(process.cwd(),'/'),'');
  }



  var distPath = modifyFilename(tmpPath,function (filename, ext) {

    if(opt.md5){
      if(ext == '.css' || ext == '.js'){
        return  filename+'-'+sum+ext;
      }else{
        return sum+ext;
      }
    }else{
      return  filename+ext;
    }
  });
  distPath = path.join( opt.staticPath, distPath);

  //copy文件
  var distPathDir = path.dirname(distPath);
  if(!fs.existsSync(distPathDir)){

    execFun('mkdir -p '+distPathDir+'; cp '+filePath+' '+distPath, function(error, stdout, stderr){
      if (error !== null) {
        console.log('exec error:'+ error);
      }
    });
  }else {

    execFun('cp '+filePath+' '+distPath, function(error, stdout, stderr){
      if (error !== null) {
        console.log('exec error:'+ error);
      }
    });
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
    opt.rootPathIMG = path.join(process.cwd(),(opt.rootPathIMG || ''),'/');
    opt.rootPathCSS = path.join(process.cwd(),(opt.rootPathCSS || ''),'/');
    opt.rootPathJS = path.join(process.cwd(),(opt.rootPathJS || ''),'/');


    if(opt.aliasPath &&( typeof opt.aliasPath !='object' || !/^\{.+:.+}$/.test(JSON.stringify(opt.aliasPath)))){
      throw new PluginError(PLUGIN_NAME, 'aliasPath`s value must like {"originalPath":"aliasPath"}');
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
      //opt.base = path.dirname(file.path);
      //opt.path = file.path;
      var newOpt = Object.assign({},opt,{
        base:path.dirname(file.path),
        path:file.path
      });
      file.contents = file.contents.pipe(htmlTransform(newOpt));
    }

    // 告诉 stream 转换工作完成
    return cb(null, file);

  });

  // 返回文件 stream
  return stream;
}

// 暴露（export）插件的主函数
module.exports = htmlHelper;