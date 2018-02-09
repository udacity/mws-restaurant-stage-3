const gulp = require('gulp');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify-es').default;
const cleanCSS = require('gulp-clean-css');
const babel = require('gulp-babel');
const browserSync = require('browser-sync').create();


gulp.task('css', () => {
  return gulp.src('css/*.css')
    .pipe(cleanCSS({ level: 2 }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('js', () => {
  return gulp.src('js/*.js')
    .pipe(babel({ presets: ['env'] }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('build', [
  'css',
  'js'
]);

gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: './'
    },
  })
});

gulp.task('watch', ['serve'], function () {
  gulp.watch('css/*.css', ['css']);
  gulp.watch('dist/css/*.min.css', ['css']);
  gulp.watch('js/*.js', ['js']);
  gulp.watch('*.html', browserSync.reload);
});

gulp.task('default', ['watch']);
