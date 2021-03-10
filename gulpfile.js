let del = require('del');
let gulp = require('gulp');
let inquirer = require('inquirer');
let requireDir = require('require-dir');

let seriesIf = require('./gulp/utils/seriesIf');

requireDir('./gulp/tasks');

// 執行一切建置（除了 HTML 和 ServiceWorker 以外）
gulp.task('build', gulp.parallel(
	'static',
	'donate',
	'core',
	'worker',
	'css',
	'locale',
	'app'
));

gulp.task('update', gulp.series(
	'version',
	'html',
	'sw'
));

gulp.task('deployDev', gulp.series(
	'build',
	'update',
	'uploadDev'
));

gulp.task('deployPub', () => seriesIf(
	async () => {
		let answers = await inquirer.prompt([{
			type: 'confirm',
			message: '請記得在發布之前更新版本號、加入更新 log、並適度修改 README.md。確定發布到正式版？',
			name: 'ok'
		}])
		return answers.ok;
	},
	'build',
	'update',
	'uploadPub'
));

// 清除一切建置檔案
gulp.task('clean', () => del(['dist', 'debug/*.*']));

// 預設建置，會建置到可以在本地執行的程度；
// 在 VS Code 裡面按下 F5 預設就會執行這個建置動作
gulp.task('default', gulp.series('html', 'build'));
