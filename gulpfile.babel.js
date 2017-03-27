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
    './src/jvCharts.js',
    './src/jvVars.js',
    './src/jvTip.js',
    './src/jvBrush.js',
    './src/jvComment.js',
    './src/jvEdit.js',
    './src/visuals/jvBar.js',
    './src/visuals/jvPie.js',
    './src/visuals/jvLine.js',
    './src/visuals/jvScatter.js',
    './src/visuals/jvArea.js',
    './src/visuals/jvGantt.js',
    './src/visuals/jvHeatmap.js',
    './src/visuals/jvPack.js',
    './src/visuals/jvRadial.js',
    './src/visuals/jvSankey.js',
    './src/visuals/jvSingleAxis.js',
    './src/visuals/jvSunburst.js',
    './src/visuals/jvTreemap.js',
    './src/visuals/jvWordCloud.js'
  ];

gulp.task('build', function(){
  var bundler = browserify(files, { debug: true }).transform(babel);

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