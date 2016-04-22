# gulp-html-helper

## Install

`npm install --save-dev gulp-html-helper `

## Usage


```
var gulp = require('gulp');
var htmlHelper = require('gulp-html-helper');

var option = {
    staticPath: '_devTmp/static',
    urlBasePath: 'static/',
    aliasPath: {'originalPath':'aliasPath'},
    md5:true
}

gulp.task('default', function () {
    return gulp.src('src/*.html')
        .pipe(htmlHelper(option))
        .pipe(gulp.dest('dist'));
});

```

## Option

- staticPath: html里面引用的静态资源被输出的目的目录（必填项）
- urlBasePath:html里面引用的静态资源链接的公共路径（默认为'/'）
- aliasPath:处理前,将HTML里面的静态资源引用链接做指定替换处理（不设置,则不做替换处理）
- md5:处理链接时,是否加上md5

## Example

**ps:htmlHelper只处理相对路径的引用连接**

option配置如下

```
var option = {
    staticPath: '_devTmp/static',
    urlBasePath: 'static/',
    aliasPath: {'originalPath':'aliasPath'},
    md5:true
}
```

处理前的html

```
<!doctype html>
<html>
<head>
    <meta charset="utf-8"/>
    <meta http-equiv="x-ua-compatible" content="ie=edge"/>
    <title>react-babel</title>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <link href="../cssStyle/aa.css">
</head>
<body>
<div id="app"></div>

<a href="/a/s"></a>
<img src="../img/pic20160106.jpg">
<script src="https://static.qbox.me/webClint/jsPlugins/plugins/for_react_babel/react-with-addons.min.js"></script>
<script src="https://static.qbox.me/webClint/jsPlugins/plugins/for_react_babel/react-dom.min.js"></script>



<script src="/jsEntries/index.js"></script>
<script src="../jsEntries/index.js"></script>
</body>
</html>

```

处理后的html

```
<!doctype html>
<html>
<head>
    <meta charset="utf-8"/>
    <meta http-equiv="x-ua-compatible" content="ie=edge"/>
    <title>react-babel</title>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <link href="static/aa-d555e48d71746b90d810522ae7445f45.css">
</head>
<body>
<div id="app"></div>

<a href="/a/s"></a>
<img src="static/5df5003623c86ad78e83fb55f825f008.jpg">
<script src="https://dn-xiaoying-static.qbox.me/webClint/jsPlugins/plugins/for_react_babel/react-with-addons.min.js"></script>
<script src="https://dn-xiaoying-static.qbox.me/webClint/jsPlugins/plugins/for_react_babel/react-dom.min.js"></script>



<script src="/jsEntries/index.js"></script>
<script src="static/index-596eb908f90deafc0ab196444e478eb1.js"></script>
</body>
</html>
```

staticPath指定Path:_devTmp/static下的静态文件
- 5df5003623c86ad78e83fb55f825f008.jpg
- aa-d555e48d71746b90d810522ae7445f45.css
- index-596eb908f90deafc0ab196444e478eb1.js


##Todo

小的图片直接base64