module.exports = function(grunt) {
    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: ['src/**/*.js']
        },
        connect: {
            server: {
                options: {
                    port: 8000,
                    hostname: '127.0.0.1',
                    base: '../../'
                }
            }
        },
        jasmine: {
            src: ['src/**/*.js'],
            options: {
                specs: 'tests/**/*.spec.js',
                host: 'http://127.0.0.1:8000/products/argos-saleslogix/',
                template: 'GruntRunner.tmpl'
            }
        },
        less: {
            development: {
                options: {
                    paths: ['content/css']
                },
                files: {
                    'min/css/app.min.debug.css': 'content/css/app.less'
                }
            },
            production: {
                options: {
                    paths: ['content/css'],
                    yuicompress: true
                },
                files: {
                    'min/css/app.min.css': 'content/css/app.less'
                }
            }
        },
        coffee: {
            options: {
                sourceMap: true,
                bare: true
            },
            glob_to_multiple: {
                expand: true,
                flatten: true,
                cwd: 'src-coffee',
                src: ['*.coffee'],
                dest: 'src',
                ext: '.js'
            }
        },
        watch: {
            options: {
                livereload: true
            },
            coffee: {
                options: {
                    livereload: false
                },
                files: ['src-coffee/**/*.coffee'],
                tasks: ['coffee']
            },
            scripts: {
                files: ['src/**/*.js', 'configuration/**/*.js', '../../argos-sdk/src/**/*.js'],
                tasks: ['jshint'],
                options: {
                    spawn: false
                }
            },
            less: {
                // To get livereload to work with less files, you need to go into node_modules\grunt-contrib-watch\node_modules\tiny-lr\lib\public\livereload.js
                // and modify the reloadLess function and remove the cache busting code.
                // See: https://github.com/mklabs/tiny-lr/issues/22#issuecomment-34702527
                files: ['content/**/*.less'],
                tasks: ['less'],
                options: {
                    spawn: false
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-coffee');

    grunt.registerTask('test', ['connect', 'jasmine']);
    grunt.registerTask('default', ['test']);
};
