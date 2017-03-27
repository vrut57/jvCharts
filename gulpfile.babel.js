import gulp from 'gulp';
import gulpify from 'gulpify';
import uglify from 'gulp-uglify';
import babel from 'babelify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import sourcemaps from 'gulp-sourcemaps';
import buffer from 'gulp-buffer';

var files = [
    './src/jv.js',
    './src/visuals/jvBar.js',
    './src/visuals/jvPie.js',
    './src/visuals/jvLine.js',
    './src/visuals/jvScatter.js',
    './src/jvCharts.js',
    './src/jvVars.js',
    './src/jvTip.js'
  ];

gulp.task('build', function(){
  var bundler = browserify(files, { debug: true }).transform(babel);

  bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('jvcharts-min.js'))
      .pipe(buffer())
      // .pipe(gulpify())
      .pipe(uglify())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./maps'))
      .pipe(gulp.dest('./'));
});