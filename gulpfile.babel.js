import gulp from 'gulp';
import gulpify from 'gulpify';
import uglify from 'gulp-uglify';
import babel from 'babelify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import sourcemaps from 'gulp-sourcemaps';
import buffer from 'gulp-buffer';

gulp.task('build', function(){
  var bundler = browserify(['./src/jv.js'], { debug: true }).transform(babel);

  bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('jvcharts.min.js'))
      // .pipe(buffer())
        //doesnt work -  .pipe(gulpify())
      // .pipe(uglify())
      // .pipe(sourcemaps.init({ loadMaps: true }))
      // .pipe(sourcemaps.write('./maps'))
      .pipe(gulp.dest('./'));
});

gulp.task('watch', function(){
  gulp.watch(['./src/**/*'], ['build']);
});