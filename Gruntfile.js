module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  var pkg = grunt.file.readJSON('package.json');

  //grunt.file.defaultEncoding = 'utf8';
  //grunt.file.preserveBOM = false;

  grunt.initConfig({
    clean: {
      dev: ['publish/*'],
      publish: ['release/*', 'doc/output/*']
    },
    concat: {
      dev: {
        options: {
          separator: '\n',
          stripBanners: true,
          banner: '/*! ' + pkg.name + ' - v' + pkg.version + ' - ' + (new Date()).toString() + ' */\n'
        },
        files: {
          'publish/skylink.debug.js': ['source/exports.js'],
          'publish/skylink.complete.js': [
            'node_modules/socket.io-client/socket.io.js',
            'node_modules/adapterjs/publish/adapter.screenshare.js',
            'publish/skylink.debug.js'
          ]
        }
      }
    },
    uglify: {
      publish: {
        options: {
          mangle: false,
          drop_console: false,
          compress: {
            drop_console: false
          }
        },
        files: {
          'publish/skylink.min.js': ['publish/skylink.debug.js'],
          'publish/skylink.complete.min.js': ['publish/skylink.complete.js']
        }
      }
    },
    jshint: {
      dev: {
        options: grunt.util._.merge({
          node: true
        }, grunt.file.readJSON('.jshintrc')),
        src: [
          //'package.json',
          'Gruntfile.js',
          'source/components/*.js',
          'source/skylink.js',
          'source/skylinklogs.js'
        ]
      }
    },
    includereplace: {
      dev: {
        options: {
          globals: {
            version: pkg.version
          }
        },
        src: ['publish/*.js'],
        dest: './'
      }
    },
    yuidoc: {
      publish: {
        name: pkg.name,
        description: pkg.description,
        version: pkg.version,
        url: pkg.homepage,
        options: {
          paths: ['source/'],
          outdir: 'doc/content/data',
          parseOnly: true
          //themedir: 'doc/theme',
          //helpers: ['doc/theme/helpers/helpers.js'],
          //linkNatives: true
        }
      }
    },
    compress: {
      publish: {
        options: {
          mode: 'gzip'
        },
        expand: true,
        cwd: 'publish/',
        src: ['*.js'],
        dest: 'release/'
      }
    },
    copy: {
      publish: {
        files: [{
          expand: true,
          cwd: 'doc/',
          src: ['**'],
          dest: 'release/doc/'
        }]
      }
    }
  });

  /**
   * Task for development purposes.
   * - Compiles source/ files to publish/ folder for testing.
   */
  grunt.registerTask('dev', ['jshint:dev', 'clean:dev', 'concat:dev', 'includereplace:dev']);
  /**
   * Task for release purposes. Use release/ folder for CDN publish.
   * - Compiles minified production ready source/ files to publish/ folder.
   * - Compiles source/ files to doc/ folder for documentation. This uses the doc-style for the theme layout.
   * - Gzips files for CDN release purposes.
   */
  grunt.registerTask('publish', ['dev', 'clean:publish', 'uglify:publish',
    'yuidoc:publish', 'compress:publish', 'copy:publish']);
  /**
   * [DEPRECATED] Task to compile documentation.
   * - Compiles source/ files to doc/ folder for documentation. This uses the doc-style for the theme layout.
   */
  grunt.registerTask('doc', ['yuidoc:publish']);
};
