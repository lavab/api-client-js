var gulp = require('gulp'),
sourcemaps = require('gulp-sourcemaps'),
uglify = require('gulp-uglify'),
babel = require('gulp-babel'),
jshint = require('gulp-jshint'),
ng = require('gulp-ng-annotate'),
rename = require('gulp-rename');

gulp.task('default', function() {
    gulp.src('src/*.js')
    	.pipe(jshint())
		.pipe(sourcemaps.init())
    	.pipe(babel())		
		.pipe(ng())
		.pipe(gulp.dest('dist'))
		.pipe(rename({
			extname: '.min.js'
		}))
		.pipe(uglify())
		.pipe(sourcemaps.write('.'))
    	.pipe(gulp.dest('dist'));
});
