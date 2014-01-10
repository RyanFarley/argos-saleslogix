var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var csso = require('gulp-csso');
var rename = require('gulp-rename');
var lr = require('tiny-lr');
var refresh = require('gulp-livereload');
var server = lr();

gulp.task('jshint', function() {
    gulp.src('src/**/*.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(refresh(server));
});

gulp.task('less', function() {
    gulp.src('content/css/*.less')
        .pipe(less())
        .pipe(rename('app.min.debug.css'))
        .pipe(gulp.dest('min/css'))
        .pipe(csso())
        .pipe(rename('app.min.css'))
        .pipe(gulp.dest('min/css'))
        .pipe(refresh(server));
});

gulp.task('default', function() {
});

gulp.task('watch', function() {
    server.listen(35729, function(err) {
        if(err) {
            console.log(err);
        }

        gulp.watch(['src/**/*.js', 'configuration/**/*.js', '../../argos-sdk/src/**/*.js'], function(event) {
            gulp.run('jshint');
        });

        gulp.watch(['content/**/*.less'], function(event) {
            gulp.run('less');
        });
    });
});
