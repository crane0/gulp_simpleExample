/*
* 这个文件实现了全自动化的重构
*   （1）添加了 'liveReload'任务
*   （2）添加了自动开启连接
*   （3）在每个构建任务（除了默认任务，监视任务，livereload任务）后添加了 .pipe(connect.reload())
* */

// 引入 gulp
const gulp = require('gulp');
//用于合并 js/css
const concat = require('gulp-concat');
//用于压缩 js
const uglify = require('gulp-uglify');
//用于重命名文件
const rename = require('gulp-rename');
//用于编译 less
const less = require('gulp-less');
//用于压缩 css
const cleanCss = require('gulp-clean-css');
//用于压缩 html
const htmlmin = require('gulp-htmlmin');

//用于实现，实时重构
const connect = require('gulp-connect');
//用于实现，自动打开浏览器访问（并实时刷新浏览器）
const open = require('open');

/*
* 这个在该项目中没有具体实现，这里说明使用效果：
* 当引入了这个“自动引入插件”的插件之后，其他的插件就不用在引入了，
*   只要下载了，就可以直接在该项目中使用。
*   比如，.pipe(less())中，就可以这样写：.pipe($.less())
* */
var $ = require('gulp-load-plugins');


/*
* 定义任务，用于 打包构建特定的资源，jsTask（可以是任意名字）
* 这里是，定义处理 js的任务。
* */
gulp.task('jsTask', function () {
    return gulp.src('src/js/*.js')      //操作的源文件
        /*
        * pipe()方法，都是在内存中进行各种操作。
        * 读取源文件，合并到该文件(built.js),
        * {newLine:';'}，是为了防止js中，如果有的位置没有写分号，会引起错误
        *   即便之前有分号，再多加一个也是无所谓的。
        * */
        .pipe(concat('built.js',{newLine:';'}))
        .pipe(gulp.dest('dist/js'))     //指定合并后，生成文件的目录
        /*
        *命名（要在压缩之前操作，否则会被压缩后的覆盖）
        * suffix，加后缀，默认会加载 .js 之前
        * */
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())    //压缩
        .pipe(gulp.dest('dist/js'))     //指定压缩后，生成文件的目录
        .pipe(connect.reload())     //全自动构建

});

//定义处理 less的任务。
gulp.task('lessTask',function () {
    return gulp.src('src/less/*.less')
        .pipe(less())   //编译less
        /*
        *指定编译后，生成文件的目录,
        *这里不能直接生成到 dist目录，
        *   因为需要引入到 css中，最后将 css文件引入 dist目录
        * */
        .pipe(gulp.dest('src/css'))
        .pipe(connect.reload())     //全自动构建
});

/*
*定义处理css的任务
*因为在处理 css之前，先要处理 less，所以这样配置，先执行 lessTask 任务
*所以，最后在关联任务时，就不需要在关联 lessTask任务了。
* */
gulp.task('cssTask',['lessTask'],function () {
    return gulp.src('src/css/*.css')
        .pipe(concat('built.css'))
        .pipe(gulp.dest('dist/css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(cleanCss({compatibility: 'ie8'}))     //兼容性，最低支持和到 ie8
        .pipe(gulp.dest('dist/css'))
        .pipe(connect.reload())     //全自动构建
})

/*
* 定义处理 html的任务
* 注意，生成到 dist目录下的 index.html中，引入的 css和 js资源路径，默认都会添加 dist前缀，
*   有因为已经在 dist目录下的，所以要在构建之前，手动将源 html中的资源路径做出修改！
* */
gulp.task('htmlTask', function() {
    return gulp.src('index.html')
        .pipe(htmlmin({collapseWhitespace: true}))  //清除空格
        .pipe(gulp.dest('dist'))
        .pipe(connect.reload())     //全自动构建
})

// 定义默认任务(关联了 n个其它任务)，如果直接使用 gulp命令，执行的就是 default任务。
gulp.task('default', ['jsTask','cssTask','htmlTask']);

/*
* 半自动化重构（需要手动刷新浏览器）：
* 定义监视任务，
* 当对对应的源文件（监视指定的文件）做出修改后，自动执行对应的任务
* */
gulp.task('watch', ['default'], function () {
    //监视指定的文件, 并指定对应的处理任务
    gulp.watch('src/js/*.js', ['jsTask']);
    gulp.watch(['src/css/*.css','src/less/*.less'], ['cssTask','lessTask']);
})


/*
* 全自动重构 :当对对应的源文件（监视指定的文件）做出修改后，自动执行对应的任务
*   并且浏览器会自动刷新！
* 当执行 liveReload任务时（open方法），就会自动打开 index.html页面
* */
gulp.task('liveReload',function () {
    //配置加载的选项
    connect.server({
        root : 'dist/',     //监视的源目标文件路径
        livereload : true,  //是否实时刷新
        port : 5000         //开启端口号
    });

    //自动开启连接（不能放在全局中，否则 index.html页面会找不到）
    open('http://localhost:5000');

    gulp.watch('src/js/*.js', ['jsTask']);
    gulp.watch(['src/css/*.css','src/less/*.less'], ['cssTask','lessTask']);
})

