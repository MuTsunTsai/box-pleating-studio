let gulp = require('gulp');
let ts = require('gulp-typescript');
let wrapJS = require("gulp-wrap-js");
let ifAnyNewer = require('gulp-if-any-newer');
let sourcemaps = require('gulp-sourcemaps');
let concat = require('gulp-concat');
let terser = require('gulp-terser');
let ftp = require('vinyl-ftp');
let log = require('fancy-log');

let gvpd = require('./.vscode/gvpd');
let crc = require('./.vscode/crc');
let i18n = require('./.vscode/i18n');

let projCore = ts.createProject('src/core/tsconfig.json');
let projService = ts.createProject('src/service/tsconfig.json');
let projTest = ts.createProject('test/tsconfig.json');

let terserOption = {
	compress: {
		drop_console: false,
		drop_debugger: false
	}
};

// 更新模組
gulp.task('update', () => (
	gulp.src("../shrewd/dist/shrewd.min.js")
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../../shrewd/src' }))
		.pipe(crc())
		.pipe(gulp.dest('dist/')),
	gulp.src("../shrewd/dist/*.d.ts")
		.pipe(gulp.dest('src/core/global'))
));

gulp.task('buildCore', () =>
	projCore.src()
		.pipe(ifAnyNewer("dist", { filter: 'bpstudio.js' }))
		.pipe(sourcemaps.init())
		.pipe(projCore())
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../src/core' }))
		.pipe(gulp.dest('dist/'))
);

gulp.task('buildCorePub', () =>
	projCore.src()
		.pipe(projCore())
		.pipe(wrapJS(
			`(function(root,factory){if(typeof define==='function'&&define.amd)
			{define([],factory);}else if(typeof exports==='object'){module.exports=factory();}
			else{root.BPStudio=factory();}}(this,function(){ %= body % ;return BPStudio;}));`
		))
		.pipe(terser(Object.assign({}, terserOption, { mangle: true })))
		.pipe(crc())
		.pipe(gulp.dest('dist/')),
	gulp.src('dist/bpstudio.css')
		.pipe(crc())
);

gulp.task('buildService', () =>
	projService.src()
		.pipe(ifAnyNewer("dist", { filter: 'sw.js' }))
		.pipe(projService())
		.pipe(gulp.dest('dist/'))
);

gulp.task('buildTest', () =>
	projTest.src()
		.pipe(sourcemaps.init())
		.pipe(projTest())
		.pipe(wrapJS("let Shrewd=require('../dist/Shrewd.js');%= body %"))
		.pipe(sourcemaps.write('.', { includeContent: false }))
		.pipe(gulp.dest('test/'))
);

gulp.task('buildApp', () =>
	gulp.src([
		'src/app/header.js',
		'src/app/components/mixins/*.ts',
		'src/app/components/**/*.vue',
		'src/app/footer.js'
	])
		.pipe(gvpd())
		.pipe(concat('main.js'))
		.pipe(terser(terserOption))
		.pipe(crc())
		.pipe(gulp.dest('dist/')),
	gulp.src('dist/main.css')
		.pipe(crc())
);

gulp.task('buildLocale', () =>
	gulp.src('src/locale/*.json')
		.pipe(i18n())
		.pipe(concat('locale.js'))
		.pipe(wrapJS("let locale={};%= body %"))
		.pipe(terser())
		.pipe(crc(['dist/index.htm', 'dist/donate.htm']))
		.pipe(gulp.dest('dist/'))
)

gulp.task('buildDonate', () =>
	gulp.src([
		'src/donate/main.vue',
		'src/donate/main.js',
	])
		.pipe(gvpd())
		.pipe(concat('donate.js'))
		.pipe(terser())
		.pipe(crc('dist/donate.htm'))
		.pipe(gulp.dest('dist/'))
);


gulp.task('uploadPub', function() {
	let options = require('./.vscode/ftp-pub.json');
	options.log = log;
	let conn = ftp.create(options);
	var globs = [
		'dist/**/*',
		'!**/*.map',
		'!**/debug.log'
	];
	return gulp.src(globs, { base: './dist', buffer: false })
		.pipe(conn.newer('/public_html/bp'))
		.pipe(conn.dest('/public_html/bp/'));
});

gulp.task('deployPub', gulp.series(
	'buildCorePub',
	'uploadPub'
));

gulp.task('default', gulp.series('buildCore'));
