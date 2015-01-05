var gulp    = require("gulp");
var include = require("gulp-include");
var coffee  = require("gulp-coffee")

gulp.task("default", function() {
    gulp.src("src/*.coffee")
        .pipe(include())
        .pipe(coffee())
        .pipe(gulp.dest("dist"));
});
