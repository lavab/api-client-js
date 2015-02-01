var gulp   = require("gulp");
var to5    = require("gulp-6to5");
var jshint = require("gulp-jshint");

gulp.task("default", function() {
    gulp.src("src/*.js")
    	.pipe(jshint())
    	.pipe(to5())
    	.pipe(gulp.dest("dist"));
});
