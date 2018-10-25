let gulp = require('gulp'),
  webp = require('gulp-webp'),
  uglify = require('gulp-uglifyes'),
  cssnano = require('gulp-cssnano');

gulp.task('images', () => {
  return gulp.src('img/*.jpg')
    .pipe(webp())
    .pipe(gulp.dest('dist/img/'));
});
gulp.task('css', () => {
  return gulp.src('css/*.css')
    .pipe(cssnano())
    .pipe(gulp.dest('dist/css/'));
});
gulp.task('js', () => {
  return gulp.src('js/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'))
});

gulp.task('default', [ 'images', 'css', 'js' ]);
