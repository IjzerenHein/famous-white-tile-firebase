/*globals require*/
require.config({
    shim: {

    },
    paths: {
        famous: '../lib/famous',
        requirejs: '../lib/requirejs/require',
        almond: '../lib/almond/almond',
        firebase: '../lib/firebase/firebase',
        'famous-sizemodifier': '../lib/famous-sizemodifier/SizeModifier',
        'famous-boxlayout': '../lib/famous-boxlayout/BoxLayout'
    },
    packages: [

    ]
});
require(['main']);
