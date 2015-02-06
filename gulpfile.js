var gulp    = require("gulp");
var include = require("gulp-include");
var coffee  = require("gulp-coffee");
var to5     = require("gulp-6to5");
var jshint  = require("gulp-jshint");

gulp.task("default", function() {
    gulp.src("src/*.coffee")
        .pipe(include())
        .pipe(coffee())
        .pipe(gulp.dest("dist"));

    gulp.src("src/*.js")
    	.pipe(jshint())
    	.pipe(to5())
    	.pipe(gulp.dest("dist"));
});
